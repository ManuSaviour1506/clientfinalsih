# models/scoring.py
import numpy as np  # BUG FIX 1: np was used everywhere but never imported — instant NameError crash
from scipy.signal import find_peaks


def evaluate_performance(
    angle_time_series: list,
    velocity_series: list,
    test_type: str = "generic"
) -> dict:
    """
    Signal-processing based performance evaluator.
    Uses peak detection for rep counting and velocity decay for fatigue.
    Returns a standardised result dict including score_out_of_10 and score_reason.
    """

    # BUG FIX 2: No guard against empty inputs.
    # find_peaks on an empty array raises ValueError; np.mean on [] raises warning and returns nan.
    if not angle_time_series:
        return {
            "score": 0,
            "score_out_of_10": 0.0,
            "score_reason": "No angle data recorded — no movement detected.",
            "fatigue": "N/A",
            "stability": "N/A",
        }

    angle_arr = np.array(angle_time_series, dtype=np.float32)

    # ── Rep Counting via Peak Detection ──────────────────────────────
    # BUG FIX 3: find_peaks(-angle_arr, height=-90) finds peaks in the
    # NEGATED series where value > -90, i.e. original angle < 90.
    # BUT `height` in find_peaks means minimum peak height in the negated
    # series — so height=-90 means angle must be BELOW 90, which is correct.
    # However `distance=20` assumes 30fps video (≈0.67s between reps).
    # Added `prominence` filter to avoid counting noise as reps.
    peaks, peak_props = find_peaks(
        -angle_arr,
        distance=20,
        height=-90,
        prominence=10   # BUG FIX 3b: without prominence, small noise bumps count as reps
    )
    rep_count = len(peaks)

    # ── Fatigue Analysis ─────────────────────────────────────────────
    fatigue_index = 100.0  # default: 100% efficiency (no fatigue)
    fatigue_label = "None"

    if velocity_series and len(velocity_series) >= 8:
        vel_arr = np.array(velocity_series, dtype=np.float32)
        quarter = max(1, len(vel_arr) // 4)
        early_velocity = np.mean(vel_arr[:quarter])
        late_velocity  = np.mean(vel_arr[-quarter:])

        # BUG FIX 4: Division by zero when early_velocity is 0 (static video).
        if early_velocity > 1e-6:
            fatigue_index = round((late_velocity / early_velocity) * 100, 2)
        else:
            fatigue_index = 0.0

        if fatigue_index < 50:
            fatigue_label = "High"
        elif fatigue_index < 70:
            fatigue_label = "Moderate"
        elif fatigue_index < 85:
            fatigue_label = "Mild"
        else:
            fatigue_label = "None"
    else:
        # BUG FIX 5: velocity_series could be empty; old code would crash
        # on velocity_series[:len//4] when len is 0.
        fatigue_index = 100.0

    # ── Stability ────────────────────────────────────────────────────
    angle_std = float(np.std(angle_arr))
    stability = "High" if angle_std < 15 else ("Moderate" if angle_std < 30 else "Variable")

    # ── /10 Scoring ──────────────────────────────────────────────────
    # BUG FIX 6: Old code returned raw rep_count as "score" with no /10 normalisation.
    # Scoring: rep count (0-5 pts) + fatigue efficiency (0-3 pts) + stability (0-2 pts)

    # Rep score (0-5 pts)
    if rep_count == 0:
        rep_pts = 0.0
    elif rep_count <= 5:
        rep_pts = 2.0
    elif rep_count <= 10:
        rep_pts = 3.0
    elif rep_count <= 20:
        rep_pts = 4.0
    else:
        rep_pts = 5.0

    # Fatigue/efficiency score (0-3 pts)
    if fatigue_label == "None":
        fatigue_pts = 3.0
    elif fatigue_label == "Mild":
        fatigue_pts = 2.0
    elif fatigue_label == "Moderate":
        fatigue_pts = 1.0
    else:
        fatigue_pts = 0.0

    # Stability score (0-2 pts)
    if stability == "High":
        stability_pts = 2.0
    elif stability == "Moderate":
        stability_pts = 1.0
    else:
        stability_pts = 0.0

    score_out_of_10 = round(min(rep_pts + fatigue_pts + stability_pts, 10.0), 1)

    score_reason = (
        f"Detected {rep_count} rep(s) via peak detection ({rep_pts}/5 pts). "
        f"Velocity efficiency: {fatigue_index}% — fatigue level '{fatigue_label}' ({fatigue_pts}/3 pts). "
        f"Angle std deviation: {round(angle_std,1)}° — stability '{stability}' ({stability_pts}/2 pts)."
    )

    return {
        "score": rep_count,
        "score_out_of_10": score_out_of_10,
        "score_reason": score_reason,
        "fatigue": f"{fatigue_index}% efficiency maintained",
        "fatigue_level": fatigue_label,
        "stability": stability,
        "score_breakdown": {
            "rep_pts": rep_pts,
            "fatigue_pts": fatigue_pts,
            "stability_pts": stability_pts,
        }
    }