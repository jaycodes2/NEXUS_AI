import { Response } from "express";
import { AuthedRequest } from "../middleware/auth.js";
import { History } from "../models/historyModels.js";
import { generateEmbedding } from "../utils/embedding.gemini.js";
import { geminiClient as ai } from "../utils/aiClient.gemini.js";

export const askMyPastChats = async (req: AuthedRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        const { question } = req.body;

        if (!userId || !question) {
            return res.status(400).json({ error: "question required" });
        }

        const queryEmbedding = await generateEmbedding(question);

        const results = await History.aggregate([
            {
                $vectorSearch: {
                    index: "history_vector_index",
                    path: "replyEmbedding",
                    queryVector: queryEmbedding,
                    numCandidates: 1000,
                    limit: 30
                }
            }
        ]);

        const memories = results
            .filter(r => r.userId === userId)
            .slice(0, 8)
            .map(
                (r, i) =>
                    `Memory ${i + 1}:\nUser: ${r.prompt}\nAssistant: ${r.reply}`
            )
            .join("\n\n");

        if (!memories) {
            return res.json({ answer: "No relevant past conversations found." });
        }
        const prompt = `
You are an AI assistant helping a user reflect on their past conversations.

Rules:
- Use ONLY the memories provided below.
- If the memories do NOT contain enough information to answer the question, say so clearly.
- Do NOT assume or hallucinate.
- If memories are only loosely related, explain what they contain instead.

Memories:
${memories}

User question:
${question}

Respond in a helpful, honest, and clear manner.
`.trim();

        const answer = await ai.raw(prompt);

        return res.json({ answer });

    } catch (error) {
        console.error("askMyPastChats error:", error);
        return res.status(500).json({ error: "Failed to query memory" });
    }
};
