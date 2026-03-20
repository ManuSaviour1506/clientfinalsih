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
    score: { type: Number, default: 0 },
    // Changed feedback to an array of strings
    feedback: [{ type: String }],
    // Added a new field for the detailed report
    analysisReport: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export const Submission = mongoose.model("Submission", submissionSchema);