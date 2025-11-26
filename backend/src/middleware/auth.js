import jwt from "jsonwebtoken";
/**
 * Optional Auth Middleware
 * If token is present → attach userId
 * If no token → continue as unauthenticated (guest mode disabled now)
 */
export function optionalAuth(req, _res, next) {
    try {
        const hdr = req.headers.authorization;
        if (!hdr?.startsWith("Bearer "))
            return next();
        const token = hdr.slice(7);
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.auth = { userId: payload.userId };
    }
    catch {
        // Invalid / expired token -> just continue without aborting
    }
    next();
}
