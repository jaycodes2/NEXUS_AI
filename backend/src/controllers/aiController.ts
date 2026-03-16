import { Response } from "express";
import { History } from "../models/historyModels.js";
import { Thread } from "../models/threadModel.js";
import { geminiClient as ai } from "../utils/aiClient.gemini.js";
import { AuthedRequest } from "../middleware/auth.js";
import { ApiLog } from "../models/ApiLog.js";
import { generateEmbedding } from "../utils/embedding.gemini.js";
import { retrieveRelevantMemory } from "../utils/rag.js";
import { aiLogger } from "../utils/logger.js";

function generateTitle(prompt: string, reply: string) {
  let base = prompt.length < 50 ? prompt : reply;
  base = base.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  return base.split(" ").slice(0, 5).join(" ") || "New Chat";
}

export const handleAIQuery = async (req: AuthedRequest, res: Response) => {
  const start = Date.now();
  try {
    const { prompt, threadId, file } = req.body;
    // file is optional: { base64: string, mimeType: string, name: string }
    const userId = req.auth?.userId;

    if (!prompt || !threadId || !userId) {
      return res.status(400).json({ error: "prompt and threadId are required" });
    }

    // File size guard — base64 of 10MB ≈ 13.6M chars
    if (file?.base64 && file.base64.length > 14_000_000) {
      return res.status(413).json({ error: "File too large. Maximum size is 10MB." });
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

    // Detect recency questions — bypass RAG, use recent history directly
    const recencyPatterns = [
      /what (was|is|were) the last (code|message|thing|prompt|command)/i,
      /what (code|thing|prompt) did (i|you) (last|just|previously|recently)/i,
      /last (code|thing|command|prompt) (i|you) (ran|asked|gave|sent|used)/i,
      /most recent(ly)?/i,
      /what did i (just|last|recently) (run|ask|send|give|do)/i,
    ];

    const isRecencyQuestion = recencyPatterns.some(p => p.test(prompt));

    let augmentedPrompt: string;

    if (isRecencyQuestion) {
      // For recency questions — use the most recent 10 history items sorted by date
      const recentHistory = await History.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const recentContext = recentHistory.length
        ? recentHistory
            .reverse()
            .map((m: any, i: number) => `Recent ${i + 1} (${new Date(m.createdAt).toLocaleString()}):\nUser: ${m.prompt}\nAssistant: ${m.reply}`)
            .join("\n\n")
        : "";

      augmentedPrompt = recentContext
        ? `Here are the user's most recent conversations in chronological order (newest last):\n\n${recentContext}\n\nCurrent user message:\n${prompt}`
        : prompt;

      aiLogger.info({ userId, event: "recency_query_detected", prompt: prompt.slice(0, 60) }, "Recency question detected — using recent history instead of RAG");
    } else {
      // For regular questions — use RAG memory context
      const memoryContext = memory.length
        ? memory.map((m: any, i: number) => `Memory ${i + 1}:\nUser: ${m.prompt}\nAssistant: ${m.reply}`).join("\n\n")
        : "";

      augmentedPrompt = memoryContext
        ? `You have access to relevant past conversations.\n\n${memoryContext}\n\nCurrent user message:\n${prompt}`
        : prompt;
    }

    aiLogger.info({
      userId,
      threadId,
      event: "ai_query_start",
      promptLen: prompt.length,
      hasFile: !!file,
      memoryCount: memory.length,
    }, "AI query started");

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
    const stream = ai.chat(augmentedPrompt, userId, threadId, previousHistory, file ?? undefined);
    let fullReply = "";

    for await (const chunk of stream) {
      fullReply += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();

    aiLogger.info({
      userId,
      threadId,
      event: "ai_query_complete",
      replyLen: fullReply.length,
      ms: Date.now() - start,
    }, `AI query complete in ${Date.now() - start}ms`);

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
    aiLogger.error({ err: error, userId: req.auth?.userId, event: "ai_query_error", ms: Date.now() - start }, "handleAIQuery error");
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