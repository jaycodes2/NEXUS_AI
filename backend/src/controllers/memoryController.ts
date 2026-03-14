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

        // Run both searches in parallel with userId filter inside the pipeline
        // (same fix applied to rag.ts — filter in JS was leaking other users' data)
        const [promptResults, replyResults] = await Promise.all([
            History.aggregate([
                {
                    $vectorSearch: {
                        index: "history_vector_index",
                        path: "promptEmbedding",
                        queryVector: queryEmbedding,
                        numCandidates: 100,
                        limit: 16,
                        filter: { userId },
                    }
                },
                { $addFields: { score: { $meta: "vectorSearchScore" } } }
            ]),
            History.aggregate([
                {
                    $vectorSearch: {
                        index: "history_vector_index",
                        path: "replyEmbedding",
                        queryVector: queryEmbedding,
                        numCandidates: 100,
                        limit: 16,
                        filter: { userId },
                    }
                },
                { $addFields: { score: { $meta: "vectorSearchScore" } } }
            ])
        ]);

        // Merge, deduplicate, sort by score, take top 8
        const seen = new Set<string>();
        const merged = [...promptResults, ...replyResults]
            .filter(doc => {
                const id = doc._id.toString();
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            })
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            .slice(0, 8);

        if (merged.length === 0) {
            return res.json({ answer: "No relevant past conversations found." });
        }

        const memories = merged
            .map((r, i) => `Memory ${i + 1}:\nUser: ${r.prompt}\nAssistant: ${r.reply}`)
            .join("\n\n");

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