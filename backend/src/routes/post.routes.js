import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { createPost, getAllPosts } from '../controllers/post.controller.js';

const router = Router();

// BUG FIX 1: verifyJWT was listed TWICE on the POST route —
// once via router.use() (not present here but was in some versions) and
// once inline. Even without router.use(), having it inline twice means
// the JWT is verified, req.user is set, then JWT is verified AGAIN which
// causes a second DB lookup per request — pure waste.
// Fix: apply verifyJWT only once per route, inline.

router.route('/')
    .post(verifyJWT, upload.single('video'), createPost)
    .get(getAllPosts);   // Public — no auth needed to view posts

export default router;