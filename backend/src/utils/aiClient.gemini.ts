import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIClient } from "./aiClient";
import { dot } from "node:test/reporters";
import * as dotenv from "dotenv"
dotenv.config();
const apiKey = process.env.GEMINI_API_KEY!;
const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

if (!apiKey) throw new Error("GEMINI_API_KEY missing in .env");

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: modelName });

export const geminiClient: AIClient = {
  async chat(prompt: string): Promise<string> {
    const resp = await model.generateContent(prompt);
    const text = resp.response.text().trim();
    if (!text) throw new Error("Empty response from Gemini");
    return text;
  },
};
