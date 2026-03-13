import { History } from "../models/historyModels.js";
import { generateEmbedding } from "./embedding.gemini.js";

export async function retrieveRelevantMemory(
    userId: string,
    query: string,
    limit = 5
) {
    const queryEmbedding = await generateEmbedding(query);

    // Run both searches in parallel — one against prompts, one against replies
    const [promptResults, replyResults] = await Promise.all([
        History.aggregate([
            {
                $vectorSearch: {
                    index: "history_vector_index",
                    path: "promptEmbedding",
                    queryVector: queryEmbedding,
                    numCandidates: 100,
                    limit: limit * 2,
                    filter: { userId },
                }
            },
            {
                $addFields: { score: { $meta: "vectorSearchScore" } }
            }
        ]),
        History.aggregate([
            {
                $vectorSearch: {
                    index: "history_vector_index",
                    path: "replyEmbedding",
                    queryVector: queryEmbedding,
                    numCandidates: 100,
                    limit: limit * 2,
                    filter: { userId },
                }
            },
            {
                $addFields: { score: { $meta: "vectorSearchScore" } }
            }
        ])
    ]);

    // Merge, deduplicate by _id, sort by score descending, take top `limit`
    const seen = new Set<string>();
    const merged = [...promptResults, ...replyResults]
        .filter(doc => {
            const id = doc._id.toString();
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        })
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, limit);

    return merged.map(doc => ({
        prompt: doc.prompt,
        reply: doc.reply,
    }));
}