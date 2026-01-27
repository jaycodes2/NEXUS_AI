import { Response } from "express";
import { History } from "../models/historyModels.js";
import { Thread } from "../models/threadModel.js";
import { geminiClient as ai } from "../utils/aiClient.gemini.js";
import { AuthedRequest } from "../middleware/auth.js";
import { ApiLog } from "../models/ApiLog.js";
import { generateEmbedding } from "../utils/embedding.gemini.js";
import { retrieveRelevantMemory } from "../utils/rag.js"; // 🔥 ADDED

/**
 * ✅ Helper: Title Generator
 */
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

    // 1️⃣ Metrics
    await ApiLog.create({
      endpoint: "/api/ai/query",
      method: req.method,
      input_size: prompt.length,
      userId
    });

    // 2️⃣ Ensure thread
    let thread = await Thread.findOne({ userId, threadId });
    if (!thread) {
      thread = await Thread.create({ userId, threadId, name: "New Chat" });
    }

    // 3️⃣ Fetch recent thread history (UNCHANGED)
    const previousHistory = await History.find({ userId, threadId })
      .sort({ createdAt: 1 })
      .limit(20);

    // 🔥 3.5️⃣ RAG: retrieve relevant past memory (ADDED)
    const memory = await retrieveRelevantMemory(userId, prompt, 5);

    const memoryContext = memory.length
      ? memory
        .map(
          (m, i) =>
            `Memory ${i + 1}:\nUser: ${m.prompt}\nAssistant: ${m.reply}`
        )
        .join("\n\n")
      : "";

    const augmentedPrompt = memoryContext
      ? `
You have access to relevant past conversations.
Use them ONLY if helpful.

${memoryContext}

Current user message:
${prompt}
        `.trim()
      : prompt;

    // 4️⃣ AI reply (LOGIC SAME, INPUT ENHANCED)
    const reply = await ai.chat(
      augmentedPrompt,
      userId,
      threadId,
      previousHistory
    );

    // 5️⃣ Thread still exists?
    const activeThread = await Thread.findOne({ userId, threadId });
    if (!activeThread) {
      return res.json({ reply, threadDeleted: true });
    }

    // 6️⃣ Generate embeddings (UNCHANGED)
    const [promptEmbedding, replyEmbedding] = await Promise.all([
      generateEmbedding(prompt),
      generateEmbedding(reply)
    ]);

    // 7️⃣ Save history with vectors (UNCHANGED)
    await History.create({
      userId,
      threadId,
      prompt,
      reply,
      promptEmbedding,
      replyEmbedding
    });

    await Thread.updateOne(
      { userId, threadId },
      { updatedAt: Date.now() }
    );

    // 8️⃣ Auto-title only once (UNCHANGED)
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

    const results = await History.find({ userId, threadId })
      .sort({ createdAt: 1 });

    return res.json(results);

  } catch (error) {
    console.error("getHistory Error:", error);
    return res.status(500).json({ error: "Could not fetch history" });
  }
};
