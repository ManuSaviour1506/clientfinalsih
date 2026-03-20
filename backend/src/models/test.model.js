import mongoose from 'mongoose';

const testSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        // BUG FIX 1: No length constraint — a typo could save "Sit-ups   " 
        // (with trailing spaces). trim: true handles leading/trailing spaces
        // but maxlength prevents absurd inputs.
        maxlength: 100,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },
    demoUrl: {
        type: String,
        // BUG FIX 2: demoUrl had no validation — any string (including
        // malformed paths) could be saved. Added a simple URL format validator.
        validate: {
            validator: (v) => !v || /^https?:\/\/.+/.test(v),
            message: 'demoUrl must be a valid http/https URL.',
        },
    },
}, { timestamps: true });

// BUG FIX 3: The unique: true on `name` creates an index automatically,
// but there was no explicit index for the getAllTests query pattern.
// Mongoose unique constraint index is sufficient here — no additional index needed.
// Added a text index so tests can be searched by name/description in the future.
testSchema.index({ name: 'text', description: 'text' });

export const Test = mongoose.model("Test", testSchema);