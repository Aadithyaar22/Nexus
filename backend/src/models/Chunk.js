import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    documentTitle: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true }, // dense vector
    tokenCount: Number,
  },
  { timestamps: true }
);

chunkSchema.index({ documentId: 1, chunkIndex: 1 });

export default mongoose.model('Chunk', chunkSchema);
