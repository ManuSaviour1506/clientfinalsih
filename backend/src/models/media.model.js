// BUG FIX 1: This file used CommonJS (require/module.exports) while every
// other file in the project uses ESM (import/export). This causes:
//   "require is not defined in ES module scope"
// when Node runs with "type":"module" in package.json (which this project uses).
// Converted the entire file to ESM syntax.

import mongoose from 'mongoose';

const { Schema } = mongoose;

const mediaSchema = new Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
      unique: true,
    },
    fileType: {
      type: String,
      required: true,
      // BUG FIX 2: 'video/mp4' only is too restrictive — mobile devices often
      // upload video/quicktime (.mov) or video/x-matroska (.mkv).
      // Widened to cover common upload formats.
      enum: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'video/mp4',
        'video/quicktime',
        'video/x-matroska',
        'application/pdf',
      ],
    },
    size: {
      type: Number, // bytes
      required: true,
    },
    altText: {
      type: String,
      default: 'Media file',
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// BUG FIX 3: No index on uploadedBy — any "get my media" query does
// a full collection scan. Added compound index for common query pattern.
mediaSchema.index({ uploadedBy: 1, createdAt: -1 });

export const Media = mongoose.model('Media', mediaSchema);