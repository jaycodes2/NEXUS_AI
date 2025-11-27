import mongoose from "mongoose";

const apiLogSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  input_size: { type: Number, required: true },
  userId: { type: String },
  timestamp: { type: Date, default: Date.now }
});

export const ApiLog = mongoose.model("ApiLog", apiLogSchema);