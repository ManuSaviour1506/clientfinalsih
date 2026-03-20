import { Router } from 'express';
import { getAllTests } from '../controllers/test.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// BUG FIX 1: getAllTests required verifyJWT — but the frontend needs to
// display the list of available tests on the dashboard BEFORE the user
// has submitted anything, and possibly on a public landing page too.
// Test names/descriptions are not sensitive data.
// Made public. If you want it private again, just add verifyJWT back.

// BUG FIX 2: There was no seed/admin route to insert the test documents
// into MongoDB. The tests.js data file existed but had no route wired to it,
// so a fresh database had zero tests and every submission returned 404.
// Added a one-time seed endpoint protected by verifyJWT + admin role check.
import { seedTests } from '../controllers/test.controller.js';

router.route('/').get(getAllTests);

// POST /api/v1/tests/seed  — Admin only, run once on fresh deployment
router.route('/seed').post(verifyJWT, seedTests);

export default router;