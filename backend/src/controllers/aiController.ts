import { Response } from "express";
import { History } from "../models/historyModels.js";
import { Thread } from "../models/threadModel.js";
import { geminiClient as ai } from "../utils/aiClient.gemini.js";
import { AuthedRequest } from "../middleware/auth.js";
import { mysqlPool } from "../config/mysql.js";

export const handleAIQuery = async (req: AuthedRequest, res: Response) => {
  try {
    const { prompt, threadId } = req.body;
    const userId = req.auth?.userId;

    if (!prompt || !threadId) {
      return res.status(400).json({ error: "prompt and threadId are required" });
    }
    // ✅ Log request to MySQL (Backend Metrics)
await mysqlPool.execute(
  "INSERT INTO api_logs (endpoint, method, input_size) VALUES (?, ?, ?)",
  [
    "/api/ai/query",
    req.method,
    prompt.length
  ]
);


    // ✅ Ensure thread exists
    let thread = await Thread.findOne({ userId, threadId });
    if (!thread) {
      thread = await Thread.create({
        userId,
        threadId,
        name: "New Chat",
      });
    }

    // ✅ Generate AI Response
    const reply = await ai.chat(prompt);

    // ✅ Save Message
    await History.create({ userId, threadId, prompt, reply });

    // ✅ Update thread last active time
    await Thread.updateOne(
      { userId, threadId },
      { updatedAt: Date.now() }
    );

    // ✅ Auto-title the thread only on first message
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

// ✅ Title Generator
function generateTitle(prompt: string, reply: string) {
  let base = prompt.length < 50 ? prompt : reply;
  base = base.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  return base.split(" ").slice(0, 5).join(" ") || "New Chat";
}


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
