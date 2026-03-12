import { Response } from "express";
import { History } from "../models/historyModels.js";
import { Thread } from "../models/threadModel.js";
import { geminiClient as ai } from "../utils/aiClient.gemini.js";
import { AuthedRequest } from "../middleware/auth.js";
import { ApiLog } from "../models/ApiLog.js";
import { generateEmbedding } from "../utils/embedding.gemini.js";
import { retrieveRelevantMemory } from "../utils/rag.js";

function generateTitle(prompt: string, reply: string) {
  let base = prompt.length < 50 ? prompt : reply;
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

    // FIX 1: Run all pre-flight work in parallel instead of sequentially.
    // ApiLog, thread lookup, history fetch, and RAG all fire at the same time.
    const [, thread, previousHistory, memory] = await Promise.all([
      ApiLog.create({ endpoint: "/api/ai/query", method: req.method, input_size: prompt.length, userId }),
      Thread.findOneAndUpdate(
        { userId, threadId },
        { $setOnInsert: { userId, threadId, name: "New Chat" } },
        { upsert: true, new: true }
      ),
      History.find({ userId, threadId }).sort({ createdAt: 1 }).limit(20),
      retrieveRelevantMemory(userId, prompt, 5),
    ]);

    // Build augmented prompt
    const memoryContext = memory.length
      ? memory.map((m: any, i: number) => `Memory ${i + 1}:\nUser: ${m.prompt}\nAssistant: ${m.reply}`).join("\n\n")
      : "";

    const augmentedPrompt = memoryContext
      ? `You have access to relevant past conversations.\n\n${memoryContext}\n\nCurrent user message:\n${prompt}`
      : prompt;

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    // FIX 2: Flush headers immediately so the browser knows streaming has started
    // This eliminates the blank pause the user sees before first token arrives
    if (typeof (res as any).flushHeaders === "function") {
      (res as any).flushHeaders();
    }

    // Stream response
    const stream = ai.chat(augmentedPrompt, userId, threadId, previousHistory);
    let fullReply = "";

    for await (const chunk of stream) {
      fullReply += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();

    // FIX 3: Post-stream work runs fully in background — doesn't block or slow anything
    // Use setImmediate to ensure it doesn't block the event loop after res.end()
    setImmediate(async () => {
      try {
        const activeThread = await Thread.findOne({ userId, threadId });
        if (!activeThread || !fullReply) return;

        // FIX 4: Both embeddings generated in parallel (was effectively sequential before)
        const [promptEmbedding, replyEmbedding] = await Promise.all([
          generateEmbedding(prompt),
          generateEmbedding(fullReply),
        ]);

        const count = await History.countDocuments({ userId, threadId });

        // Batch the DB writes
        await Promise.all([
          History.create({ userId, threadId, prompt, reply: fullReply, promptEmbedding, replyEmbedding }),
          Thread.updateOne({ userId, threadId }, { updatedAt: Date.now() }),
          ...(count === 0
            ? [Thread.updateOne({ userId, threadId }, { name: generateTitle(prompt, fullReply) })]
            : []),
        ]);
      } catch (err) {
        console.error("Post-stream background error:", err);
      }
    });

  } catch (error) {
    console.error("handleAIQuery Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.end();
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