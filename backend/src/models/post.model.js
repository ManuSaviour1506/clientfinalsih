import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    videoUrl: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 50, // BUG FIX 1: No length limit — a client could send
                         // a multi-MB description string, bloating the DB document.
    },
}, { timestamps: true });

// BUG FIX 2: No index on user — getAllPosts sorts by createdAt across all
// posts (fine), but any "get posts by user" query does a full scan.
postSchema.index({ user: 1, createdAt: -1 });

export const Post = mongoose.model("Post", postSchema);