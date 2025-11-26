import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * REGISTER USER
 */
export async function register(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash });

  
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

  return res.json({ token });
}

/**
 * LOGIN USER
 */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  // ✅ Return JWT for user identity
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

  return res.json({ token });
}
