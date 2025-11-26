import { Response } from "express";
import { Thread } from "../models/threadModel.js";
import { History } from "../models/historyModels.js";
import { AuthedRequest } from "../middleware/auth.js";

// ✅ Get user's thread list
export const getThreads = async (req: AuthedRequest, res: Response) => {
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
export const deleteThread = async (req: AuthedRequest, res: Response) => {
  const userId = req.auth?.userId;
  const { threadId } = req.params;

  await Thread.deleteOne({ userId, threadId });
  await History.deleteMany({ userId, threadId });

  return res.json({ success: true });
};
