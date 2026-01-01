import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIClient } from "./aiClient";
import { dot } from "node:test/reporters";
import * as dotenv from "dotenv"
dotenv.config();
const apiKey = process.env.GEMINI_API_KEY!;
const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

if (!apiKey) throw new Error("GEMINI_API_KEY missing in .env");

const genAI = new GoogleGenerativeAI(apiKey);
// ... existing imports and API key check ...

const model = genAI.getGenerativeModel({ 
    model: modelName,
    // This is the "brain surgery" that stops the stars from appearing
    systemInstruction: "You are a helpful assistant. Respond in plain text ONLY. Do not use Markdown formatting, bolding, or asterisks.",
});

export const geminiClient = {
    async chat(prompt: string): Promise<string> {
        const resp = await model.generateContent(prompt);
        let text = resp.response.text().trim();
        
        // Safety net: force-remove any remaining double asterisks
        text = text.replace(/\*\*/g, "");

        if (!text)
            throw new Error("Empty response from Gemini");
        return text;
    },
};
