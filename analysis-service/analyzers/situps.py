import cv2
import mediapipe as mp
import numpy as np
from analyzers.utils import calculate_angle

def count_reps(video_path: str) -> dict:
    mp_pose = mp.solutions.pose
    # BUG FIX: old code never closed pose properly; use context manager
    pose = mp_pose.Pose(min_detection_confidence=0.6, min_tracking_confidence=0.6)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "raw_score": 0, "score_out_of_10": 0,
            "score_reason": "Video could not be opened.",
            "feedback": ["Could not open video."], "report": {}
        }

    counter = 0
    stage = "down"
    rom_data = []               # full angle history
    rep_top_angles = []         # peak crunch angle per rep (should be < 90)
    rep_bottom_angles = []      # extension angle per rep (should be > 160)
    current_rep_min = 180
    velocity_history = []
    total_frames_with_pose = 0

    # BUG FIX: old code used rom_data but never analyzed it for scoring

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if not results.pose_landmarks:
            continue

        total_frames_with_pose += 1
        lm = results.pose_landmarks.landmark

        shoulder = [lm[11].x, lm[11].y]
        hip      = [lm[23].x, lm[23].y]
        knee     = [lm[25].x, lm[25].y]

        angle = calculate_angle(shoulder, hip, knee)
        rom_data.append(angle)

        # Velocity for fatigue
        if len(rom_data) > 1:
            velocity_history.append(abs(rom_data[-1] - rom_data[-2]))

        current_rep_min = min(current_rep_min, angle)

        # BUG FIX: old stage machine could double-count on noisy frames
        # Fixed with strict transition guards
        if angle > 160 and stage == "up":
            stage = "down"
            rep_bottom_angles.append(angle)

        if angle < 80 and stage == "down":
            stage = "up"
            counter += 1
            rep_top_angles.append(current_rep_min)
            current_rep_min = 180

    cap.release()
    pose.close()

    # ── Full Extension Quality ────────────────────────────────────────
    # BUG FIX: old code returned static "Maintain full extension" regardless
    good_extension_reps = sum(1 for a in rep_bottom_angles if a > 155)
    good_crunch_reps    = sum(1 for a in rep_top_angles if a < 85)
    extension_ratio = good_extension_reps / counter if counter > 0 else 0
    crunch_ratio    = good_crunch_reps / counter if counter > 0 else 0

    # ── Fatigue ───────────────────────────────────────────────────────
    fatigue_severity = 0
    if len(velocity_history) > 10:
        early_v = np.mean(velocity_history[:5])
        late_v  = np.mean(velocity_history[-5:])
        drop = (early_v - late_v) / (early_v + 1e-6)
        if drop > 0.5:
            fatigue_severity = 3
        elif drop > 0.3:
            fatigue_severity = 2
        elif drop > 0.15:
            fatigue_severity = 1

    # ── /10 Scoring ───────────────────────────────────────────────────
    # Component 1: Rep count (0-4 pts)
    if counter == 0:
        rep_score = 0.0
    elif counter <= 5:
        rep_score = 2.0
    elif counter <= 15:
        rep_score = 3.0
    elif counter <= 25:
        rep_score = 3.5
    else:
        rep_score = 4.0

    # Component 2: Crunch depth quality (0-2 pts)
    crunch_score = round(crunch_ratio * 2.0, 2)

    # Component 3: Full extension quality (0-2 pts)
    extension_score = round(extension_ratio * 2.0, 2)

    # Component 4: Stamina (0-2 pts)
    stamina_score = [2.0, 1.5, 0.5, 0.0][fatigue_severity]

    raw_total = rep_score + crunch_score + extension_score + stamina_score
    score_out_of_10 = round(min(raw_total, 10.0), 1)

    # ── Reason ───────────────────────────────────────────────────────
    reasons = [
        f"Completed {counter} sit-up(s) ({rep_score}/4 pts).",
        f"Full crunch reps (angle<85°): {good_crunch_reps}/{counter} — {crunch_score}/2 pts.",
        f"Full extension reps (angle>155°): {good_extension_reps}/{counter} — {extension_score}/2 pts.",
        f"Stamina score: {stamina_score}/2 pts ({'no' if fatigue_severity==0 else 'mild' if fatigue_severity==1 else 'significant'} fatigue).",
    ]
    score_reason = " ".join(reasons)

    # ── Feedback ─────────────────────────────────────────────────────
    feedback = []
    if counter == 0:
        feedback.append("No valid sit-ups detected. Ensure camera captures full body.")
    if crunch_ratio < 0.6:
        feedback.append("Incomplete crunch — bring torso closer to knees on the way up.")
    if extension_ratio < 0.6:
        feedback.append("Incomplete extension — lay back fully flat between each rep.")
    if fatigue_severity >= 2:
        feedback.append("Speed dropped considerably — pace yourself for better consistency.")
    if counter > 0 and fatigue_severity == 0 and crunch_ratio >= 0.8:
        feedback.append("Excellent form and endurance throughout the set.")

    report = {
        "total_reps": counter,
        "good_crunch_reps": good_crunch_reps,
        "good_extension_reps": good_extension_reps,
        "fatigue_index": ["None", "Mild", "Moderate", "High"][fatigue_severity],
        "score_breakdown": {
            "rep_score": rep_score,
            "crunch_score": crunch_score,
            "extension_score": extension_score,
            "stamina_score": stamina_score,
        }
    }

    return {
        "raw_score": counter,
        "score_out_of_10": score_out_of_10,
        "score_reason": score_reason,
        "feedback": feedback,
        "report": report,
    }