import { geminiClient as ai } from "./aiClient.gemini.js";
export async function generateTitleFromMessage(message) {
    const prompt = `
  Generate a very short conversation title (3-6 words max) based on this message:
  "${message}"

  Rules:
  - No punctuation
  - No quotes
  - Must be concise and descriptive
  `;
    try {
        const result = await ai.chat(prompt);
        return result.trim();
    }
    catch {
        return message.slice(0, 20) || "New Chat";
    }
}
