import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    // In production — plain JSON (Render reads this natively)
    // In development — pretty printed with colors
    ...(isDev
      ? {}
      : {
          formatters: {
            level(label: string) {
              return { level: label };
            },
          },
          timestamp: pino.stdTimeFunctions.isoTime,
        }),
  },
  isDev
    ? pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      })
    : undefined
);

export default logger;

// ── Scoped child loggers ──────────────────────────────────────────────────────
// Use these in each module so logs are tagged by context

export const authLogger = logger.child({ module: "auth" });
export const aiLogger = logger.child({ module: "ai" });
export const memoryLogger = logger.child({ module: "memory" });
export const ragLogger = logger.child({ module: "rag" });
export const dbLogger = logger.child({ module: "db" });
