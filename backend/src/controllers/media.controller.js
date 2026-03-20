import imagekit from '../config/imagekit.config.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const getSignedUrlForVideo = asyncHandler(async (req, res) => {
    const { fileUrl } = req.body;

    if (!fileUrl) {
        throw new ApiError(400, "fileUrl is required in the request body.");
    }

    // ── Extract the IK-relative path from the full URL ────────────────
    // IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/m48d2exwv/sportsanalyzer"
    // fileUrl stored in DB  = "https://ik.imagekit.io/m48d2exwv/sportsanalyzer/athlete_submissions/video.mp4"
    //
    // ikPath should be      = "/athlete_submissions/video.mp4"
    //
    // BUG: Old code used new URL(fileUrl).pathname which returns
    // "/m48d2exwv/sportsanalyzer/athlete_submissions/video.mp4"
    // Then imagekit.url({ path }) prepends the endpoint again → doubled path → 404.
    //
    // Fix: strip the full endpoint prefix to get only the relative path.

    const endpoint = (process.env.IMAGEKIT_URL_ENDPOINT || '').replace(/\/$/, '');

    let ikPath;
    try {
        if (fileUrl.startsWith(endpoint)) {
            // Happy path: strip the endpoint prefix exactly
            ikPath = fileUrl.slice(endpoint.length);
        } else {
            // Fallback: fileUrl doesn't start with our endpoint
            // (e.g. old records stored with a different base)
            // Just use the pathname and hope for the best
            ikPath = new URL(fileUrl).pathname;
        }

        // Strip any existing query string (?tr=orig, ?ik-s=..., etc.)
        ikPath = ikPath.split('?')[0];

        // Ensure leading slash
        if (!ikPath.startsWith('/')) ikPath = '/' + ikPath;

    } catch (e) {
        throw new ApiError(400, `Invalid fileUrl: ${fileUrl}`);
    }

    console.log(`[SIGNED URL] endpoint=${endpoint} | ikPath=${ikPath}`);

    try {
        const signedUrl = imagekit.url({
            path: ikPath,
            signed: true,
            expireSeconds: 3600,
        });

        return res.status(200).json(
            new ApiResponse(200, { signedUrl }, "Signed URL generated successfully.")
        );
    } catch (error) {
        console.error("ImageKit Signed URL Error:", error);
        throw new ApiError(500, "Failed to generate signed URL.");
    }
});

export { getSignedUrlForVideo };