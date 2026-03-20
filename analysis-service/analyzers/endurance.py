import cv2
import mediapipe as mp

def count_high_knees(video_path: str) -> dict:
    """
    Counts high knees and provides deep feedback.
    """
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"raw_score": 0, "feedback": ["Could not open video."], "report": {}}

    counter, incomplete_reps = 0, 0
    left_leg_state, right_leg_state = "down", "down"
    mistakes, strengths, tips = [], [], []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image)

        try:
            landmarks = results.pose_landmarks.landmark
            left_hip_y = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y
            left_knee_y = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y
            right_hip_y = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y
            right_knee_y = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y

            # Left leg logic
            if left_knee_y < left_hip_y and left_leg_state == "down":
                left_leg_state = "up"
                counter += 1
                if "Good knee lift" not in strengths:
                    strengths.append("Knees lifted high above hip level")
            elif left_knee_y > left_hip_y:
                if left_leg_state == "up" and left_knee_y < left_hip_y * 1.1:
                    incomplete_reps += 1
                    mistakes.append("Left knee not raised high enough")
                    tips.append("Lift left knee above hip height for full rep")
                left_leg_state = "down"

            # Right leg logic
            if right_knee_y < right_hip_y and right_leg_state == "down":
                right_leg_state = "up"
                counter += 1
                if "Good rhythm" not in strengths:
                    strengths.append("Consistent alternating knee lifts")
            elif right_knee_y > right_hip_y:
                if right_leg_state == "up" and right_knee_y < right_hip_y * 1.1:
                    incomplete_reps += 1
                    mistakes.append("Right knee not raised high enough")
                    tips.append("Lift right knee above hip height for full rep")
                right_leg_state = "down"

        except:
            pass

    cap.release()
    pose.close()

    report = {
        "total_reps": counter,
        "incomplete_reps": incomplete_reps,
        "mistakes": mistakes,
        "strengths": strengths,
        "tips": tips,
        "analysis_summary": f"Performed {counter} high knees with {incomplete_reps} incomplete reps."
    }
    feedback = strengths + mistakes + tips

    return {"raw_score": counter, "feedback": feedback, "report": report}