import { History } from "../models/historyModels.js";
import { Thread } from "../models/threadModel.js";
import { geminiClient as ai } from "../utils/aiClient.gemini.js";
import { ApiLog } from "../models/ApiLog.js"; // ← New MongoDB model

export const handleAIQuery = async (req, res) => {
    try {
        const { prompt, threadId } = req.body;
        const userId = req.auth?.userId;
        if (!prompt || !threadId) {
            return res.status(400).json({ error: "prompt and threadId are required" });
        }
        
        // ✅ Log request to MongoDB (API Logs)
        await ApiLog.create({
            endpoint: "/api/ai/query",
            method: req.method,
            input_size: prompt.length,
            userId
        });
        // ✅ Ensure thread exists
        let thread = await Thread.findOne({ userId, threadId });
        if (!thread) {
            thread = await Thread.create({
                userId,
                threadId,
                name: "New Chat",
            });
        }
        // ✅ Generate AI Response
        const reply = await ai.chat(prompt);
        // ✅ Save Message
        await History.create({ userId, threadId, prompt, reply });
        // ✅ Update thread last active time
        await Thread.updateOne({ userId, threadId }, { updatedAt: Date.now() });
        // ✅ Auto-title the thread only on first message
        const count = await History.countDocuments({ userId, threadId });
        if (count === 1) {
            const title = generateTitle(prompt, reply);
            await Thread.updateOne({ userId, threadId }, { name: title });
        }
        return res.json({ reply });
    }
    catch (error) {
        console.error("handleAIQuery Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
// ✅ Title Generator
function generateTitle(prompt, reply) {
    let base = prompt.length < 50 ? prompt : reply;
    base = base.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    return base.split(" ").slice(0, 5).join(" ") || "New Chat";
}
export const getHistory = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const threadId = req.query.threadId;
        if (!threadId) {
            return res.status(400).json({ error: "threadId is required" });
        }
        const results = await History.find({ userId, threadId }).sort({ createdAt: 1 });
        return res.json(results);
    }
    catch (error) {
        console.error("getHistory Error:", error);
        return res.status(500).json({ error: "Could not fetch history" });
    }
};
