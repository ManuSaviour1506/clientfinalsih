import cv2
import mediapipe as mp
from analyzers.utils import calculate_angle


def count_pushups(video_path: str) -> dict:
    """
    Counts push-up repetitions and provides detailed feedback.
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
            elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]

            angle = calculate_angle(shoulder, elbow, wrist)

            if angle > 160:
                stage = "up"
                if "Full arm extension" not in strengths:
                    strengths.append("Full arm extension at the top of push-ups")
            if angle < 90 and stage == 'up':
                stage = "down"
                counter += 1
                if "Reaching full depth" not in strengths:
                    strengths.append("Reaching proper depth during push-ups")
            elif angle < 120 and stage == 'up':
                if "Shallow push-ups" not in mistakes:
                    mistakes.append("Not lowering chest enough")
                    tips.append("Lower chest until elbows reach ~90° angle")
            elif angle > 140 and stage == 'down':
                if "Incomplete extension" not in mistakes:
                    mistakes.append("Not extending arms fully")
                    tips.append("Lock arms at the top for full range")

        except:
            pass

    cap.release()
    pose.close()

    report = {
        "total_reps": counter,
        "mistakes": mistakes,
        "strengths": strengths,
        "tips": tips,
        "analysis_summary": f"You performed {counter} push-ups. "
                            f"Strengths: {', '.join(strengths)}. "
                            f"Mistakes: {', '.join(mistakes)}."
    }
    feedback = strengths + mistakes + tips

    return {"raw_score": counter, "feedback": feedback, "report": report}