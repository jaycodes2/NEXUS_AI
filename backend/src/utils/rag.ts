import { History } from "../models/historyModels.js";
import { generateEmbedding } from "./embedding.gemini.js";

export async function retrieveRelevantMemory(
    userId: string,
    query: string,
    limit = 5
) {
    const queryEmbedding = await generateEmbedding(query);

    const results = await History.aggregate([
        {
            $vectorSearch: {
                index: "history_vector_index",
                path: "replyEmbedding",
                queryVector: queryEmbedding,
                numCandidates: 1000,
                limit: 50
            }
        }
    ]);

    return results
        .filter(doc => doc.userId === userId)
        .slice(0, limit)
        .map(doc => ({
            prompt: doc.prompt,
            reply: doc.reply
        }));
}
