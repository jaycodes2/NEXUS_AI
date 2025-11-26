import { Thread } from "../models/threadModel.js";
import { History } from "../models/historyModels.js";
// ✅ Get user's thread list
export const getThreads = async (req, res) => {
    const userId = req.auth?.userId;
    const threads = await Thread.find({ userId }).sort({ updatedAt: -1 });
    // ✅ Normalize return structure
    const formatted = threads.map(t => ({
        threadId: t.threadId,
        name: t.name
    }));
    res.json(formatted);
};
// ✅ Delete a thread + its messages
export const deleteThread = async (req, res) => {
    const userId = req.auth?.userId;
    const { threadId } = req.params;
    await Thread.deleteOne({ userId, threadId });
    await History.deleteMany({ userId, threadId });
    return res.json({ success: true });
};
