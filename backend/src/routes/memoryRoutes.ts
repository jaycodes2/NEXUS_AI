import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { askMyPastChats } from "../controllers/memoryController.js";

const router = Router();

router.post("/memory/ask", requireAuth, askMyPastChats);

export default router;
