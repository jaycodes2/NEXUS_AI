import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import { authLogger } from "../utils/logger.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "8");

/**
 * REGISTER USER
 */
export async function register(req: Request, res: Response) {
  const start = Date.now();
  const ip = req.headers["x-forwarded-for"] || req.ip;

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      authLogger.warn({ ip, event: "register_failed", reason: "missing_fields" }, "Register failed — missing fields");
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      authLogger.warn({ ip, email, event: "register_failed", reason: "invalid_email" }, "Register failed — invalid email");
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (password.length < 6) {
      authLogger.warn({ ip, email, event: "register_failed", reason: "weak_password" }, "Register failed — password too short");
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      // If account exists via Google, tell them to use Google
      if (existing.authProvider === "google" && !existing.passwordHash) {
        authLogger.warn({ ip, email, event: "register_failed", reason: "google_account_exists" }, "Register failed — account exists via Google");
        return res.status(409).json({ message: "This email is linked to a Google account. Please sign in with Google." });
      }
      authLogger.warn({ ip, email, event: "register_failed", reason: "email_taken" }, "Register failed — email already exists");
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email: email.toLowerCase().trim(), passwordHash });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    authLogger.info(
      { ip, email, userId: user._id.toString(), event: "register_success", ms: Date.now() - start },
      "User registered successfully"
    );

    return res.status(201).json({ token });

  } catch (err) {
    authLogger.error({ ip, err, event: "register_error", ms: Date.now() - start }, "Register error");
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

/**
 * LOGIN USER
 */
export async function login(req: Request, res: Response) {
  const start = Date.now();
  const ip = req.headers["x-forwarded-for"] || req.ip;

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      authLogger.warn({ ip, event: "login_failed", reason: "missing_fields" }, "Login failed — missing fields");
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      authLogger.warn({ ip, email, event: "login_failed", reason: "user_not_found" }, "Login failed — user not found");
      return res.status(401).json({ message: "No account found with this email." });
    }

    // Block password login for OAuth-only accounts
    if (!user.passwordHash) {
      authLogger.warn({ ip, email, userId: user._id.toString(), event: "login_failed", reason: "oauth_only_account" }, "Login failed — account uses Google sign-in");
      return res.status(401).json({ message: "This account uses Google sign-in. Please click the Google button to continue." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      authLogger.warn({ ip, email, userId: user._id.toString(), event: "login_failed", reason: "wrong_password" }, "Login failed — incorrect password");
      return res.status(401).json({ message: "Incorrect password. Please try again." });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    authLogger.info(
      { ip, email, userId: user._id.toString(), event: "login_success", ms: Date.now() - start },
      "User logged in successfully"
    );

    return res.json({ token });

  } catch (err) {
    authLogger.error({ ip, err, event: "login_error", ms: Date.now() - start }, "Login error");
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}