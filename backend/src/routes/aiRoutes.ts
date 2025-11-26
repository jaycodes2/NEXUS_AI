import express from "express";
import { handleAIQuery, getHistory } from "../controllers/aiController.js";
import { getThreads, deleteThread } from "../controllers/threadController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// ✅ Apply optional auth to all AI routes
router.use(optionalAuth);

// ✅ Chat endpoints
router.post("/query", handleAIQuery);
router.get("/history", getHistory);

// ✅ Thread management
router.get("/threads", getThreads);
router.delete("/threads/:threadId", deleteThread);

export default router;
