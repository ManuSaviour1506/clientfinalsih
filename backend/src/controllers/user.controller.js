import { User } from '../models/user.model.js';
import { Submission } from '../models/submission.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { uploadToImageKit } from "../services/analysis.service.js";
import fs from "fs";

const getMyProfile = asyncHandler(async (req, res) => {
    // req.user is attached by the verifyJWT middleware
    return res.status(200).json(new ApiResponse(200, req.user, "User profile fetched successfully."));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, age, height, weight, state } = req.body;
  const userId = req.user._id;
  const avatarFile = req.file;

  // Build the update object
  const updateFields = {
    name,
    age: age ? Number(age) : undefined,
    height: height ? Number(height) : undefined,
    weight: weight ? Number(weight) : undefined,
    location: state ? { state } : undefined,
  };

  if (avatarFile) {
    let avatarUrl = null;
    try {
      const avatarBuffer = fs.readFileSync(avatarFile.path);
      const uploadResult = await uploadToImageKit(
        avatarBuffer,
        avatarFile.originalname,
        "avatars"
      );
      avatarUrl = process.env.IMAGEKIT_URL_ENDPOINT + uploadResult;
      updateFields.avatar = avatarUrl;
    } catch (error) {
      if (avatarFile && fs.existsSync(avatarFile.path)) {
        fs.unlinkSync(avatarFile.path);
      }
      throw new ApiError(500, "Failed to upload avatar image.");
    } finally {
      if (avatarFile && fs.existsSync(avatarFile.path)) {
        fs.unlinkSync(avatarFile.path);
      }
    }
  }

  // Find and update the user in the database
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select("-password");

  if (!updatedUser) {
    throw new ApiError(404, "User not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully."));
});


const getAllSubmissionsForAdmin = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json(new ApiResponse(403, null, "You are not authorized to perform this action."));
    }

    const submissions = await Submission.find({})
        .populate('athlete', 'name email')
        .populate('test', 'name')
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, submissions, "All submissions retrieved successfully."));
});

export { getMyProfile, getAllSubmissionsForAdmin, updateUserProfile };
