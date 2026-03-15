import mongoose, { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  displayName: string | null;
  avatar: string | null;
  authProvider: "local" | "google";
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  // Optional — Google OAuth users have no password
  passwordHash: { type: String, required: false, default: null },

  // Google OAuth fields
  googleId: { type: String, default: null, sparse: true },
  displayName: { type: String, default: null },
  avatar: { type: String, default: null },

  // Track how the account was created
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },
}, { timestamps: true });

export default mongoose.model<IUser>("User", userSchema);