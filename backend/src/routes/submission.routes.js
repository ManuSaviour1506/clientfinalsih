import { Router } from 'express';
import {
    createSubmission,
    getMySubmissions,
} from '../controllers/submission.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// All submission routes require authentication
router.use(verifyJWT);

// GET  /api/v1/submissions  — Get all submissions for logged-in athlete
// POST /api/v1/submissions  — Create a new AI-analyzed submission
router.route("/")
    .get(getMySubmissions)
    .post(upload.single("video"), createSubmission);

// BUG FIX 1: No file size error handler for multer. When a user uploads a
// file larger than the 100MB limit, multer throws a MulterError which is
// NOT an ApiError — it has no statusCode, so the global error handler
// returns a confusing 500 instead of a clear 413.
// Fix: add a multer error handler specifically for this router.
router.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: 'Video file is too large. Maximum allowed size is 100MB.',
        });
    }
    if (err.message === 'Invalid file type. Please upload a video.') {
        return res.status(415).json({
            success: false,
            message: err.message,
        });
    }
    next(err); // pass other errors to global handler
});

export default router;