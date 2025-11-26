import { Thread } from "../models/threadModel.js";
export const getThreads = async (req, res) => {
    const userId = req.auth?.userId;
    const threads = await Thread.find({ userId }).sort({ updatedAt: -1 });
    res.json(threads);
};
