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

    // Merge, deduplicate by _id
    const seen = new Set<string>();
    const merged = [...promptResults, ...replyResults]
        .filter(doc => {
            const id = doc._id.toString();
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        })
        .sort((a, b) => {
            // Sort by score, use recency as tiebreaker for similar scores
            const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
            if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, limit);

    console.log(`[RAG] found ${merged.length} memories for query: "${query.slice(0, 50)}"`);
    merged.forEach((m, i) => console.log(`  [${i + 1}] score=${m.score?.toFixed(3)} prompt="${m.prompt.slice(0, 60)}"`));

    return merged.map(doc => ({
        prompt: doc.prompt,
        reply: doc.reply,
    }));
}