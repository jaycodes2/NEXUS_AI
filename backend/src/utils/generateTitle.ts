import { geminiClient as ai } from "./aiClient.gemini.js";

export async function generateTitleFromMessage(message: string): Promise<string> {
  const prompt = `
  Generate a very short conversation title (3-6 words max) based on this message:
  "${message}"

  Rules:
  - No punctuation
  - No quotes
  - Must be concise and descriptive
  `;

  try {
    /**
     * ✅ THE FIX:
     * We pass 'SYSTEM' as the userId and threadId.
     * This tells our Gemini client that this is an internal background task,
     * not a user-facing chat session that needs 'Delete' tools.
     */
    const result = await ai.chat(prompt, "SYSTEM", "TITLE_GENERATOR");
    return result.trim();
  } catch (error) {
    console.error("Title Generation Error:", error);
    return message.slice(0, 20) || "New Chat";
  }
}