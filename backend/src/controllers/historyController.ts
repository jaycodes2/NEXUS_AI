import { Request, Response } from "express";
import { History } from "../models/historyModels.js";
import { AuthedRequest } from "../middleware/auth";
import { Thread } from "../models/threadModel.js";
export const getThreads = async (req: AuthedRequest, res: Response) => {
  const userId = req.auth?.userId;
  const threads = await Thread.find({ userId }).sort({ updatedAt: -1 });
  res.json(threads);
};
