import mongoose from "mongoose";

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

export default mongoose.model("User", userSchema);