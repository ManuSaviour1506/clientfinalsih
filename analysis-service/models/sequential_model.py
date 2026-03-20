import torch
import torch.nn as nn

class MotionGRU(nn.Module):
    def __init__(self, input_size=132, hidden_size=64, num_layers=2, num_classes=3):
        super(MotionGRU, self).__init__()
        # input_size: 132 (33 landmarks * 4 coords)
        # num_classes: 3 (0: Idle, 1: Concentric/Up, 2: Eccentric/Down)
        self.gru = nn.GRU(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, num_classes)

    def forward(self, x):
        # x shape: (batch, seq_len, input_size)
        out, _ = self.gru(x)
        # We only take the output of the last time step for classification
        out = self.fc(out[:, -1, :])
        return out

def predict_motion_state(window_data, model):
    """
    Takes a window of 30 frames and predicts the current motion state.
    Used for professional rep counting and form detection.
    """
    model.eval()
    with torch.no_grad():
        tensor_data = torch.FloatTensor(window_data).unsqueeze(0) # Add batch dim
        logits = model(tensor_data)
        state = torch.argmax(logits, dim=1).item()
    return state