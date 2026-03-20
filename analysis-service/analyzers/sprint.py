import cv2
import mediapipe as mp
import numpy as np

def analyze_sprint(video_path: str) -> dict:
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "raw_score": 0, "score_out_of_10": 0,
            "score_reason": "Video could not be opened.",
            "feedback": ["Could not open video."], "report": {}
        }

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))

    # BUG FIX 1: Hardcoded pixel start/finish lines (100, 1200) break on
    # any video not exactly 1280px wide. Use proportional thresholds instead.
    start_line_x  = frame_width * 0.08   # 8% from left
    finish_line_x = frame_width * 0.92   # 92% from right

    current_state = "READY"
    start_time = 0.0
    final_time = 0.0
    velocity_profile = []
    acceleration_profile = []
    prev_x, prev_time, prev_velocity = None, None, None

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break

        results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if not results.pose_landmarks:
            continue

        landmarks = results.pose_landmarks.landmark
        h, w, _ = frame.shape

        # BUG FIX 2: Using only RIGHT_SHOULDER is unstable when athlete
        # turns or is partially occluded. Average both shoulders for robustness.
        left_x  = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x * w
        right_x = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x * w
        curr_x  = (left_x + right_x) / 2.0
        curr_time = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0

        if prev_x is not None and (curr_time - prev_time) > 0:
            velocity = (curr_x - prev_x) / (curr_time - prev_time)
            velocity_profile.append(velocity)

            # BUG FIX 3: acceleration was never computed in original
            if prev_velocity is not None:
                accel = (velocity - prev_velocity) / (curr_time - prev_time)
                acceleration_profile.append(accel)
            prev_velocity = velocity

        if current_state == "READY" and curr_x > start_line_x:
            current_state = "RUNNING"
            start_time = curr_time

        elif current_state == "RUNNING" and curr_x > finish_line_x:
            final_time = curr_time - start_time
            current_state = "FINISHED"
            break  # BUG FIX 4: old code kept processing after finish; waste & inaccurate

        prev_x, prev_time = curr_x, curr_time

    cap.release()
    pose.close()

    # ── Derived Metrics ───────────────────────────────────────────────
    # Only consider positive velocities (moving toward finish)
    forward_velocities = [v for v in velocity_profile if v > 0]
    peak_velocity   = round(max(forward_velocities), 2) if forward_velocities else 0
    avg_velocity    = round(np.mean(forward_velocities), 2) if forward_velocities else 0

    # Acceleration phase: first 30% of velocity profile
    accel_phase = acceleration_profile[:len(acceleration_profile)//3]
    peak_accel  = round(max(accel_phase), 2) if accel_phase else 0

    # ── /10 Scoring ───────────────────────────────────────────────────
    # Sprint is scored by time (lower = better).
    # Reference: 10m sprint benchmarks (approx)
    #   < 1.8s → elite (10/10), < 2.2s → excellent, < 2.8s → good,
    #   < 3.5s → average, >= 3.5s → below average
    # BUG FIX 5: original returned score_seconds not score_out_of_10

    if final_time <= 0:
        time_score = 0.0
        incomplete = True
    else:
        incomplete = False
        if final_time < 1.8:
            time_score = 8.0
        elif final_time < 2.2:
            time_score = 7.0
        elif final_time < 2.8:
            time_score = 5.5
        elif final_time < 3.5:
            time_score = 4.0
        else:
            time_score = 2.5

    # Velocity consistency bonus (0-1 pt): steady acceleration = better form
    consistency_bonus = 0.0
    if len(forward_velocities) >= 4:
        # Low std relative to mean = consistent sprint
        cv = np.std(forward_velocities) / (np.mean(forward_velocities) + 1e-6)
        consistency_bonus = round(max(0.0, 1.0 - cv), 2)

    # Peak velocity bonus (0-1 pt)
    velocity_bonus = 0.0
    if peak_velocity > 500:
        velocity_bonus = 1.0
    elif peak_velocity > 300:
        velocity_bonus = 0.5

    raw_total = time_score + consistency_bonus + velocity_bonus
    score_out_of_10 = round(min(raw_total, 10.0), 1)

    # ── Reason ───────────────────────────────────────────────────────
    if incomplete:
        score_reason = (
            "Sprint could not be completed — athlete did not cross the finish line. "
            "Score: 0/10."
        )
    else:
        reasons = [
            f"Sprint completed in {round(final_time, 2)}s ({time_score}/8 pts).",
            f"Velocity consistency bonus: {consistency_bonus}/1 pt.",
            f"Peak velocity bonus ({peak_velocity} px/s): {velocity_bonus}/1 pt.",
        ]
        score_reason = " ".join(reasons)

    # ── Feedback ─────────────────────────────────────────────────────
    feedback = []
    if incomplete:
        feedback.append("Sprint incomplete — athlete did not cross the finish zone detected by the camera.")
    elif final_time < 1.8:
        feedback.append("Elite sprint time — outstanding explosive speed.")
    elif final_time < 2.8:
        feedback.append("Strong sprint. Focus on explosive start to shave off more time.")
    else:
        feedback.append("Below average sprint time. Work on acceleration phase in the first 2 seconds.")
    if consistency_bonus < 0.5:
        feedback.append("Uneven stride detected — practice maintaining top speed throughout the run.")

    report = {
        "sprint_time_sec": round(final_time, 2),
        "peak_velocity_px_per_s": peak_velocity,
        "avg_velocity_px_per_s": avg_velocity,
        "peak_acceleration": peak_accel,
        "status": "INCOMPLETE" if incomplete else "SUCCESS",
        "score_breakdown": {
            "time_score": time_score,
            "consistency_bonus": consistency_bonus,
            "velocity_bonus": velocity_bonus,
        }
    }

    return {
        "raw_score": round(final_time, 2),
        "score_out_of_10": score_out_of_10,
        "score_reason": score_reason,
        "feedback": feedback,
        "report": report,
    }