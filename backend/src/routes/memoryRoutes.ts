import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { askMyPastChats } from "../controllers/memoryController.js";
import { memoryLimiter } from "../utils/rateLimiter.js";

const router = Router();

router.post("/memory/ask", requireAuth, memoryLimiter, askMyPastChats);

export default router;