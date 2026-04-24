import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema({
  ip: String,
  userAgent: String,
  referrer: String,
  page: String,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Visitor || mongoose.model("Visitor", visitorSchema);
