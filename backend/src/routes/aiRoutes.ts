import express from "express";
import { handleAIQuery, getHistory } from "../controllers/aiController.js";
import { getThreads, deleteThread } from "../controllers/threadController.js";
import { optionalAuth } from "../middleware/auth.js";
import { aiLimiter, globalLimiter } from "../utils/rateLimiter.js";

const router = express.Router();

router.use(optionalAuth);

// AI query — strict limit (most expensive endpoint)
router.post("/query", aiLimiter, handleAIQuery);

// History + threads — global limit (cheap DB reads)
router.get("/history", globalLimiter, getHistory);
router.get("/threads", globalLimiter, getThreads);
router.delete("/threads/:threadId", globalLimiter, deleteThread);

export default router;