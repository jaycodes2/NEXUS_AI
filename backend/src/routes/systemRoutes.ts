import { Router } from "express";
import { getSystemLogs } from "../controllers/systemController.js";

const router = Router();

router.get("/logs", getSystemLogs);

export default router;
