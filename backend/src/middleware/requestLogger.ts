import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";

const httpLogger = logger.child({ module: "http" });

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, url, ip } = req;

  // Log when response finishes
  res.on("finish", () => {
    const ms = Date.now() - start;
    const status = res.statusCode;

    const logData = {
      method,
      url,
      status,
      ms,
      ip: req.headers["x-forwarded-for"] || ip,
      ua: req.headers["user-agent"]?.slice(0, 80),
    };

    // Colour-code by status
    if (status >= 500) {
      httpLogger.error(logData, `${method} ${url} ${status} ${ms}ms`);
    } else if (status >= 400) {
      httpLogger.warn(logData, `${method} ${url} ${status} ${ms}ms`);
    } else {
      httpLogger.info(logData, `${method} ${url} ${status} ${ms}ms`);
    }
  });

  next();
}
