import { User } from '../models/user.model.js';
import { Submission } from '../models/submission.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadToImageKit } from '../services/analysis.service.js';
import fs from 'fs';

const getMyProfile = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "User profile fetched successfully.")
    );
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const { name, age, height, weight, state } = req.body;
    const userId    = req.user._id;
    const avatarFile = req.file;

    // Only include fields that were actually sent
    const updateFields = {};
    if (name   !== undefined) updateFields.name   = name;
    if (age    !== undefined) updateFields.age    = Number(age);
    if (height !== undefined) updateFields.height = Number(height);
    if (weight !== undefined) updateFields.weight = Number(weight);
    // Use dot-notation so only state is updated, not the whole location object
    if (state  !== undefined) updateFields['location.state'] = state;

    // Handle avatar upload
    if (avatarFile) {
        // BUG FIX: upload.middleware.js was rejecting image files (only allowed video).
        // Now fixed in middleware. This block will now actually be reached.
        try {
            const avatarBuffer = fs.readFileSync(avatarFile.path);
            const avatarUrl    = await uploadToImageKit(
                avatarBuffer,
                avatarFile.originalname,
                "avatars"
            );
            // uploadToImageKit returns full URL directly from SDK
            updateFields.avatar = avatarUrl;
        } catch (error) {
            console.error("[AVATAR UPLOAD ERROR]", error.message);
            throw new ApiError(500, "Failed to upload avatar image.");
        } finally {
            if (avatarFile?.path && fs.existsSync(avatarFile.path)) {
                fs.unlinkSync(avatarFile.path);
            }
        }
    }

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json(
            new ApiResponse(400, null, "No fields provided to update.")
        );
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
        throw new ApiError(404, "User not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Profile updated successfully.")
    );
});

const getAllSubmissionsForAdmin = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json(
            new ApiResponse(403, null, "You are not authorized to perform this action.")
        );
    }

    const submissions = await Submission.find({})
        .populate('athlete', 'name email')
        .populate('test', 'name')
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, submissions, "All submissions retrieved successfully.")
    );
});

export { getMyProfile, getAllSubmissionsForAdmin, updateUserProfile };