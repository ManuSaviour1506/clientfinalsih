import cv2
import mediapipe as mp
import numpy as np
from analyzers.utils import calculate_angle

def count_reps(video_path: str) -> dict:
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(min_detection_confidence=0.7, min_tracking_confidence=0.7)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "raw_score": 0, "score_out_of_10": 0,
            "feedback": ["Could not open video."],
            "score_reason": "Video could not be opened for analysis.",
            "report": {}
        }

    counter = 0
    stage = None
    angle_history = []
    velocity_history = []
    unstable_posture_frames = 0
    total_frames_with_pose = 0

    # BUG FIX: track full rep angles to detect partial reps
    rep_peak_angles = []   # lowest angle reached each rep (should be < 90)
    rep_top_angles = []    # highest angle reached each rep (should be > 160)
    current_rep_min = 180

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if not results.pose_landmarks:
            continue

        total_frames_with_pose += 1

        try:
            landmarks = results.pose_landmarks.landmark

            shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                        landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            elbow    = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                        landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            wrist    = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                        landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            hip      = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                        landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]

            angle = calculate_angle(shoulder, elbow, wrist)
            angle_history.append(angle)

            # Track minimum angle this rep for depth scoring
            current_rep_min = min(current_rep_min, angle)

            if len(angle_history) > 1:
                velocity = abs(angle_history[-1] - angle_history[-2])
                velocity_history.append(velocity)

            # Rep state machine
            if angle > 160:
                stage = "up"
                rep_top_angles.append(angle)

            if angle < 90 and stage == "up":
                stage = "down"
                counter += 1
                rep_peak_angles.append(current_rep_min)
                current_rep_min = 180  # reset for next rep

            # Core sag detection: hip should stay aligned with shoulder
            # BUG FIX: threshold tightened; old 0.2 was too loose
            if abs(shoulder[1] - hip[1]) > 0.15:
                unstable_posture_frames += 1

        except Exception:
            pass

    cap.release()
    pose.close()

    # ── Fatigue Analysis ──────────────────────────────────────────────
    fatigue_detected = False
    fatigue_severity = 0  # 0-3 scale
    if len(velocity_history) > 10:
        early_v = np.mean(velocity_history[:5])
        late_v  = np.mean(velocity_history[-5:])
        drop = (early_v - late_v) / (early_v + 1e-6)
        if drop > 0.6:
            fatigue_detected = True
            fatigue_severity = 3
        elif drop > 0.4:
            fatigue_detected = True
            fatigue_severity = 2
        elif drop > 0.2:
            fatigue_severity = 1

    # ── Depth Quality ─────────────────────────────────────────────────
    # BUG FIX: old code never measured rep depth quality
    good_depth_reps = sum(1 for a in rep_peak_angles if a < 85)
    depth_ratio = good_depth_reps / counter if counter > 0 else 0

    # ── Stability ─────────────────────────────────────────────────────
    stability_ratio = 1 - (unstable_posture_frames / max(total_frames_with_pose, 1))

    # ── /10 Scoring ───────────────────────────────────────────────────
    # Component 1: Rep count score (0-4 pts) — based on realistic ranges
    # 0 reps=0, 1-5=2, 6-10=3, 11-15=3.5, 16+=4
    if counter == 0:
        rep_score = 0.0
    elif counter <= 5:
        rep_score = 2.0
    elif counter <= 10:
        rep_score = 3.0
    elif counter <= 15:
        rep_score = 3.5
    else:
        rep_score = 4.0

    # Component 2: Form/depth quality (0-3 pts)
    form_score = round(depth_ratio * 3.0, 2)

    # Component 3: Stability (0-2 pts)
    stability_score = round(stability_ratio * 2.0, 2)

    # Component 4: Stamina/no fatigue (0-1 pt)
    stamina_score = 0.0 if fatigue_severity >= 2 else (0.5 if fatigue_severity == 1 else 1.0)

    raw_total = rep_score + form_score + stability_score + stamina_score
    score_out_of_10 = round(min(raw_total, 10.0), 1)

    # ── Reason String ─────────────────────────────────────────────────
    reasons = []
    reasons.append(f"Completed {counter} push-up(s) ({rep_score}/4 pts).")
    reasons.append(f"Full-depth reps: {good_depth_reps}/{counter} — depth quality {form_score}/3 pts.")
    reasons.append(f"Core stability: {round(stability_ratio*100)}% stable frames — {stability_score}/2 pts.")
    if fatigue_severity == 0:
        reasons.append("No fatigue detected — full stamina point awarded.")
    elif fatigue_severity == 1:
        reasons.append("Mild velocity drop detected — 0.5/1 stamina point.")
    else:
        reasons.append("Significant fatigue detected — 0/1 stamina point.")
    score_reason = " ".join(reasons)

    # ── Feedback ──────────────────────────────────────────────────────
    feedback = []
    if counter == 0:
        feedback.append("No valid push-ups detected. Ensure full elbow extension at the top.")
    if depth_ratio < 0.5:
        feedback.append("Many reps lacked full depth (elbow < 90°). Go lower for full credit.")
    if stability_ratio < 0.85:
        feedback.append("Core instability detected — keep hips aligned with shoulders throughout.")
    if fatigue_detected:
        feedback.append("Velocity dropped significantly — work on explosive power and endurance.")
    if counter > 0 and fatigue_severity == 0 and depth_ratio >= 0.8:
        feedback.append("Excellent form and stamina maintained throughout the set.")

    report = {
        "total_reps": counter,
        "good_depth_reps": good_depth_reps,
        "depth_ratio_pct": round(depth_ratio * 100, 1),
        "stability_pct": round(stability_ratio * 100, 1),
        "fatigue_index": ["None", "Mild", "Moderate", "High"][fatigue_severity],
        "velocity_profile_sampled": velocity_history[::10],
        "score_breakdown": {
            "rep_score": rep_score,
            "form_score": form_score,
            "stability_score": stability_score,
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