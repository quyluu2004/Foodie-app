import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["purchase", "donation", "earn", "refund", "topup"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    // Cho purchase: recipe được mua
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      default: null,
    },
    // Cho donation: creator nhận được
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Cho donation: có thể có message
    message: {
      type: String,
      default: "",
    },
    // Trạng thái giao dịch
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
    },
    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Index để query nhanh
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ recipient: 1, createdAt: -1 });
transactionSchema.index({ recipe: 1 });
transactionSchema.index({ type: 1 });

export default mongoose.model("Transaction", transactionSchema);

