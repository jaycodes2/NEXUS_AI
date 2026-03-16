import { Response } from "express";
import { AuthedRequest } from "../middleware/auth.js";
import { History } from "../models/historyModels.js";
import { generateEmbedding } from "../utils/embedding.gemini.js";
import { geminiClient as ai } from "../utils/aiClient.gemini.js";
import { memoryLogger } from "../utils/logger.js";

export const askMyPastChats = async (req: AuthedRequest, res: Response) => {
    const start = Date.now();
    try {
        const userId = req.auth?.userId;
        const { question } = req.body;

        if (!userId || !question) {
            return res.status(400).json({ error: "question required" });
        }

        const queryEmbedding = await generateEmbedding(question);
        const embedMs = Date.now() - start;

        const searchStart = Date.now();
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
        const searchMs = Date.now() - searchStart;

        // Detect recency-focused questions
        const recencyKeywords = ["last", "latest", "recent", "most recent", "just ran", "just asked", "yesterday", "today", "just now"];
        const isRecencyQuery = recencyKeywords.some(k => question.toLowerCase().includes(k));

        // Merge and deduplicate
        const seen = new Set<string>();
        const merged = [...promptResults, ...replyResults]
            .filter(doc => {
                const id = doc._id.toString();
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            })
            .sort((a, b) => {
                if (isRecencyQuery) {
                    // For recency queries — sort by date descending, use score as tiebreaker
                    const dateDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    if (Math.abs(dateDiff) > 60000) return dateDiff; // more than 1 min apart — use date
                    return (b.score ?? 0) - (a.score ?? 0); // within 1 min — use score
                }
                // For regular queries — sort by score, use date as tiebreaker
                const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
                if (Math.abs(scoreDiff) > 0.05) return scoreDiff; // score differs enough — use score
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // similar score — prefer newer
            })
            .slice(0, 8);

        memoryLogger.info({
            userId,
            event: "memory_search",
            query: question.slice(0, 80),
            results: merged.length,
            topScore: merged[0]?.score?.toFixed(3) ?? null,
            embedMs,
            searchMs,
        }, `Memory search — found ${merged.length} results in ${searchMs}ms`);

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

        const aiStart = Date.now();
        const answer = await ai.raw(prompt);
        const aiMs = Date.now() - aiStart;

        memoryLogger.info({
            userId,
            event: "memory_answer_generated",
            ms: Date.now() - start,
            aiMs,
        }, "Memory answer generated");

        return res.json({ answer });

    } catch (error) {
        memoryLogger.error({ err: error, event: "memory_error", ms: Date.now() - start }, "askMyPastChats error");
        return res.status(500).json({ error: "Failed to query memory" });
    }
};