import { Router } from 'express';
import {
  getMyProfile,
  getAllSubmissionsForAdmin,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// Secured routes
router.route("/me").get(verifyJWT, getMyProfile);
router
  .route("/profile")
  .put(verifyJWT, upload.single("avatar"), updateUserProfile);


// Admin Route
router.route("/admin/submissions").get(verifyJWT, getAllSubmissionsForAdmin);

export default router;
