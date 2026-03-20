import cv2
import mediapipe as mp
import numpy as np


class PoseEngine:
    def __init__(self, model_complexity: int = 1):
        self.mp_pose = mp.solutions.pose
        self.mp_draw = mp.solutions.drawing_utils

        # BUG FIX 1: model_complexity=2 is the heaviest model and causes severe
        # latency on video analysis (each frame takes 3-5x longer).
        # Defaulting to 1 (balanced). Caller can pass 2 for offline/batch use.
        # BUG FIX 2: Pose object was never closed — MediaPipe leaks GPU/CPU
        # resources if .close() is never called. Added __enter__/__exit__
        # so PoseEngine can be used as a context manager.
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=model_complexity,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )

    # ── Context manager support ───────────────────────────────────────
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        return False   # don't suppress exceptions

    def close(self):
        """Release MediaPipe resources explicitly."""
        if self.pose:
            self.pose.close()
            self.pose = None

    # ── Core methods ──────────────────────────────────────────────────
    def process_frame(self, frame: np.ndarray):
        """
        Processes a single BGR frame and returns MediaPipe results.

        BUG FIX 3: No validation that frame is non-None or non-empty.
        A corrupt/empty frame passed to cv2.cvtColor crashes the process.
        """
        if frame is None or frame.size == 0:
            return None

        # BUG FIX 4: pose.process() after pose.close() raises AttributeError.
        # Guard against use-after-close.
        if self.pose is None:
            raise RuntimeError("PoseEngine has been closed. Create a new instance.")

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        # MediaPipe requires the image to be writeable=False for performance
        rgb_frame.flags.writeable = False
        results = self.pose.process(rgb_frame)
        rgb_frame.flags.writeable = True
        return results

    def extract_keypoints(self, results) -> np.ndarray:
        """
        Converts landmarks to a flattened numpy array (132 values) for
        the sequential/GRU model.

        BUG FIX 5: No guard against results=None (e.g. process_frame
        returned None on a bad frame). This would crash on
        results.pose_landmarks.
        """
        if results is None or not results.pose_landmarks:
            return np.zeros(33 * 4, dtype=np.float32)

        return np.array(
            [[lm.x, lm.y, lm.z, lm.visibility]
             for lm in results.pose_landmarks.landmark],
            dtype=np.float32
        ).flatten()

    def draw_landmarks(self, frame: np.ndarray, results) -> np.ndarray:
        """
        Draws pose skeleton on frame and returns the annotated frame.

        BUG FIX 6: draw_landmarks was called inline in various files
        without checking results.pose_landmarks first, crashing on
        frames where no person is detected. Centralised here with guard.
        """
        if results and results.pose_landmarks:
            self.mp_draw.draw_landmarks(
                frame,
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                self.mp_draw.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                self.mp_draw.DrawingSpec(color=(0, 0, 255), thickness=2)
            )
        return frame