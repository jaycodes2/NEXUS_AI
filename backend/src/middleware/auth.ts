import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthedRequest extends Request {
  auth?: { userId?: string };
}

/**
 * Optional Auth Middleware
 * If token is present → attach userId
 * If no token → continue
 */
export function optionalAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const hdr = req.headers.authorization;
    if (!hdr?.startsWith("Bearer ")) return next();

    const token = hdr.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

    req.auth = { userId: payload.userId };
  } catch {
    // ignore
  }

  next();
}

/**
 * 🔒 REQUIRED Auth Middleware
 * Rejects request if token is missing or invalid
 */
export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const hdr = req.headers.authorization;
    if (!hdr?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = hdr.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

    req.auth = { userId: payload.userId };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
