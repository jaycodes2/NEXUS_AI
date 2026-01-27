import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  threadId: { type: String, required: true },
  userId: { type: String, default: "guest", index: true },

  prompt: { type: String, required: true },
  reply: { type: String, required: true },

  // 🔥 Vector Embeddings
  promptEmbedding: {
    type: [Number],
    required: true
  },
  replyEmbedding: {
    type: [Number],
    required: true
  },

  createdAt: { type: Date, default: Date.now }
});

export const History = mongoose.model("History", historySchema);
