import cv2
import mediapipe as mp

def count_laps(video_path: str) -> dict:
    """
    Counts shuttle run laps with deep feedback.
    """
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"raw_score": 0, "feedback": ["Could not open video."], "report": {}}

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    center_line_x = frame_width / 2
    laps, position_state = 0, None
    mistakes, strengths, tips = [], [], []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image)

        try:
            landmarks = results.pose_landmarks.landmark
            nose_x = landmarks[mp_pose.PoseLandmark.NOSE.value].x * frame_width

            if position_state is None:
                position_state = "left" if nose_x < center_line_x else "right"

            if nose_x < center_line_x and position_state == "right":
                laps += 1
                position_state = "left"
                strengths.append("Quick turnaround to left side")
            elif nose_x > center_line_x and position_state == "left":
                laps += 1
                position_state = "right"
                strengths.append("Quick turnaround to right side")

        except:
            pass

    cap.release()
    pose.close()

    report = {
        "laps": laps,
        "mistakes": mistakes,
        "strengths": strengths,
        "tips": tips,
        "analysis_summary": f"Completed {laps} laps with shuttle run feedback."
    }
    feedback = strengths + mistakes + tips

    return {"raw_score": laps, "feedback": feedback, "report": report}