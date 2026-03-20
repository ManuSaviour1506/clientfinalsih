# utils/visualization.py
import cv2
import mediapipe as mp
import numpy as np

# BUG FIX 1: mp_drawing and mp_pose were used but NEVER imported or defined.
# This causes an immediate NameError crash on the very first call.
mp_drawing = mp.solutions.drawing_utils
mp_pose    = mp.solutions.pose


def create_pose_dashboard(frame: np.ndarray, results, metrics: dict) -> np.ndarray:
    """
    Overlays skeletal keypoints and a real-time analytics panel onto a frame.

    metrics dict should contain:
        - count        (int)   : current rep count
        - curr_angle   (float) : current joint angle in degrees
        - score        (float, optional) : current /10 score
        - stage        (str,   optional) : "up" / "down" / "idle"
        - fatigue      (str,   optional) : fatigue level label
    """
    if frame is None or frame.size == 0:
        return frame

    # BUG FIX 2: Original code called mp_drawing.draw_landmarks without first
    # checking results.pose_landmarks — crashes on frames with no person detected.
    if results and results.pose_landmarks:
        mp_drawing.draw_landmarks(
            frame,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=3),
            mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2),
        )

    # ── Analytics Overlay Panel ───────────────────────────────────────
    panel_h = 140
    panel_w = 280

    # BUG FIX 3: Panel was drawn as a solid black rectangle with no alpha,
    # fully blocking the video underneath. Use semi-transparent overlay.
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (panel_w, panel_h), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.55, frame, 0.45, 0, frame)

    # ── Rep Count ────────────────────────────────────────────────────
    rep_count = metrics.get("count", 0)
    cv2.putText(
        frame,
        f"REPS: {rep_count}",
        (10, 32),
        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2, cv2.LINE_AA
    )

    # ── Joint Angle ──────────────────────────────────────────────────
    curr_angle = metrics.get("curr_angle", 0)
    # BUG FIX 4: int() on a string or None crashes. Guard with safe cast.
    try:
        angle_display = int(float(curr_angle))
    except (TypeError, ValueError):
        angle_display = 0

    cv2.putText(
        frame,
        f"ANGLE: {angle_display}°",
        (10, 68),
        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA
    )

    # ── Stage Indicator ───────────────────────────────────────────────
    # BUG FIX 5: Stage was never shown in the original — added colour-coded label
    stage = metrics.get("stage", "")
    if stage:
        stage_color = (0, 200, 255) if stage == "up" else (255, 100, 0)
        cv2.putText(
            frame,
            f"STAGE: {stage.upper()}",
            (10, 100),
            cv2.FONT_HERSHEY_SIMPLEX, 0.65, stage_color, 2, cv2.LINE_AA
        )

    # ── Score /10 ─────────────────────────────────────────────────────
    # BUG FIX 6: Score was never rendered on video — added
    score = metrics.get("score_out_of_10", None)
    if score is not None:
        cv2.putText(
            frame,
            f"SCORE: {score}/10",
            (10, 130),
            cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 215, 0), 2, cv2.LINE_AA   # gold color
        )

    return frame


def draw_angle_arc(frame: np.ndarray, point_b: tuple, angle: float, radius: int = 30) -> np.ndarray:
    """
    BUG FIX 7: No angle visualisation existed — just a text number.
    Draws a small arc at joint B to visually show the current angle,
    making it much easier to spot form errors in the overlay video.

    point_b: pixel coordinate (x, y) of the vertex joint (e.g. elbow)
    angle:   angle in degrees
    """
    if frame is None or point_b is None:
        return frame

    color = (0, 255, 0) if angle > 160 else ((0, 165, 255) if angle > 90 else (0, 0, 255))
    cv2.ellipse(
        frame,
        center=point_b,
        axes=(radius, radius),
        angle=0,
        startAngle=0,
        endAngle=int(angle),
        color=color,
        thickness=2,
        lineType=cv2.LINE_AA,
    )
    cv2.putText(
        frame,
        f"{int(angle)}°",
        (point_b[0] + radius + 4, point_b[1] + 5),
        cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA,
    )
    return frame