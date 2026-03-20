import { Submission } from '../models/submission.model.js';
import { Test } from '../models/test.model.js';
import { uploadToImageKit } from '../services/analysis.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import mongoose from 'mongoose';

const TEST_NAME_MAP = {
    "Push-ups":      "pushups",
    "Sit-ups":       "situps",
    "Vertical Jump": "vertical_jump",
    "Shuttle Run":   "shuttle_run",
    "Endurance Run": "endurance",
    "Sprint":        "sprint",
};

const createSubmission = asyncHandler(async (req, res) => {
    const { testId } = req.body;
    const videoFile  = req.file;

    if (!videoFile) {
        return res.status(400).json(new ApiResponse(400, null, "Video file is required."));
    }

    if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
        if (fs.existsSync(videoFile.path)) fs.unlinkSync(videoFile.path);
        return res.status(400).json(new ApiResponse(400, null, "A valid Test ID is required."));
    }

    const test = await Test.findById(testId);
    if (!test) {
        if (fs.existsSync(videoFile.path)) fs.unlinkSync(videoFile.path);
        return res.status(404).json(new ApiResponse(404, null, "Test not found."));
    }

    try {
        const videoBuffer    = fs.readFileSync(videoFile.path);
        const pythonTestType = TEST_NAME_MAP[test.name] || test.name;

        const formData = new FormData();
        formData.append("video", videoBuffer, {
            filename:    videoFile.originalname,
            contentType: videoFile.mimetype,
        });
        formData.append("testType", pythonTestType);
        if (req.user?.height) formData.append("athleteHeightCm", String(req.user.height));

        // ── Call Python ML service ────────────────────────────────────
        const analysisResponse = await axios.post(
            process.env.ANALYSIS_SERVICE_URL,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    "x-internal-api-secret": process.env.ANALYSIS_API_SECRET,
                },
                responseType: 'arraybuffer',
                timeout: 180000,
            }
        );

        // ── Parse ML metadata from response header ────────────────────
        const rawHeader = analysisResponse.headers['x-analysis-results'] || '{}';
        let mlMetadata = {};
        try {
            mlMetadata = JSON.parse(decodeURIComponent(rawHeader));
        } catch {
            try { mlMetadata = JSON.parse(rawHeader); } catch { mlMetadata = {}; }
        }

        // ── Upload annotated video to ImageKit ────────────────────────
        // uploadToImageKit returns the FULL URL from ImageKit SDK (response.url)
        // e.g. "https://ik.imagekit.io/m48d2exwv/sportsanalyzer/athlete_submissions/ai_analyzed_123.mp4"
        // Store this URL as-is in MongoDB — no manual path building needed.
        const videoUrl = await uploadToImageKit(
            Buffer.from(analysisResponse.data),
            `ai_analyzed_${Date.now()}.mp4`,
            "athlete_submissions"
        );

        console.log(`[SUBMISSION] Stored videoUrl: ${videoUrl}`);

        // ── Save to MongoDB ───────────────────────────────────────────
        const submission = await Submission.create({
            athlete:         req.user._id,
            test:            testId,
            videoUrl,                                              // full URL from SDK
            score:           mlMetadata.score_out_of_10 ?? 0,
            score_out_of_10: mlMetadata.score_out_of_10 ?? 0,
            score_reason:    mlMetadata.score_reason    ?? "",
            status:   "completed",
            feedback: Array.isArray(mlMetadata.feedback) && mlMetadata.feedback.length > 0
                ? mlMetadata.feedback
                : ["Analysis complete."],
            analysisReport: {
                ...(mlMetadata.report || {}),
                score_out_of_10:          mlMetadata.score_out_of_10 ?? 0,
                score_reason:             mlMetadata.score_reason    ?? "",
                raw_score:                mlMetadata.raw_score        ?? 0,
                velocity_profile_sampled: mlMetadata.report?.velocity_profile_sampled || [],
            },
        });

        const populated = await Submission.findById(submission._id).populate('test');
        return res.status(201).json(new ApiResponse(201, populated, "AI Analysis complete."));

    } catch (error) {
        if (error.response) {
            const body = Buffer.isBuffer(error.response.data)
                ? error.response.data.toString('utf8').slice(0, 500)
                : JSON.stringify(error.response.data);
            console.error(`ML Service responded ${error.response.status}:`, body);
        } else {
            console.error("ML Pipeline Error:", error.message);
        }
        return res.status(500).json(
            new ApiResponse(500, null, `Analysis failed: ${error.message}`)
        );
    } finally {
        if (videoFile?.path && fs.existsSync(videoFile.path)) {
            fs.unlinkSync(videoFile.path);
        }
    }
});

const getMySubmissions = asyncHandler(async (req, res) => {
    const submissions = await Submission.find({ athlete: req.user._id })
        .populate('test')
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, submissions, "Submissions retrieved successfully.")
    );
});

export { createSubmission, getMySubmissions };