import { Response } from "express";
import { Thread } from "../models/threadModel.js";
import { History } from "../models/historyModels.js";
import { AuthedRequest } from "../middleware/auth.js";

/**
 * ✅ REUSABLE LOGIC (The "Service")
 * This is the "Brain" of the operation. It's called by both the AI and the API.
 */
export const performDeleteThread = async (userId: string, threadId: string) => {
  // 1. Input Validation
  if (!userId || !threadId) {
    return { success: false, message: "Missing required identification (User or Thread ID)." };
  }

  // 2. Ownership & Existence Check
  // We query by both to ensure the user actually owns the thread they are trying to kill.
  const thread = await Thread.findOne({ userId, threadId });
  
  if (!thread) {
    return { 
      success: false, 
      message: "Thread not found or you do not have permission to delete it." 
    };
  }

  // 3. Atomic Deletion
  // Use the unique _id from the found document for a precise deletion
  const threadResult = await Thread.deleteOne({ _id: thread._id });
  const historyResult = await History.deleteMany({ threadId: threadId });

  return {
    success: true,
    message: "The conversation has been permanently removed.",
    stats: {
      threadsDeleted: threadResult.deletedCount,
      messagesCleared: historyResult.deletedCount,
    }
  };
};

/**
 * ✅ API CONTROLLER
 * Handles standard HTTP requests from your frontend buttons.
 */
export const deleteThread = async (req: AuthedRequest, res: Response) => {
  const userId = req.auth?.userId;
  const { threadId } = req.params;

  if (!userId) return res.status(401).json({ error: "Unauthorized access." });

  try {
    const result = await performDeleteThread(userId, threadId);
    
    if (!result.success) {
      return res.status(403).json(result);
    }
    
    return res.json(result);
  } catch (error) {
    console.error("Delete Error:", error);
    return res.status(500).json({ error: "Internal server error during deletion." });
  }
};

/**
 * ✅ GET THREADS
 */
export const getThreads = async (req: AuthedRequest, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const threads = await Thread.find({ userId }).sort({ updatedAt: -1 });
  
  const formatted = threads.map(t => ({
    threadId: t.threadId,
    name: t.name
  }));

  res.json(formatted);
};