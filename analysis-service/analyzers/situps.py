import cv2
import mediapipe as mp
from analyzers.utils import calculate_angle


def count_situps(video_path: str) -> dict:
    """
    Counts sit-ups with deep feedback.
    """
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"raw_score": 0, "feedback": ["Could not open video."], "report": {}}

    counter, stage = 0, None
    mistakes, strengths, tips = [], [], []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image)

        try:
            landmarks = results.pose_landmarks.landmark
            shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                        landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                   landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
            knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]

            angle = calculate_angle(shoulder, hip, knee)

            if angle > 160:
                stage = "down"
            if angle < 90 and stage == 'down':
                stage = "up"
                counter += 1
                strengths.append("Good sit-up form with full range")
            elif angle > 120 and stage == 'up':
                if "Partial sit-ups" not in mistakes:
                    mistakes.append("Not sitting up high enough")
                    tips.append("Bring chest closer to knees")

        except:
            pass

    cap.release()
    pose.close()

    report = {
        "total_reps": counter,
        "mistakes": mistakes,
        "strengths": strengths,
        "tips": tips,
        "analysis_summary": f"Completed {counter} sit-ups with feedback provided."
    }
    feedback = strengths + mistakes + tips

    return {"raw_score": counter, "feedback": feedback, "report": report}