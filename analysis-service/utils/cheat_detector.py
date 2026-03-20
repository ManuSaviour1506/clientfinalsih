import cv2
import numpy as np


class SecurityAudit:

    @staticmethod
    def detect_multi_person(frame: np.ndarray, confidence_threshold: float = 0.5) -> bool:
        """
        Detects whether more than one person is present using a lightweight
        HOG-based people detector (no extra dependencies beyond OpenCV).

        BUG FIX 1: Original method was a hardcoded `return False` placeholder —
        multi-person cheating was NEVER actually detected, making the entire
        cheat detection system non-functional.
        """
        if frame is None or frame.size == 0:
            return False

        hog = cv2.HOGDescriptor()
        hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

        # Detect people; winStride controls speed vs accuracy trade-off
        boxes, weights = hog.detectMultiScale(
            frame,
            winStride=(8, 8),
            padding=(4, 4),
            scale=1.05,
        )

        # Filter by confidence threshold
        confident_detections = [w for w in weights if w >= confidence_threshold]
        return len(confident_detections) > 1

    @staticmethod
    def check_video_tampering(frame1: np.ndarray, frame2: np.ndarray) -> dict:
        """
        Detects frame duplication ('frozen video' cheat) and also flags
        suspiciously low motion that could indicate a pre-recorded still image.

        BUG FIX 2: Original `threshold=0.99` parameter was passed in but never
        used — the function only checked `non_zero_count == 0` (exact duplicates).
        This missed compressed videos where duplicate frames have minor codec
        artifacts (1-2 different pixels) and would slip through.

        BUG FIX 3: Return type was a bare bool, giving no context about WHY
        tampering was detected. Now returns a dict with reason.
        """
        if frame1 is None or frame2 is None:
            return {"tampered": False, "reason": "Insufficient frames to compare."}

        # Ensure same shape
        if frame1.shape != frame2.shape:
            frame2 = cv2.resize(frame2, (frame1.shape[1], frame1.shape[0]))

        diff = cv2.absdiff(frame1, frame2)
        non_zero_count = np.count_nonzero(diff)
        total_pixels   = diff.size  # h * w * channels

        change_ratio = non_zero_count / total_pixels

        # Exact duplicate (codec-lossless duplicate frames)
        if non_zero_count == 0:
            return {
                "tampered": True,
                "reason": "Exact frame duplicate detected — frozen/looped video suspected."
            }

        # Near-duplicate: < 0.5% of pixels changed (codec artifact tolerance)
        if change_ratio < 0.005:
            return {
                "tampered": True,
                "reason": f"Near-identical frames detected ({round(change_ratio*100,3)}% pixels differ). "
                           "Possible frozen video with minor compression noise."
            }

        return {"tampered": False, "reason": "Frames differ sufficiently.", "change_ratio": round(change_ratio, 4)}

    @staticmethod
    def validate_biomechanics(angle_history: list) -> dict:
        """
        Detects 'fake' reps — e.g. barely moving, neck-only sit-ups,
        or a pre-recorded still image played on a phone.

        BUG FIX 4: Original returned a plain string ("Clean" or a warning).
        Inconsistent return type caused downstream KeyError/AttributeError
        when callers tried to check result["status"].

        BUG FIX 5: variance < 5.0 threshold is far too tight. Normal standing
        still (idle) has a variance of ~2-8 due to breathing/sway. This would
        flag legitimate idle frames as cheating. Raised to 15.0 with extra
        range-of-motion check.
        """
        if not angle_history or len(angle_history) < 10:
            return {
                "status": "INSUFFICIENT_DATA",
                "message": "Not enough frames to validate biomechanics.",
                "clean": False,
            }

        arr = np.array(angle_history, dtype=np.float32)
        variance  = float(np.var(arr))
        rom       = float(np.max(arr) - np.min(arr))   # range of motion in degrees
        mean_angle = float(np.mean(arr))

        # BUG FIX 5: tightened thresholds with multi-condition check
        if variance < 15.0 and rom < 20.0:
            return {
                "status": "SUSPICIOUS",
                "message": (
                    f"Very low range of motion ({round(rom,1)}°) and variance ({round(variance,1)}) detected. "
                    "Possible fake or minimal reps."
                ),
                "clean": False,
                "variance": round(variance, 2),
                "range_of_motion_deg": round(rom, 2),
            }

        # Check for biologically implausible angles
        if mean_angle > 175 or mean_angle < 5:
            return {
                "status": "SUSPICIOUS",
                "message": f"Mean joint angle ({round(mean_angle,1)}°) is outside normal human range.",
                "clean": False,
            }

        return {
            "status": "CLEAN",
            "message": "Biomechanics appear normal.",
            "clean": True,
            "variance": round(variance, 2),
            "range_of_motion_deg": round(rom, 2),
        }

    @staticmethod
    def run_full_audit(frames: list, angle_history: list) -> dict:
        """
        BUG FIX 6: No single entry point existed to run ALL checks together.
        Callers had to call each method individually and manually combine results.
        This convenience method runs the full audit pipeline and returns a
        unified verdict.
        """
        audit_result = {
            "passed": True,
            "violations": [],
            "details": {}
        }

        # 1. Frozen/tampered video check across consecutive frame pairs
        tamper_flags = 0
        for i in range(1, min(len(frames), 30)):  # sample first 30 frame pairs
            check = SecurityAudit.check_video_tampering(frames[i - 1], frames[i])
            if check["tampered"]:
                tamper_flags += 1

        if tamper_flags > 3:
            audit_result["passed"] = False
            audit_result["violations"].append("VIDEO_TAMPERING")
            audit_result["details"]["tampering"] = f"{tamper_flags} duplicate frame pairs detected."

        # 2. Biomechanics validation
        bio = SecurityAudit.validate_biomechanics(angle_history)
        audit_result["details"]["biomechanics"] = bio
        if not bio.get("clean", True):
            audit_result["passed"] = False
            audit_result["violations"].append("SUSPICIOUS_BIOMECHANICS")

        # 3. Multi-person check on first valid frame
        if frames:
            multi = SecurityAudit.detect_multi_person(frames[0])
            audit_result["details"]["multi_person"] = multi
            if multi:
                audit_result["passed"] = False
                audit_result["violations"].append("MULTIPLE_PERSONS_DETECTED")

        return audit_result