import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import logger from "./logger.js";

// ── Handler called when limit is exceeded ─────────────────────────────────────
const onLimitReached = (route: string) => (req: Request, res: Response) => {
  logger.warn({
    module: "rate-limit",
    event: "rate_limit_exceeded",
    route,
    ip: req.headers["x-forwarded-for"] || req.ip,
    url: req.url,
    method: req.method,
  }, `Rate limit exceeded on ${route}`);

  res.status(429).json({
    message: "Too many requests. Please slow down and try again shortly.",
  });
};

// ── Auth — 20 requests per minute ─────────────────────────────────────────────
// Protects login/register from brute force attacks
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: onLimitReached("auth"),
});

// ── AI queries — 60 requests per minute ──────────────────────────────────────
// Generous for power users, stops API abuse
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: onLimitReached("ai"),
});

// ── Memory search — 30 requests per minute ───────────────────────────────────
// Memory queries are more expensive (2x vector search + Gemini)
export const memoryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: onLimitReached("memory"),
});

// ── Global fallback — 100 requests per minute ────────────────────────────────
// Catches everything else (threads, history, contact etc.)
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: onLimitReached("global"),
});
