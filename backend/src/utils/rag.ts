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

    // Meta-question patterns — skip memories that are questions about memory itself
    // These pollute RAG context and cause Gemini to answer from old meta-questions
    const metaPatterns = [
        /what (was|is|were) the last (code|message|thing|prompt)/i,
        /what did (i|you) (ask|run|say|tell)/i,
        /what was (my|the) (last|previous|recent)/i,
        /do you remember/i,
        /what have (i|we) (discussed|talked|been)/i,
    ];

    const isMetaQuestion = (prompt: string) =>
        metaPatterns.some(p => p.test(prompt));

    // Merge, deduplicate by _id, filter meta-questions
    const seen = new Set<string>();
    const merged = [...promptResults, ...replyResults]
        .filter(doc => {
            const id = doc._id.toString();
            if (seen.has(id)) return false;
            seen.add(id);
            // Skip meta-questions about memory — they pollute context
            if (isMetaQuestion(doc.prompt || "")) return false;
            return true;
        })
        .sort((a, b) => {
            // Sort by score, use recency as tiebreaker for similar scores
            const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
            if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, limit);

    return merged.map(doc => ({
        prompt: doc.prompt,
        reply: doc.reply,
    }));
}