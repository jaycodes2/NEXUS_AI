import { Response } from "express";
import { AuthedRequest } from "../middleware/auth.js";
import { History } from "../models/historyModels.js";
import { generateEmbedding } from "../utils/embedding.gemini.js";

/**
 * 🔍 Search across ALL chats (M0-safe)
 */
export const semanticSearchAll = async (req: AuthedRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        const { query, limit = 5 } = req.body;

        if (!userId || !query) {
            return res.status(400).json({ error: "query is required" });
        }

        const queryEmbedding = await generateEmbedding(query);

        const rawResults = await History.aggregate([
            {
                $vectorSearch: {
                    index: "history_vector_index",
                    path: "replyEmbedding",
                    queryVector: queryEmbedding,
                    numCandidates: 1000,
                    limit: 100
                }
            }
        ]);

        // 🔒 Manual filtering (M0 workaround)
        const filtered = rawResults
            .filter(doc => doc.userId === userId)
            .slice(0, limit)
            .map(doc => ({
                prompt: doc.prompt,
                reply: doc.reply,
                threadId: doc.threadId,
                createdAt: doc.createdAt,
                score: doc._score
            }));

        return res.json(filtered);
    } catch (error) {
        console.error("semanticSearchAll error:", error);
        return res.status(500).json({ error: "Semantic search failed" });
    }
};

/**
 * 🔍 Search inside ONE thread (M0-safe)
 */
export const semanticSearchThread = async (req: AuthedRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        const { query, threadId, limit = 5 } = req.body;

        if (!userId || !query || !threadId) {
            return res.status(400).json({ error: "query and threadId required" });
        }

        const queryEmbedding = await generateEmbedding(query);

        const rawResults = await History.aggregate([
            {
                $vectorSearch: {
                    index: "history_vector_index",
                    path: "replyEmbedding",
                    queryVector: queryEmbedding,
                    numCandidates: 1000,
                    limit: 100
                }
            }
        ]);

        const filtered = rawResults
            .filter(doc => doc.userId === userId && doc.threadId === threadId)
            .slice(0, limit)
            .map(doc => ({
                prompt: doc.prompt,
                reply: doc.reply,
                createdAt: doc.createdAt,
                score: doc._score
            }));

        return res.json(filtered);
    } catch (error) {
        console.error("semanticSearchThread error:", error);
        return res.status(500).json({ error: "Thread semantic search failed" });
    }
};
