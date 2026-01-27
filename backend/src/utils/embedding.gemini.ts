import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export async function generateEmbedding(text: string): Promise<number[]> {
    // Lazy initialization to ensure env vars are loaded
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set in environment variables");
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }

    const model = genAI.getGenerativeModel({
        model: "text-embedding-004"
    });

    const result = await model.embedContent(text);
    return result.embedding.values;
}
