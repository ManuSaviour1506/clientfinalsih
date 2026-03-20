import cv2
import mediapipe as mp
import numpy as np

def count_high_knees(video_path: str) -> dict:
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(min_detection_confidence=0.7, min_tracking_confidence=0.7)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "raw_score": 0, "score_out_of_10": 0,
            "score_reason": "Video could not be opened.",
            "feedback": ["Could not open video."], "report": {}
        }

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    video_duration_sec = total_frames / fps

    # BUG FIX 1: old code counted every frame where knee > hip as a "count"
    # This inflates count massively — a 30fps video with knee up for 1 second = 30 counts!
    # Fix: count actual knee LIFT EVENTS (rising transitions), not frames.

    counter = 0
    knee_was_high = False
    knee_heights = []       # normalized knee y when lifted (smaller y = higher)
    hip_y_values = []
    knee_timestamps = []    # seconds of each lift event
    frame_idx = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1
        curr_time = frame_idx / fps

        results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if not results.pose_landmarks:
            knee_was_high = False
            continue

        lm = results.pose_landmarks.landmark

        # BUG FIX 2: original used lm[25] (LEFT_KNEE) and lm[23] (LEFT_HIP)
        # but never imported np correctly — endurance.py was missing `import numpy as np`
        l_knee_y = lm[mp_pose.PoseLandmark.LEFT_KNEE.value].y
        l_hip_y  = lm[mp_pose.PoseLandmark.LEFT_HIP.value].y

        # BUG FIX 3: use a margin so minor noise doesn't register as a lift
        # Knee must be clearly above hip (knee_y < hip_y * 0.92)
        knee_is_high = l_knee_y < l_hip_y * 0.92

        hip_y_values.append(l_hip_y)

        if knee_is_high and not knee_was_high:
            # Rising edge → new lift event
            counter += 1
            knee_heights.append(l_knee_y)
            knee_timestamps.append(curr_time)
            knee_was_high = True
        elif not knee_is_high:
            knee_was_high = False

    cap.release()
    pose.close()

    # ── Cadence (lifts per second) ────────────────────────────────────
    cadence = round(counter / video_duration_sec, 2) if video_duration_sec > 0 else 0

    # ── Fatigue Analysis ──────────────────────────────────────────────
    # BUG FIX 4: old code compared knee_heights raw values but the direction
    # is inverted in image coords (lower y = higher knee). Fixed comparison.
    fatigue_detected = False
    fatigue_severity = 0
    if len(knee_heights) >= 10:
        early_avg  = np.mean(knee_heights[:len(knee_heights)//4])   # smaller = better
        late_avg   = np.mean(knee_heights[-len(knee_heights)//4:])
        # If late knee y is bigger (lower in image) than early, knee height is declining
        height_drop_ratio = (late_avg - early_avg) / (abs(early_avg) + 1e-6)
        if height_drop_ratio > 0.08:
            fatigue_detected = True
            fatigue_severity = 3
        elif height_drop_ratio > 0.04:
            fatigue_detected = True
            fatigue_severity = 2
        elif height_drop_ratio > 0.01:
            fatigue_severity = 1

    # ── Lift Quality ─────────────────────────────────────────────────
    # Good lift: knee y < 0.90 * hip_y (well above hip)
    avg_hip_y = np.mean(hip_y_values) if hip_y_values else 0.5
    good_lifts = sum(1 for ky in knee_heights if ky < avg_hip_y * 0.88)
    quality_ratio = good_lifts / counter if counter > 0 else 0

    # ── /10 Scoring ───────────────────────────────────────────────────
    # Component 1: Count score (0-4 pts)
    # In a typical 30s window: <10=poor, 10-20=avg, 20-30=good, 30+=excellent
    if counter == 0:
        count_score = 0.0
    elif counter < 10:
        count_score = 1.5
    elif counter < 20:
        count_score = 2.5
    elif counter < 30:
        count_score = 3.5
    else:
        count_score = 4.0

    # Component 2: Cadence score (0-2 pts) — lifts per second
    if cadence == 0:
        cadence_score = 0.0
    elif cadence < 0.5:
        cadence_score = 0.5
    elif cadence < 1.0:
        cadence_score = 1.0
    elif cadence < 1.5:
        cadence_score = 1.5
    else:
        cadence_score = 2.0

    # Component 3: Lift quality (0-2 pts)
    quality_score = round(quality_ratio * 2.0, 2)

    # Component 4: Fatigue/endurance (0-2 pts)
    endurance_score = [2.0, 1.5, 0.5, 0.0][fatigue_severity]

    raw_total = count_score + cadence_score + quality_score + endurance_score
    score_out_of_10 = round(min(raw_total, 10.0), 1)

    # ── Reason ───────────────────────────────────────────────────────
    reasons = [
        f"Completed {counter} high-knee lift(s) in {round(video_duration_sec,1)}s ({count_score}/4 pts).",
        f"Cadence: {cadence} lifts/sec — {cadence_score}/2 pts.",
        f"Quality lifts (clearly above hip): {good_lifts}/{counter} — {quality_score}/2 pts.",
        f"Endurance score: {endurance_score}/2 pts ({'no' if fatigue_severity==0 else 'mild' if fatigue_severity==1 else 'significant'} knee height decay).",
    ]
    score_reason = " ".join(reasons)

    # ── Feedback ─────────────────────────────────────────────────────
    feedback = []
    if counter == 0:
        feedback.append("No high-knee lifts detected. Ensure knees are driven clearly above hip level.")
    if quality_ratio < 0.5:
        feedback.append("Knee height was insufficient — drive the knee above the hip on every rep.")
    if cadence < 0.5:
        feedback.append("Cadence is low — increase your pace for a better endurance score.")
    if fatigue_severity >= 2:
        feedback.append("Knee height dropped significantly toward the end — work on lower-body endurance.")
    if counter >= 20 and fatigue_severity == 0 and quality_ratio >= 0.8:
        feedback.append("Excellent high-knees — great cadence, height, and consistency throughout.")

    report = {
        "total_lifts": counter,
        "cadence_per_sec": cadence,
        "good_quality_lifts": good_lifts,
        "quality_pct": round(quality_ratio * 100, 1),
        "fatigue_detected": fatigue_detected,
        "fatigue_index": ["None", "Mild", "Moderate", "High"][fatigue_severity],
        "video_duration_sec": round(video_duration_sec, 1),
        "score_breakdown": {
            "count_score": count_score,
            "cadence_score": cadence_score,
            "quality_score": quality_score,
            "endurance_score": endurance_score,
        }
    }

    return {
        "raw_score": counter,
        "score_out_of_10": score_out_of_10,
        "score_reason": score_reason,
        "feedback": feedback,
        "report": report,
    }