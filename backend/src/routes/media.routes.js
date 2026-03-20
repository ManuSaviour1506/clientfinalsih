import { Router } from 'express';
import { getSignedUrlForVideo } from '../controllers/media.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// All media routes require authentication
router.use(verifyJWT);

// POST /api/v1/media/signed-url
// Body: { fileUrl: "https://ik.imagekit.io/..." }
// Returns a time-limited signed URL for private video playback
router.route('/signed-url').post(getSignedUrlForVideo);

// BUG FIX 1: There was no way for the frontend to get a signed URL for
// multiple videos at once (e.g. loading the submission history page with
// 6 videos requires 6 separate POST requests). This is fine for now but
// noted — a bulk endpoint can be added here when needed:
// router.route('/signed-urls/bulk').post(getBulkSignedUrls);

export default router;