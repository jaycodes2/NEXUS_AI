import { History } from "../models/historyModels.js";
import { geminiClient as ai } from "./aiClient.gemini.js";

export async function generateThreadSummary(
    userId: string,
    threadId: string
) {
    const messages = await History.find({ userId, threadId })
        .sort({ createdAt: 1 })
        .limit(10);

    if (messages.length < 3) return null;

    const conversation = messages
        .map(
            m => `User: ${m.prompt}\nAssistant: ${m.reply}`
        )
        .join("\n\n");

    const prompt = `
Summarize the following conversation in 1–2 concise sentences.
Also suggest a short title (max 6 words).

Conversation:
${conversation}

Respond in this JSON format:
{
  "title": "...",
  "summary": "..."
}
  `.trim();

    const response = await ai.raw(prompt);

    // Clean up potential markdown code blocks
    const cleanedResponse = response.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(cleanedResponse);
    } catch {
        return null;
    }
}
