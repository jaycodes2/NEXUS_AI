import { Response } from "express";
import { History } from "../models/historyModels.js";
import { Thread } from "../models/threadModel.js";
import { geminiClient as ai } from "../utils/aiClient.gemini.js";
import { AuthedRequest } from "../middleware/auth.js";
import { ApiLog } from "../models/ApiLog.js";

/**
 * ✅ Helper: Title Generator
 * Placed here to ensure 'handleAIQuery' can find it.
 */
function generateTitle(prompt: string, reply: string) {
  let base = prompt.length < 50 ? prompt : reply;
  // Clean special characters and limit to 5 words
  base = base.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  return base.split(" ").slice(0, 5).join(" ") || "New Chat";
}

export const handleAIQuery = async (req: AuthedRequest, res: Response) => {
  try {
    const { prompt, threadId } = req.body;
    const userId = req.auth?.userId;

    if (!prompt || !threadId || !userId) {
      return res.status(400).json({ error: "prompt and threadId are required" });
    }

    // 1. Log metrics
    await ApiLog.create({
      endpoint: "/api/ai/query",
      method: req.method,
      input_size: prompt.length,
      userId
    });

    // 2. Ensure thread exists before chat
    let thread = await Thread.findOne({ userId, threadId });
    if (!thread) {
      thread = await Thread.create({ userId, threadId, name: "New Chat" });
    }

    // 3. Generate AI Response (Passing all 3 required args)
    const reply = await ai.chat(prompt, userId, threadId);

    // 4. Check if thread still exists (Agentic AI might have deleted it)
    const activeThread = await Thread.findOne({ userId, threadId });
    
    if (!activeThread) {
      // Return immediately if the thread was deleted by the AI tool
      return res.json({ reply, threadDeleted: true });
    }

    // 5. Save History & Update metadata
    await History.create({ userId, threadId, prompt, reply });
    await Thread.updateOne(
      { userId, threadId },
      { updatedAt: Date.now() }
    );

    // 6. Auto-title only on the first message
    const count = await History.countDocuments({ userId, threadId });
    if (count === 1) {
      const title = generateTitle(prompt, reply);
      await Thread.updateOne(
        { userId, threadId },
        { name: title }
      );
    }

    return res.json({ reply });

  } catch (error) {
    console.error("handleAIQuery Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getHistory = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    const threadId = req.query.threadId as string;

    if (!threadId) {
      return res.status(400).json({ error: "threadId is required" });
    }

    const results = await History.find({ userId, threadId }).sort({ createdAt: 1 });
    return res.json(results);

  } catch (error) {
    console.error("getHistory Error:", error);
    return res.status(500).json({ error: "Could not fetch history" });
  }
};