import { Submission } from '../models/submission.model.js';
import { Test } from '../models/test.model.js';
import { uploadToImageKit } from '../services/analysis.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import mongoose from "mongoose";

const createSubmission = asyncHandler(async (req, res) => {
  const { testId } = req.body;
  const athleteId = req.user._id;
  const videoFile = req.file;

  if (!videoFile) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Video file is required."));
  }

  if (!mongoose.Types.ObjectId.isValid(testId)) {
    if (videoFile) fs.unlinkSync(videoFile.path);
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid Test ID format."));
  }

  const test = await Test.findById(testId);
  if (!test) {
    if (videoFile) fs.unlinkSync(videoFile.path);
    return res.status(404).json(new ApiResponse(404, null, `Test not found.`));
  }

  let analysisData = {};
  let videoUrl = null;

  try {
    const videoBuffer = fs.readFileSync(videoFile.path);

    const formData = new FormData();
    formData.append("video", videoBuffer, {
      filename: videoFile.originalname,
      contentType: videoFile.mimetype,
    });
    formData.append("testType", test.name);

    if (test.name === "Vertical Jump" && req.user.height) {
      formData.append("athleteHeightCm", req.user.height);
    }

    // Call Python analysis service
    const analysisResponse = await axios.post(
      process.env.ANALYSIS_SERVICE_URL,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "X-Internal-API-Secret": process.env.ANALYSIS_API_SECRET,
        },
      }
    );

    analysisData = analysisResponse.data;

    // Upload video to ImageKit
    const uploadedFilePath = await uploadToImageKit(
      videoBuffer,
      videoFile.originalname
    );
    videoUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}${uploadedFilePath}`;
  } catch (error) {
    console.error("Error during analysis or upload:", error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Failed to process video."));
  } finally {
    if (videoFile && fs.existsSync(videoFile.path)) {
      fs.unlinkSync(videoFile.path);
    }
  }

  // Save submission including feedback + report
  const submission = await Submission.create({
    athlete: athleteId,
    test: testId,
    videoUrl: videoUrl,
    score: analysisData.score || 0,
    status: "completed",
    feedback: analysisData.feedback || [], // ✅ Save feedback
    analysisReport: analysisData.report || {}, // ✅ Save detailed report
  });

  return res
    .status(201)
    .json(new ApiResponse(201, submission, "Analysis complete."));
});

const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ athlete: req.user._id })
    .populate("test", "name")
    .sort({ createdAt: -1 })
    .lean(); // return plain objects instead of mongoose docs

  // ✅ Ensure feedback + report are always included
  const formatted = submissions.map((sub) => ({
    _id: sub._id,
    test: sub.test,
    score: sub.score,
    status: sub.status,
    videoUrl: sub.videoUrl,
    createdAt: sub.createdAt,
    feedback: sub.feedback || [],
    report: sub.analysisReport || {},
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(200, formatted, "Submissions retrieved successfully.")
    );
});

export { createSubmission, getMySubmissions };