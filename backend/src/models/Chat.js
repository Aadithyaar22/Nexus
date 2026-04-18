import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    sources: [
      {
        documentId: mongoose.Schema.Types.ObjectId,
        documentTitle: String,
        chunkIndex: Number,
        snippet: String,
        score: Number,
      },
    ],
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'New conversation' },
    messages: [messageSchema],
    // which documents this conversation is scoped to ([] === all)
    scopedDocumentIds: [mongoose.Schema.Types.ObjectId],
  },
  { timestamps: true }
);

chatSchema.index({ updatedAt: -1 });

export default mongoose.model('Chat', chatSchema);
