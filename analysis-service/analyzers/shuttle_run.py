import cv2
import mediapipe as mp
import numpy as np

def count_laps(video_path: str) -> dict:
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(min_detection_confidence=0.7, min_tracking_confidence=0.7)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "raw_score": 0, "score_out_of_10": 0,
            "score_reason": "Video could not be opened.",
            "feedback": ["Could not open video."], "report": {}
        }

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    # BUG FIX 1: center_line_x as fraction-based is fragile; use 40-60% zone
    # to avoid jitter-triggering false laps near the center
    left_zone  = frame_width * 0.35
    right_zone = frame_width * 0.65

    laps = 0
    position_state = None   # "left" | "right"
    trajectory = []
    transition_timestamps = []   # frame indices when a lap transition happens
    frame_idx = 0

    # BUG FIX 2: old code used raw center line — any nose wobble near center
    # counted as multiple laps. Now uses hysteresis zones.

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1
        results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if not results.pose_landmarks:
            continue

        nose_x = results.pose_landmarks.landmark[mp_pose.PoseLandmark.NOSE].x * frame_width
        trajectory.append(nose_x)

        # Initialize state
        if position_state is None:
            position_state = "left" if nose_x < frame_width * 0.5 else "right"
            continue

        # Hysteresis: only commit to a new side when clearly past the zone
        if nose_x < left_zone and position_state == "right":
            laps += 1
            position_state = "left"
            transition_timestamps.append(frame_idx)
        elif nose_x > right_zone and position_state == "left":
            laps += 1
            position_state = "right"
            transition_timestamps.append(frame_idx)

    cap.release()
    pose.close()

    # ── Transition Consistency (Speed Variance) ───────────────────────
    # BUG FIX 3: old code gave no performance quality insight at all
    lap_intervals = []
    if len(transition_timestamps) >= 2:
        for i in range(1, len(transition_timestamps)):
            interval_frames = transition_timestamps[i] - transition_timestamps[i - 1]
            lap_intervals.append(interval_frames / fps)  # seconds per lap

    consistency_score = 0.0
    if len(lap_intervals) >= 2:
        cv_ratio = np.std(lap_intervals) / (np.mean(lap_intervals) + 1e-6)
        # Low coefficient of variation = consistent pace
        consistency_score = max(0.0, 1.0 - cv_ratio)  # 0-1

    avg_lap_time = round(np.mean(lap_intervals), 2) if lap_intervals else 0

    # ── /10 Scoring ───────────────────────────────────────────────────
    # Component 1: Lap count (0-6 pts)
    # Shuttle run standard: 4 laps minimum, 10+ excellent
    if laps == 0:
        lap_score = 0.0
    elif laps <= 2:
        lap_score = 2.0
    elif laps <= 4:
        lap_score = 3.5
    elif laps <= 6:
        lap_score = 4.5
    elif laps <= 8:
        lap_score = 5.5
    else:
        lap_score = 6.0

    # Component 2: Consistency (0-2 pts)
    consistency_pts = round(consistency_score * 2.0, 2)

    # Component 3: Speed bonus — fast avg lap time (0-2 pts)
    # < 2s per lap = excellent, 2-3s = good, 3-4s = average, > 4s = slow
    if avg_lap_time == 0:
        speed_pts = 0.0
    elif avg_lap_time < 2.0:
        speed_pts = 2.0
    elif avg_lap_time < 3.0:
        speed_pts = 1.5
    elif avg_lap_time < 4.0:
        speed_pts = 1.0
    else:
        speed_pts = 0.5

    raw_total = lap_score + consistency_pts + speed_pts
    score_out_of_10 = round(min(raw_total, 10.0), 1)

    # ── Reason ───────────────────────────────────────────────────────
    reasons = [
        f"Completed {laps} lap(s) ({lap_score}/6 pts).",
        f"Pace consistency: {round(consistency_score*100)}% — {consistency_pts}/2 pts.",
        f"Average lap time: {avg_lap_time}s — speed score {speed_pts}/2 pts.",
    ]
    score_reason = " ".join(reasons)

    # ── Feedback ─────────────────────────────────────────────────────
    feedback = []
    if laps == 0:
        feedback.append("No laps detected. Ensure you cross both sides of the frame clearly.")
    if consistency_score < 0.5:
        feedback.append("Lap times were inconsistent — try to maintain a steady pace throughout.")
    if avg_lap_time > 4.0:
        feedback.append("Lap speed is below average — focus on faster direction changes.")
    if laps >= 8 and consistency_score >= 0.7:
        feedback.append("Outstanding shuttle run — excellent speed and consistency!")
    elif laps >= 4 and consistency_score >= 0.6:
        feedback.append("Good performance. Push harder on direction changes to improve time.")

    report = {
        "laps": laps,
        "avg_lap_time_sec": avg_lap_time,
        "consistency_pct": round(consistency_score * 100, 1),
        "score_breakdown": {
            "lap_score": lap_score,
            "consistency_pts": consistency_pts,
            "speed_pts": speed_pts,
        }
    }

    return {
        "raw_score": laps,
        "score_out_of_10": score_out_of_10,
        "score_reason": score_reason,
        "feedback": feedback,
        "report": report,
    }