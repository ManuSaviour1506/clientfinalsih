import { Test } from '../models/test.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// BUG FIX 1: tests.js data file existed but was never used — there was
// no controller function to seed the DB, so a fresh deployment had zero
// tests. Every createSubmission call returned 404 "Test not found."

// Seed data — kept here so it's co-located with the controller that uses it.
// Matches the tests.js data file exactly.
import mongoose from 'mongoose';

const SEED_TESTS = [
    {
        _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109ca'),
        name: 'Vertical Jump',
        description: 'Test your explosive leg power.',
    },
    {
        _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cb'),
        name: 'Sit-ups',
        description: 'Measure your core muscular endurance.',
    },
    {
        _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cc'),
        name: 'Endurance Run',
        description: 'A proxy test for cardiovascular fitness.',
    },
    {
        _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cd'),
        name: 'Shuttle Run',
        description: 'Test your agility and speed.',
    },
    {
        _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109ce'),
        name: 'Push-ups',
        description: 'Measure your upper body strength and endurance.',
    },
    {
        _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cf'),
        name: 'Sprint',
        description: 'Measure your raw running speed.',
    },
];

/**
 * @desc    Get all available tests
 * @route   GET /api/v1/tests
 * @access  Public
 */
const getAllTests = asyncHandler(async (req, res) => {
    const tests = await Test.find({}).sort({ name: 1 });

    // BUG FIX 2: Original returned tests with no indication of count.
    // Frontend had to check data.length. Added count to response.
    return res.status(200).json(
        new ApiResponse(200, { tests, count: tests.length }, "Tests retrieved successfully.")
    );
});

/**
 * @desc    Seed the database with default tests (admin only, run once)
 * @route   POST /api/v1/tests/seed
 * @access  Admin
 */
const seedTests = asyncHandler(async (req, res) => {
    // Admin-only guard
    if (req.user?.role !== 'admin') {
        throw new ApiError(403, "Only admins can seed tests.");
    }

    const results = {
        inserted: [],
        skipped:  [],
    };

    for (const testData of SEED_TESTS) {
        const exists = await Test.findById(testData._id);
        if (exists) {
            results.skipped.push(testData.name);
            continue;
        }
        await Test.create(testData);
        results.inserted.push(testData.name);
    }

    const message = results.inserted.length > 0
        ? `Seeded ${results.inserted.length} test(s). Skipped ${results.skipped.length} existing.`
        : `All tests already exist. Nothing inserted.`;

    return res.status(200).json(new ApiResponse(200, results, message));
});

export { getAllTests, seedTests };