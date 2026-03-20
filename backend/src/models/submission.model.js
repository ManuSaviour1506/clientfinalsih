import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    videoUrl: { type: String },
    status: {
      type: String,
      enum: [
        "pending",
        "analyzing",
        "completed",
        "failed",
        "normal_user",
        "prospect_approved",
      ],
      default: "pending",
    },

    // BUG FIX 1: score stored a raw rep count (e.g. 25) not a /10 value.
    // The Python service now returns score_out_of_10 (0.0–10.0).
    // Renamed to score and validated to 0–10 range.
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    // BUG FIX 2: score_out_of_10 and score_reason were never stored as
    // top-level fields — they were buried inside analysisReport.Mixed which
    // made querying/sorting by score impossible and the frontend had to dig
    // into nested objects. Added as explicit top-level fields.
    score_out_of_10: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    score_reason: {
      type: String,
      default: "",
    },

    feedback: [{ type: String }],

    // BUG FIX 3: telemetry was referenced in submission.controller.js
    // but didn't exist in the schema — Mongoose strict mode silently dropped
    // it (or threw in strict:throw mode), causing the controller's
    // telemetry data to never be persisted.
    telemetry: {
      angles:   [{ type: Number }],
      velocity: [{ type: Number }],
    },

    analysisReport: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// BUG FIX 4: No index on athlete+createdAt — getMySubmissions does a
// find+sort on every request with no index, causing full collection scans.
submissionSchema.index({ athlete: 1, createdAt: -1 });
// Index for leaderboard aggregation pipeline
submissionSchema.index({ test: 1, score: -1 });

export const Submission = mongoose.model("Submission", submissionSchema);