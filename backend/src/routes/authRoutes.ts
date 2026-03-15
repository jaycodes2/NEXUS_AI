import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { register, login } from "../controllers/authController.js";
import { authLimiter } from "../utils/rateLimiter.js";
import "../utils/passport.js";
import { authLogger } from "../utils/logger.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ── Email / password ──────────────────────────────────────────────────────────
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

// ── Google OAuth ──────────────────────────────────────────────────────────────

// Step 1 — redirect user to Google consent screen
router.get(
  "/google",
  authLimiter,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Step 2 — Google redirects back here with auth code
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/#/login?error=oauth_failed`,
  }),
  (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.redirect(`${FRONTEND_URL}/#/login?error=oauth_failed`);
      }

      // Sign JWT exactly like email login
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

      authLogger.info({
        event: "google_oauth_success",
        userId: user._id.toString(),
        email: user.email,
      }, "Google OAuth success");

      // Redirect to frontend with token — frontend stores it in localStorage
      res.redirect(`${FRONTEND_URL}/#/auth/callback?token=${token}`);
    } catch (err) {
      authLogger.error({ err, event: "google_oauth_callback_error" }, "Google OAuth callback error");
      res.redirect(`${FRONTEND_URL}/#/login?error=oauth_failed`);
    }
  }
);

export default router;