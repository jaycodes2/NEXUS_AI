import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    semanticSearchAll,
    semanticSearchThread
} from "../controllers/searchController.js";

const router = Router();

router.post("/search/all", requireAuth, semanticSearchAll);
router.post("/search/thread", requireAuth, semanticSearchThread);

export default router;
