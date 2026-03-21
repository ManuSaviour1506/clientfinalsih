import os
import shutil
import cv2
import json
import mediapipe as mp
from pathlib import Path
from fastapi import FastAPI, Form, File, UploadFile, Header, HTTPException
from fastapi.responses import StreamingResponse

# Load .env using absolute path so it works regardless of where uvicorn is launched from
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / ".env"
    load_dotenv(dotenv_path=env_path, override=True)
    print(f"[DOTENV] Loaded from {env_path} | secret set: {bool(os.getenv('ANALYSIS_API_SECRET'))}")
except ImportError:
    print("[DOTENV] python-dotenv not installed — reading env vars from system only")

from analyzers import pushups, situps, vertical_jump, shuttle_run, sprint, endurance

app = FastAPI()

mp_drawing = mp.solutions.drawing_utils
mp_pose    = mp.solutions.pose

ANALYZER_ROUTER = {
    "pushups":       pushups.count_reps,
    "push_ups":      pushups.count_reps,
    "situps":        situps.count_reps,
    "sit_ups":       situps.count_reps,
    "vertical_jump": vertical_jump.calculate_height,
    "shuttle_run":   shuttle_run.count_laps,
    "sprint":        sprint.analyze_sprint,
    "endurance":     endurance.count_high_knees,
    "high_knees":    endurance.count_high_knees,
    "endurance_run": endurance.count_high_knees,
}

@app.get("/")
async def root():
    return {
        "status": "Online",
        "service": "Khel Pratibha AI Analysis",
        "location": "Hugging Face Spaces"
    }

@app.post("/analyze")
async def analyze_video(
    video: UploadFile = File(...),
    testType: str = Form(...),
    x_internal_api_secret: str = Header(default=None),
):
    # ── Auth ──────────────────────────────────────────────────────────
    expected = os.getenv("ANALYSIS_API_SECRET", "")
    print(f"[AUTH] received='{x_internal_api_secret}' | expected='{expected}'")

    if not expected:
        raise HTTPException(status_code=500, detail="ANALYSIS_API_SECRET not set on server.")
    if x_internal_api_secret != expected:
        raise HTTPException(status_code=403, detail="Forbidden")

    # ── Route ─────────────────────────────────────────────────────────
    normalized = testType.lower().strip().replace(" ", "_").replace("-", "_")
    analyzer_fn = ANALYZER_ROUTER.get(normalized)
    if not analyzer_fn:
        raise HTTPException(status_code=400, detail=f"Unknown testType '{testType}'.")

    # ── Save uploaded video ───────────────────────────────────────────
    safe_name   = os.path.basename(video.filename or "upload.mp4")
    temp_input  = f"raw_{safe_name}"
    temp_output = f"processed_{safe_name}"

    with open(temp_input, "wb") as f:
        shutil.copyfileobj(video.file, f)

    # ── Skeleton overlay ──────────────────────────────────────────────
    cap    = cv2.VideoCapture(temp_input)
    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps    = cap.get(cv2.CAP_PROP_FPS) or 30.0
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out    = cv2.VideoWriter(temp_output, fourcc, fps, (width, height))

    with mp_pose.Pose(min_detection_confidence=0.5) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)
            if results.pose_landmarks:
                mp_drawing.draw_landmarks(
                    frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS
                )
            out.write(frame)
    cap.release()
    out.release()

    # ── Run analyzer ──────────────────────────────────────────────────
    try:
        if normalized == "vertical_jump":
            ml_results = analyzer_fn(temp_input, athlete_height_cm=170)
        else:
            ml_results = analyzer_fn(temp_input)
    except Exception as e:
        print(f"[ANALYZER ERROR] {e}")
        ml_results = {
            "raw_score": 0, "score_out_of_10": 0,
            "score_reason": f"Analyzer error: {str(e)}",
            "feedback": ["Analysis failed internally."],
            "report": {}
        }

    response_payload = {
        "testType":        testType,
        "raw_score":       ml_results.get("raw_score", 0),
        "score_out_of_10": ml_results.get("score_out_of_10", 0),
        "score_reason":    ml_results.get("score_reason", ""),
        "feedback":        ml_results.get("feedback", []),
        "report":          ml_results.get("report", {}),
    }
    print(f"[RESULT] score={response_payload['score_out_of_10']}/10")

    def iterfile():
        with open(temp_output, "rb") as f:
            yield from f
        for p in [temp_input, temp_output]:
            if os.path.exists(p):
                os.remove(p)

    return StreamingResponse(
        iterfile(),
        media_type="video/mp4",
        headers={"X-Analysis-Results": json.dumps(response_payload)}
    )
