import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthedRequest extends Request {
  auth?: { userId?: string };
}

/**
 * Optional Auth Middleware
 * If token is present → attach userId
 * If no token → continue as unauthenticated (guest mode disabled now)
 */
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const hdr = req.headers.authorization;
    if (!hdr?.startsWith("Bearer ")) return next();

    const token = hdr.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET! as string) as any;

    
    req.auth = { userId: payload.userId };

  } catch {
    // Invalid / expired token -> just continue without aborting
  }

  next();
}
