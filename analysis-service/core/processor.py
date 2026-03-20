# core/processor.py
import numpy as np

# BUG FIX 1: calculate_angle was called but NEVER imported.
# This causes a NameError crash on every single call to get_feature_vector().
from analyzers.utils import calculate_angle


class MotionProcessor:
    @staticmethod
    def get_feature_vector(landmarks) -> dict:
        """
        Extracts skeletal keypoints and converts them into normalized features.
        Returns a dict with 'keypoints' and 'angles' for downstream models.
        """
        # BUG FIX 2: No guard against landmarks being None.
        # If MediaPipe finds no person, landmarks.landmark raises AttributeError.
        if landmarks is None:
            return {
                "keypoints": np.zeros(33 * 3, dtype=np.float32).tolist(),
                "angles": {
                    "elbow_l": 0.0, "elbow_r": 0.0,
                    "hip_l": 0.0,   "hip_r": 0.0,
                    "knee_l": 0.0,  "knee_r": 0.0,
                }
            }

        # Convert landmarks to numpy array (x, y, z only — visibility excluded here)
        points = np.array([[l.x, l.y, l.z] for l in landmarks.landmark], dtype=np.float32)

        # 1. Spatial Normalization — make features position/height-invariant
        #    by centering on the hip midpoint
        hip_center = (points[23] + points[24]) / 2.0
        normalized_points = points - hip_center

        # BUG FIX 3: Only left-side angles were computed, ignoring the right side.
        # Asymmetric analysis misses right-dominant athletes and one-sided form issues.
        # Added right elbow, right hip, and both knees.

        # BUG FIX 4: calculate_angle can crash with a zero-length vector when two
        # landmarks are at the same position (e.g. occluded/invisible joints).
        # Wrapped in a helper that returns 0.0 on failure.
        def safe_angle(a, b, c) -> float:
            try:
                return float(calculate_angle(a, b, c))
            except Exception:
                return 0.0

        angles = {
            # Left side
            "elbow_l": safe_angle(points[11], points[13], points[15]),  # shoulder→elbow→wrist
            "hip_l":   safe_angle(points[11], points[23], points[25]),  # shoulder→hip→knee
            "knee_l":  safe_angle(points[23], points[25], points[27]),  # hip→knee→ankle

            # Right side (BUG FIX 3 — was completely missing)
            "elbow_r": safe_angle(points[12], points[14], points[16]),
            "hip_r":   safe_angle(points[12], points[24], points[26]),
            "knee_r":  safe_angle(points[24], points[26], points[28]),
        }

        return {
            "keypoints": normalized_points.flatten().tolist(),
            "angles": angles,
        }

    @staticmethod
    def get_velocity(prev_keypoints: list, curr_keypoints: list) -> float:
        """
        BUG FIX 5: Velocity was never computed in MotionProcessor even though
        it's referenced in scoring.py. Added here as a utility so analyzers
        can call it without reimplementing the logic.

        Returns the mean absolute frame-to-frame keypoint displacement.
        """
        if not prev_keypoints or not curr_keypoints:
            return 0.0
        prev = np.array(prev_keypoints, dtype=np.float32)
        curr = np.array(curr_keypoints, dtype=np.float32)
        if prev.shape != curr.shape:
            return 0.0
        return float(np.mean(np.abs(curr - prev)))