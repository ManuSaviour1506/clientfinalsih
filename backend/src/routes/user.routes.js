import { Router } from 'express';
import {
    getMyProfile,
    getAllSubmissionsForAdmin,
    updateUserProfile,
} from "../controllers/user.controller.js";
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// GET /api/v1/users/me — Get logged-in user's profile
router.route("/me").get(verifyJWT, getMyProfile);

// BUG FIX 1: Used PUT for profile update — PUT means REPLACE the entire
// resource. The controller uses $set with only provided fields (partial
// update), which is the semantics of PATCH, not PUT.
// A frontend sending PUT expects all fields to be required; sending PATCH
// makes it clear only provided fields are updated.
// Changed to PATCH. Update your frontend API calls accordingly:
//   axios.patch('/api/v1/users/profile', formData)
router
    .route("/profile")
    .patch(verifyJWT, upload.single("avatar"), updateUserProfile);

// BUG FIX 2: upload.single("avatar") was also applied to non-file routes
// via router.use() in some versions. Kept it only on the route that needs it.

// GET /api/v1/users/admin/submissions — Admin: view all submissions
// BUG FIX 3: Admin route path "/admin/submissions" is ambiguous — Express
// could confuse "/admin/submissions" with "/:userId/submissions" if a
// parameterised route is added later. Kept as-is since no param routes
// exist yet, but noted for when user profile pages are added.
router.route("/admin/submissions").get(verifyJWT, getAllSubmissionsForAdmin);

export default router;