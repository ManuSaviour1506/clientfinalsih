# utils.py

import cv2
import numpy as np
import requests
import os
import math
import mediapipe as mp


# -------------------------------
# Video Download Utility
# -------------------------------
def download_video(video_url: str, temp_dir: str = "temp_videos") -> str:
    """
    Downloads a video from a URL and saves it to a temporary file.
    Returns the path to the downloaded file.
    """
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)

    # Generate a unique filename
    video_filename = os.path.join(temp_dir, f"temp_{os.urandom(8).hex()}.mp4")

    try:
        with requests.get(video_url, stream=True) as r:
            r.raise_for_status()
            with open(video_filename, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        return video_filename
    except requests.exceptions.RequestException as e:
        print(f"Error downloading video: {e}")
        return None


# -------------------------------
# Geometry Helper Functions
# -------------------------------
def calculate_angle(a, b, c) -> float:
    """
    Calculates the angle (in degrees) between three 2D/3D points.
    'a', 'b', 'c' can be tuples/lists/arrays of (x, y) or (x, y, z).
    Angle is measured at point 'b'.
    """
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    # Vectors
    ba = a - b
    bc = c - b

    # Dot product formula
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)  # prevent NaN
    angle = np.arccos(cosine_angle)

    return np.degrees(angle)


def euclidean_distance(point1, point2) -> float:
    """
    Returns Euclidean distance between two points (x, y) or (x, y, z).
    """
    p1 = np.array(point1)
    p2 = np.array(point2)
    return np.linalg.norm(p1 - p2)


def average_angle(points: list) -> float:
    """
    Computes the average angle for multiple sets of points.
    Each element in `points` must be a tuple (a, b, c).
    """
    if not points:
        return 0.0
    angles = [calculate_angle(a, b, c) for (a, b, c) in points]
    return sum(angles) / len(angles)


# -------------------------------
# Pose & Landmark Utilities
# -------------------------------
mp_pose = mp.solutions.pose

def get_landmark_coords(landmarks, idx, image_shape):
    """
    Converts normalized Mediapipe landmark (x,y) into pixel coordinates.
    """
    h, w, _ = image_shape
    return int(landmarks[idx].x * w), int(landmarks[idx].y * h)


def is_knee_lifted(landmarks, image_shape, threshold: float = 0.5) -> bool:
    """
    Checks if the knee is lifted above the hip level (used for endurance/high knees).
    """
    left_knee = get_landmark_coords(landmarks, mp_pose.PoseLandmark.LEFT_KNEE.value, image_shape)
    left_hip = get_landmark_coords(landmarks, mp_pose.PoseLandmark.LEFT_HIP.value, image_shape)

    return left_knee[1] < left_hip[1] * (1 - threshold)  # higher in image = smaller y


def torso_angle(landmarks) -> float:
    """
    Calculates torso angle using shoulder and hip alignment.
    Useful for posture analysis.
    """
    left_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
    left_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
    left_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                 landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]

    return calculate_angle(left_shoulder, left_hip, left_knee)


# -------------------------------
# Feedback Utility
# -------------------------------
def build_report(metric_name: str, metric_value, mistakes: list, strengths: list, tips: list) -> dict:
    """
    Standardized report structure for all analyzers.
    """
    return {
        metric_name: metric_value,
        "mistakes": mistakes if mistakes else ["No major mistakes detected"],
        "strengths": strengths if strengths else ["Good effort overall"],
        "tips": tips if tips else ["Keep practicing to improve further"]
    }