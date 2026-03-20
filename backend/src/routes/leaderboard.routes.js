import { Router } from 'express';
import { getLeaderboardByTest } from '../controllers/leaderboard.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// BUG FIX 1: Leaderboard route had NO auth protection — anyone on the
// internet could enumerate athlete scores and names without logging in.
// Added verifyJWT. If you want the leaderboard to be public, remove it,
// but at minimum validate the testId format (done in the controller).
router.route("/:testId").get(verifyJWT, getLeaderboardByTest);

export default router;