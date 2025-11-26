import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  threadId: { type: String, required: true }, 
  prompt: { type: String, required: true },
  reply: { type: String, required: true },
  userId: { type: String, default: "guest" }, // real user later
  createdAt: { type: Date, default: Date.now }
});

export const History = mongoose.model("History", historySchema);
