import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import memoryRoutes from "./routes/memoryRoutes.js";
import { requestLogger } from "./middleware/requestLogger.js";
import logger, { dbLogger } from "./utils/logger.js";

dotenv.config();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
// FIX: single body parser with correct 15mb limit (was 1mb, then 15mb added at bottom — never applied)
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(requestLogger);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/ai", searchRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api", memoryRoutes);

// ── Database ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

mongoose
  .connect(MONGO_URI)
  .then(() => dbLogger.info({ event: "db_connected" }, "MongoDB connected"))
  .catch((err) => dbLogger.error({ err, event: "db_connection_failed" }, "MongoDB connection failed"));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, url: req.url, method: req.method, event: "unhandled_error" }, "Unhandled error");
  if (!res.headersSent) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => logger.info({ port: PORT, env: process.env.NODE_ENV || "development", event: "server_start" }, `NEXUS server running on port ${PORT}`));