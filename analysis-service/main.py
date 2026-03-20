import os
import shutil
from fastapi import FastAPI, Form, File, UploadFile, HTTPException, Header
from analyzers import vertical_jump, situps, endurance, shuttle_run, pushups

app = FastAPI(title="Khel Pratibha Analysis Service")

# This secret should be stored securely, e.g., as an environment variable
INTERNAL_API_SECRET = "khel-pratibha-internal-secret-987xyz"

def scale_score(score: float, test_type: str) -> float:
    """
    Scales the raw score from an analysis to a 1-10 point system.
    """
    # Define the maximum possible score for each test to normalize the results.
    # These values can be adjusted based on expected performance standards.
    max_scores = {
        'Vertical Jump': 100.0,  # Max jump height in cm
        'Sit-ups': 50.0,         # Max reps in the given time
        'Endurance Run': 150.0,  # Max high-knee reps
        'Shuttle Run': 20.0,     # Max laps
        'Push-ups': 50.0,        # Max reps
    }
    
    # Get the max score for the given test type; default to 1.0 to avoid division by zero.
    max_score = max_scores.get(test_type, 1.0)
    if max_score == 0:
        return 1.0

    # Ensure the score does not exceed the maximum defined value.
    score = min(float(score), max_score)
    
    # Linear scaling formula: 1 + (score / max_score) * 9
    # This maps a score of 0 to 1 and the max_score to 10.
    scaled_score = 1 + (score / max_score) * 9
    
    return round(scaled_score, 2)

@app.post("/analyze")
async def analyze_video(
    video: UploadFile = File(...),
    testType: str = Form(...),
    athleteHeightCm: float = Form(None),
    x_internal_api_secret: str = Header(...)
):
    """
    Main endpoint to receive a video, analyze it based on the test type,
    and return a scaled score, feedback, and a detailed report.
    """
    # Security check to ensure requests are coming from our own backend
    if x_internal_api_secret != INTERNAL_API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Save the uploaded video file temporarily
    temp_video_path = f"temp_{video.filename}"
    with open(temp_video_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    analysis_result = {}
    try:
        print(f"🔬 Analyzing test '{testType}'...")
        
        # Route to the correct analyzer based on the test type
        if testType == 'Vertical Jump':
            if not athleteHeightCm:
                raise HTTPException(status_code=400, detail="Athlete height is required for Vertical Jump.")
            analysis_result = vertical_jump.calculate_height(temp_video_path, athleteHeightCm)
        
        elif testType == 'Sit-ups':
            analysis_result = situps.count_reps(temp_video_path)
            
        elif testType == 'Endurance Run': # Mapped to high knees
            analysis_result = endurance.count_high_knees(temp_video_path)
            
        elif testType == 'Shuttle Run':
            analysis_result = shuttle_run.count_laps(temp_video_path)
            
        elif testType == 'Push-ups':
            analysis_result = pushups.count_reps(temp_video_path)
            
        else:
            raise HTTPException(status_code=400, detail=f"Invalid test type: {testType}")
        
        # Scale the raw score from the analysis
        scaled_score = scale_score(analysis_result.get("raw_score", 0), testType)
        print(f"🏆 Analysis complete. Raw Score: {analysis_result.get('raw_score', 0)}, Scaled Score: {scaled_score}")

    except Exception as e:
        # Catch any errors during the analysis process
        print(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Video analysis failed: {str(e)}")
    finally:
        # Clean up the temporary video file
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)

    # Return the complete analysis data
    return {
        "message": "Analysis successful",
        "score": scaled_score,
        "feedback": analysis_result.get("feedback", []),
        "report": analysis_result.get("report", {})
    }

@app.get("/")
def read_root():
    """
    Root endpoint to confirm the service is running.
    """
    return {"message": "Khel Pratibha Analysis Service is operational."}