import torch
import torch.nn as nn
import numpy as np

# State label map for human-readable output
STATE_LABELS = {0: "Idle", 1: "Concentric (Up)", 2: "Eccentric (Down)"}


class MotionGRU(nn.Module):
    def __init__(
        self,
        input_size: int = 132,
        hidden_size: int = 64,
        num_layers: int = 2,
        num_classes: int = 3,
        dropout: float = 0.3,
    ):
        super(MotionGRU, self).__init__()
        # input_size : 132  (33 landmarks × 4 coords: x, y, z, visibility)
        # num_classes: 3    (0=Idle, 1=Concentric/Up, 2=Eccentric/Down)

        # BUG FIX 1: No dropout was applied between GRU layers.
        # Without dropout, the model overfits quickly on small training sets.
        self.gru = nn.GRU(
            input_size,
            hidden_size,
            num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,  # dropout only between layers
        )

        # BUG FIX 2: Single linear head with no activation is fine for logits,
        # but adding a LayerNorm before the FC improves stability during training.
        self.norm = nn.LayerNorm(hidden_size)
        self.fc   = nn.Linear(hidden_size, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch, seq_len, input_size)
        out, _ = self.gru(x)
        # Take only the last time-step output
        out = self.norm(out[:, -1, :])   # BUG FIX 2: apply norm before FC
        out = self.fc(out)
        return out   # raw logits — caller applies softmax if needed


def predict_motion_state(
    window_data,          # list or ndarray of shape (seq_len, 132)
    model: MotionGRU,
    device: str = "cpu",
) -> dict:
    """
    Takes a window of frames (default 30) and predicts the current motion state.

    Returns a dict with:
        - state_id    (int)   : 0, 1, or 2
        - state_label (str)   : "Idle" / "Concentric (Up)" / "Eccentric (Down)"
        - confidence  (float) : softmax probability of the predicted class
    """
    # BUG FIX 3: window_data was never validated. If it's empty or has wrong
    # shape, torch.FloatTensor raises cryptic size-mismatch errors.
    if window_data is None or len(window_data) == 0:
        return {"state_id": 0, "state_label": "Idle", "confidence": 0.0}

    arr = np.array(window_data, dtype=np.float32)
    if arr.ndim != 2 or arr.shape[1] != 132:
        raise ValueError(
            f"window_data must have shape (seq_len, 132). Got {arr.shape}."
        )

    # BUG FIX 4: model was always run on CPU even if a GPU was available,
    # and device was never passed in. Added device parameter.
    model = model.to(device)
    model.eval()

    with torch.no_grad():
        tensor_data = torch.from_numpy(arr).unsqueeze(0).to(device)  # (1, seq_len, 132)
        logits = model(tensor_data)

        # BUG FIX 5: Old code returned only the argmax state ID.
        # No confidence score was exposed, making it impossible to threshold
        # low-confidence predictions (which should fall back to "Idle").
        probabilities = torch.softmax(logits, dim=1).squeeze(0)       # (num_classes,)
        state_id      = int(torch.argmax(probabilities).item())
        confidence    = float(probabilities[state_id].item())

    return {
        "state_id":    state_id,
        "state_label": STATE_LABELS.get(state_id, "Unknown"),
        "confidence":  round(confidence, 4),
    }


def load_model(checkpoint_path: str, device: str = "cpu") -> MotionGRU:
    """
    BUG FIX 6: There was no utility to load a saved model checkpoint.
    Without this, the model is always randomly initialised (untrained),
    meaning predict_motion_state returns random class labels every time.

    Usage:
        model = load_model("checkpoints/motion_gru.pt")
        result = predict_motion_state(window, model)
    """
    model = MotionGRU()
    state_dict = torch.load(checkpoint_path, map_location=device)

    # Support both raw state_dict saves and {'model_state_dict': ...} saves
    if "model_state_dict" in state_dict:
        state_dict = state_dict["model_state_dict"]

    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    return model