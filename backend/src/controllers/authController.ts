import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET!;

// 10 rounds is too slow on low-CPU deployment servers (Render free tier etc.)
// 8 rounds is still secure (2^8 = 256 iterations) and ~4x faster
const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "8");

/**
 * REGISTER USER
 */
export async function register(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    if (!/\S+@\S+\.\S+/.test(email))
      return res.status(400).json({ message: "Please enter a valid email address." });

    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return res.status(409).json({ message: "An account with this email already exists." });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email: email.toLowerCase().trim(), passwordHash });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({ token });

  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

/**
 * LOGIN USER
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res.status(401).json({ message: "No account found with this email." });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
      return res.status(401).json({ message: "Incorrect password. Please try again." });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({ token });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}