import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    content: { type: String, required: true }, // full raw text
    chunkCount: { type: Number, default: 0 },
    // Cached artefacts so we don't regenerate on every request
    summary: {
      short: String,
      keyPoints: [String],
      concepts: [String],
      generatedAt: Date,
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
    },
    error: String,
  },
  { timestamps: true }
);

documentSchema.index({ createdAt: -1 });

export default mongoose.model('Document', documentSchema);
