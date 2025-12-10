import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["recipe", "post", "comment", "user"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["pending", "resolved", "rejected"], default: "pending" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date
  },
  { timestamps: true }
);

// Index để query nhanh
reportSchema.index({ status: 1 });
reportSchema.index({ type: 1, targetId: 1 });

export default mongoose.model("Report", reportSchema);

