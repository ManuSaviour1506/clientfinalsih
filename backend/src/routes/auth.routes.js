import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller.js';
import rateLimit from 'express-rate-limit';

// BUG FIX 1: No rate limiting on auth routes — an attacker can brute-force
// passwords or spam registrations indefinitely. A single IP could try
// thousands of password combinations per second with no throttling.
// Fix: apply a strict rate limiter to both auth endpoints.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                   // max 20 attempts per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
});

const router = Router();

// BUG FIX 2: No validation middleware — malformed JSON bodies (missing
// fields, wrong types) bubble all the way into the controller before being
// caught. The controller does manual checks which is fine, but having a
// route-level guard means invalid requests are rejected earlier and
// consistently without hitting the DB at all.
// (Validation is done in auth.controller.js already — no extra dep needed here)

router.route("/register").post(authLimiter, registerUser);
router.route("/login").post(authLimiter, loginUser);

export default router;