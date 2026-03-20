// BUG FIX 1: dotenv.config.js was imported AND dotenv.config() was called
// again 10 lines later. Double loading is harmless but wasteful and confusing.
// More critically, the SECOND dotenv.config() call uses the default path
// (.env in cwd) which may differ from the explicit path in dotenv.config.js.
// Remove the redundant second call — the import handles everything.
import './config/dotenv.config.js';

import connectDB from './config/db.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

// Routes
import authRoutes        from './routes/auth.routes.js';
import userRoutes        from './routes/user.routes.js';
import submissionRoutes  from './routes/submission.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import postRoutes        from './routes/post.routes.js';
import testRoutes        from './routes/test.routes.js';
import mediaRoutes       from './routes/media.routes.js';

// Connect to Database
connectDB();

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.CORS_ORIGIN,
    "http://localhost:5173",
    "http://localhost:5174",
].filter(Boolean); // BUG FIX 2: filter(Boolean) removes undefined if CORS_ORIGIN
                    // is not set — otherwise indexOf(undefined) can match
                    // requests from tools that send no Origin header.

app.use(cors({
    origin: (origin, callback) => {
        // Allow no-origin requests (Postman, mobile apps, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: origin ${origin} not allowed.`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    // BUG FIX 3: X-Analysis-Results is a custom header returned by the Python
    // service and forwarded in responses. It must be in exposedHeaders so the
    // browser's fetch/axios can read it. Without this, the frontend gets
    // undefined when reading response.headers['x-analysis-results'].
    allowedHeaders:  ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders:  ["X-Analysis-Results"],
}));

// ── Body / Cookie Parsers ────────────────────────────────────────────
// BUG FIX 4: cookieParser() was registered AFTER express.static("public").
// Static file middleware doesn't need cookies, but if any static-path
// request triggered an auth check the cookie would be unreadable.
// Always register cookie/body parsers before any other middleware.
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true, limit: '16mb' }));
app.use(cookieParser());
app.use(express.static("public"));

// ── API Routes ───────────────────────────────────────────────────────
app.use('/api/v1/auth',        authRoutes);
app.use('/api/v1/users',       userRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/posts',       postRoutes);
app.use('/api/v1/tests',       testRoutes);
app.use('/api/v1/media',       mediaRoutes);

// ── Health Check ─────────────────────────────────────────────────────
// BUG FIX 5: Health check always returned db_status: "Connected" even when
// MongoDB was down — misleading in production monitoring.
app.get('/', (req, res) => {
    const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({
        message:   'Khel Pratibha API is running!',
        status:    'Healthy',
        db_status: dbState[mongoose.connection.readyState] ?? 'unknown',
    });
});

// ── Global Error Handler ─────────────────────────────────────────────
// BUG FIX 6: Error handler did not set CORS headers on error responses.
// When an error is thrown (e.g. 401, 500), Express bypasses the cors()
// middleware and the browser sees a CORS error instead of the real error,
// making debugging nearly impossible from the frontend.
app.use((err, req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    const statusCode = err.statusCode || 500;
    console.error(`[${new Date().toISOString()}] [Error ${statusCode}] ${err.message}`);

    // BUG FIX 7: In production, never leak internal stack traces to clients.
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors:  err.errors  || [],
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// ── Start Server ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});