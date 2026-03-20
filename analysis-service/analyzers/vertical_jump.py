import cv2
import mediapipe as mp
import numpy as np

def calculate_height(video_path: str, athlete_height_cm: float = 170) -> dict:
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(min_detection_confidence=0.8, min_tracking_confidence=0.8)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "raw_score": 0, "score_out_of_10": 0,
            "score_reason": "Video could not be opened.",
            "feedback": ["Could not open video."], "report": {}
        }

    hip_y_positions = []
    ankle_y_positions = []   # BUG FIX 1: need ankle-to-hip span for proper normalization

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if not results.pose_landmarks:
            continue

        lm = results.pose_landmarks.landmark

        hip_y = (lm[mp_pose.PoseLandmark.LEFT_HIP.value].y +
                 lm[mp_pose.PoseLandmark.RIGHT_HIP.value].y) / 2.0

        ankle_y = (lm[mp_pose.PoseLandmark.LEFT_ANKLE.value].y +
                   lm[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y) / 2.0

        hip_y_positions.append(hip_y)
        ankle_y_positions.append(ankle_y)

    cap.release()
    pose.close()

    if not hip_y_positions:
        return {
            "raw_score": 0, "score_out_of_10": 0,
            "score_reason": "No pose landmarks detected in this video.",
            "feedback": ["Ensure the athlete's full body is visible."], "report": {}
        }

    # ── BUG FIX 2: Old code used first frame as standing_y ───────────
    # First frame may be mid-motion. Use the median of the bottom 20% of
    # frames (lowest hip position = standing) as the stable ground reference.
    sorted_hip_y = sorted(hip_y_positions, reverse=True)   # y increases downward
    ground_frame_count = max(1, len(sorted_hip_y) // 5)
    standing_y = np.mean(sorted_hip_y[:ground_frame_count])

    # ── BUG FIX 3: Original formula (delta_y * height_cm) was dimensionally ──
    # wrong. Correct approach: measure body span in normalized units, then
    # use it as a scale factor to convert delta_y → real cm.
    # Body span (ankle to hip in normalized coords) approximates half body.
    # Full body ≈ 2 * hip-to-ankle span.
    sorted_ankle_y = sorted(ankle_y_positions, reverse=True)
    standing_ankle_y = np.mean(sorted_ankle_y[:ground_frame_count])
    body_span_normalized = abs(standing_ankle_y - standing_y)  # hip-to-ankle in norm coords

    if body_span_normalized < 0.01:
        # Fallback: assume hip is at ~55% body height
        body_span_normalized = 0.55 / 2  # approx half-body as fraction

    # Full body in norm coords ≈ 2 * hip-to-ankle span
    full_body_norm = body_span_normalized * 2.0
    pixels_per_cm = full_body_norm / athlete_height_cm  # norm-units per cm

    # Peak jump: lowest hip y value (highest physical position)
    peak_hip_y = min(hip_y_positions)
    displacement_norm = standing_y - peak_hip_y   # positive = jumped up
    jump_height_cm = round(displacement_norm / pixels_per_cm, 1) if pixels_per_cm > 0 else 0
    jump_height_cm = max(0.0, jump_height_cm)

    # ── Flight Time Estimation ────────────────────────────────────────
    fps = cap.get(cv2.CAP_PROP_FPS) if hasattr(cap, 'get') else 30.0
    # Count frames where hip is significantly above standing position
    threshold_norm = standing_y - (0.05 * full_body_norm)   # 5% above standing
    airborne_frames = sum(1 for y in hip_y_positions if y < threshold_norm)
    flight_time_sec = round(airborne_frames / (fps if fps > 0 else 30.0), 2)

    # ── /10 Scoring ───────────────────────────────────────────────────
    # Vertical jump benchmarks (cm):
    #   < 20 = poor, 20-30 = average, 30-40 = good, 40-50 = excellent, 50+ = elite
    if jump_height_cm <= 0:
        height_score = 0.0
    elif jump_height_cm < 20:
        height_score = 2.0
    elif jump_height_cm < 30:
        height_score = 4.0
    elif jump_height_cm < 40:
        height_score = 6.0
    elif jump_height_cm < 50:
        height_score = 8.0
    else:
        height_score = 9.0

    # Flight time consistency bonus (0-1 pt)
    flight_bonus = 1.0 if flight_time_sec > 0.3 else (0.5 if flight_time_sec > 0.15 else 0.0)

    score_out_of_10 = round(min(height_score + flight_bonus, 10.0), 1)

    # ── Reason ───────────────────────────────────────────────────────
    reasons = [
        f"Jump height: {jump_height_cm}cm ({height_score}/9 pts).",
        f"Estimated airborne time: {flight_time_sec}s — bonus: {flight_bonus}/1 pt.",
    ]
    score_reason = " ".join(reasons)

    # ── Feedback ─────────────────────────────────────────────────────
    feedback = []
    if jump_height_cm <= 0:
        feedback.append("No jump detected — ensure the full body is visible and a clear jump is performed.")
    elif jump_height_cm < 20:
        feedback.append("Below average jump height. Work on leg drive and hip extension.")
    elif jump_height_cm < 30:
        feedback.append("Average vertical. Add plyometric training to improve explosiveness.")
    elif jump_height_cm < 40:
        feedback.append("Good vertical jump. Focus on arm swing and triple extension to gain more height.")
    else:
        feedback.append("Excellent vertical jump! Elite-level explosive power demonstrated.")

    report = {
        "jump_height_cm": jump_height_cm,
        "flight_time_sec": flight_time_sec,
        "athlete_height_cm_used": athlete_height_cm,
        "score_breakdown": {
            "height_score": height_score,
            "flight_bonus": flight_bonus,
        }
    }

    return {
        "raw_score": jump_height_cm,
        "score_out_of_10": score_out_of_10,
        "score_reason": score_reason,
        "feedback": feedback,
        "report": report,
    }