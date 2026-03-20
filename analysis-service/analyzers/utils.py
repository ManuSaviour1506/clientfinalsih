# analyzers/utils.py

import cv2
import numpy as np
import requests
import os

# ── Video Download Utility ────────────────────────────────────────────
def download_video(video_url: str, temp_dir: str = "temp_videos") -> str:
    os.makedirs(temp_dir, exist_ok=True)
    video_filename = os.path.join(temp_dir, f"temp_{os.urandom(8).hex()}.mp4")
    try:
        with requests.get(video_url, stream=True, timeout=30) as r:
            r.raise_for_status()
            with open(video_filename, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
        return video_filename
    except requests.exceptions.RequestException as e:
        print(f"Error downloading video: {e}")
        if os.path.exists(video_filename):
            os.remove(video_filename)
        return None


# ── Geometry Helpers ──────────────────────────────────────────────────
def calculate_angle(a, b, c) -> float:
    """
    Angle in degrees at point B formed by A-B-C.
    Accepts 2D or 3D points as list/tuple/ndarray.
    """
    a = np.array(a, dtype=np.float64)
    b = np.array(b, dtype=np.float64)
    c = np.array(c, dtype=np.float64)

    ba = a - b
    bc = c - b

    norm_ba = np.linalg.norm(ba)
    norm_bc = np.linalg.norm(bc)

    # Guard against zero-length vectors (occluded landmarks)
    if norm_ba < 1e-8 or norm_bc < 1e-8:
        return 0.0

    cosine_angle = np.dot(ba, bc) / (norm_ba * norm_bc)
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    return float(np.degrees(np.arccos(cosine_angle)))


def euclidean_distance(point1, point2) -> float:
    return float(np.linalg.norm(np.array(point1) - np.array(point2)))


def average_angle(points: list) -> float:
    if not points:
        return 0.0
    angles = []
    for triplet in points:
        try:
            a, b, c = triplet
            angles.append(calculate_angle(a, b, c))
        except Exception:
            continue
    return float(np.mean(angles)) if angles else 0.0


# ── Pose & Landmark Utilities ─────────────────────────────────────────
# BUG FIX: mp_pose = mp.solutions.pose was at MODULE LEVEL — this runs
# immediately when the file is imported, before mediapipe has fully
# initialised in some versions (especially 0.10.x on macOS).
# Fix: access mp.solutions.pose lazily inside each function that needs it.

def _get_mp_pose():
    """Lazy loader — only accesses mp.solutions when actually called."""
    import mediapipe as mp
    return mp.solutions.pose


def get_landmark_coords(landmarks, idx: int, image_shape: tuple):
    """Converts normalised MediaPipe landmark to pixel (x, y)."""
    if idx < 0 or idx >= len(landmarks):
        return (0, 0)
    h, w = image_shape[:2]
    return int(landmarks[idx].x * w), int(landmarks[idx].y * h)


def is_knee_lifted(landmarks, image_shape: tuple, threshold: float = 0.1) -> bool:
    """
    Returns True if the left knee is clearly above the left hip.
    threshold=0.1 means knee must be at least 10% above hip level.
    """
    mp_pose = _get_mp_pose()
    left_knee = get_landmark_coords(
        landmarks, mp_pose.PoseLandmark.LEFT_KNEE.value, image_shape)
    left_hip = get_landmark_coords(
        landmarks, mp_pose.PoseLandmark.LEFT_HIP.value, image_shape)
    # Smaller y = higher on screen
    return left_knee[1] < left_hip[1] * (1.0 - threshold)


def torso_angle(landmarks) -> float:
    """Torso angle at hip (shoulder → hip → knee)."""
    if landmarks is None:
        return 0.0
    mp_pose = _get_mp_pose()
    left_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
    left_hip      = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
    left_knee     = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
    return calculate_angle(left_shoulder, left_hip, left_knee)


# ── Report Builder ────────────────────────────────────────────────────
def build_report(
    metric_name: str,
    metric_value,
    mistakes: list,
    strengths: list,
    tips: list,
    score_out_of_10: float = 0.0,
    score_reason: str = "",
) -> dict:
    return {
        metric_name:       metric_value,
        "score_out_of_10": score_out_of_10,
        "score_reason":    score_reason,
        "mistakes":        mistakes  if mistakes  else ["No major mistakes detected"],
        "strengths":       strengths if strengths else ["Good effort overall"],
        "tips":            tips      if tips      else ["Keep practicing to improve further"],
    }