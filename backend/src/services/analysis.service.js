import ImageKit from 'imagekit';

// Lazy init — reads env vars at call time, not at import time
let _imagekit = null;
const getImageKit = () => {
    if (!_imagekit) {
        _imagekit = new ImageKit({
            publicKey:   process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey:  process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
        });
    }
    return _imagekit;
};

/**
 * Upload a buffer to ImageKit.
 * Returns the full canonical URL of the uploaded file.
 *
 * IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/m48d2exwv/sportsanalyzer"
 * Uploaded file URL     = "https://ik.imagekit.io/m48d2exwv/sportsanalyzer/athlete_submissions/video.mp4"
 */
export const uploadToImageKit = async (
    fileBuffer,
    fileName,
    folder = "athlete_submissions"
) => {
    try {
        const response = await getImageKit().upload({
            file: fileBuffer,
            fileName,
            folder,
            useUniqueFileName: true,
            // Keep files public so video playback works without signed URLs.
            // Set IMAGEKIT_PRIVATE_FILES=true in .env only if you need DRM.
            isPrivateFile: process.env.IMAGEKIT_PRIVATE_FILES === 'true',
        });

        // BUG FIX: response.url is the full canonical URL from ImageKit SDK.
        // Always return this — never manually concatenate endpoint + filePath,
        // because filePath starts with the account ID (/m48d2exwv/...) which
        // would double-prefix when combined with the endpoint.
        console.log(`[IMAGEKIT] Uploaded: ${response.url}`);
        return response.url;

    } catch (error) {
        console.error("ImageKit Upload Error:", error.message);
        throw new Error(`Failed to upload to ImageKit: ${error.message}`);
    }
};

/**
 * Generate a signed playback URL for a private ImageKit file.
 * Strips the endpoint prefix to get the IK-relative path.
 */
export const getSignedPlaybackUrl = (fileUrl, expireSeconds = 3600) => {
    const endpoint = (process.env.IMAGEKIT_URL_ENDPOINT || '').replace(/\/$/, '');

    let ikPath = fileUrl || '';
    if (ikPath.startsWith(endpoint)) {
        ikPath = ikPath.slice(endpoint.length);
    }
    ikPath = ikPath.split('?')[0];
    if (!ikPath.startsWith('/')) ikPath = '/' + ikPath;

    return getImageKit().url({
        path: ikPath,
        signed: true,
        expireSeconds,
    });
};