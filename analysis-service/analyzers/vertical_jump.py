import cv2
import mediapipe as mp

def calculate_height(video_path: str, athlete_height_cm: float) -> dict:
    """
    Calculates vertical jump height with deep feedback.
    """
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"raw_score": 0, "feedback": ["Could not open video."], "report": {}}

    max_jump_height, start_pos_y, start_pos_x = 0, None, None
    mistakes, strengths, tips = [], [], []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image)

        try:
            landmarks = results.pose_landmarks.landmark
            left_heel_y = landmarks[mp_pose.PoseLandmark.LEFT_HEEL.value].y
            right_heel_y = landmarks[mp_pose.PoseLandmark.RIGHT_HEEL.value].y
            avg_heel_y = (left_heel_y + right_heel_y) / 2

            if start_pos_y is None:
                start_pos_y = avg_heel_y
                start_pos_x = landmarks[mp_pose.PoseLandmark.LEFT_HEEL.value].x

            jump_height = (start_pos_y - avg_heel_y) * athlete_height_cm
            if jump_height > max_jump_height:
                max_jump_height = jump_height
                strengths.append(f"Explosive jump detected: {round(max_jump_height,1)} cm")

            # Landing mistake
            left_heel_x = landmarks[mp_pose.PoseLandmark.LEFT_HEEL.value].x
            if start_pos_x and abs(left_heel_x - start_pos_x) * 100 > 30:
                if "Poor landing" not in mistakes:
                    mistakes.append("Landed too far from start")
                    tips.append("Try to land softly and closer to starting point")

        except:
            pass

    cap.release()
    pose.close()

    report = {
        "jump_height_cm": round(max_jump_height, 2),
        "mistakes": mistakes,
        "strengths": strengths,
        "tips": tips,
        "analysis_summary": f"Best jump height: {round(max_jump_height,2)} cm."
    }
    feedback = strengths + mistakes + tips

    return {"raw_score": max_jump_height, "feedback": feedback, "report": report}