import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  threadId: { type: String, required: true },

  name: { type: String, default: "New Chat" },

  // 🔥 NEW FIELDS
  summary: { type: String, default: "" },
  messageCount: { type: Number, default: 0 },

  updatedAt: { type: Date, default: Date.now }
});

export const Thread = mongoose.model("Thread", threadSchema);
