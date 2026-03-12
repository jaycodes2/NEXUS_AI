import { geminiClient as ai } from "./aiClient.gemini.js";

export async function generateTitleFromMessage(message: string): Promise<string> {
  const prompt = `Generate a very short conversation title (3-6 words max) based on this message:
"${message}"

Rules:
- No punctuation
- No quotes
- Must be concise and descriptive
- Reply with the title only, nothing else`;

  try {
    // Use raw() instead of chat() — no tools, no streaming, no history needed
    const result = await ai.raw(prompt);
    return result.trim().slice(0, 60) || message.slice(0, 20) || "New Chat";
  } catch (error) {
    console.error("Title Generation Error:", error);
    return message.slice(0, 20) || "New Chat";
  }
}