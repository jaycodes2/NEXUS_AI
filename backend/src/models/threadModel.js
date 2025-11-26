import mongoose from "mongoose";
const threadSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    threadId: { type: String, required: true }, // ✅ This is the ID we use everywhere
    name: { type: String, default: "New Chat" },
    updatedAt: { type: Date, default: Date.now }
});
export const Thread = mongoose.model("Thread", threadSchema);
