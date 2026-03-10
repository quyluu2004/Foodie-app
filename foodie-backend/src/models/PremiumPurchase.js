import mongoose from "mongoose";

const premiumPurchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },
  },
  { timestamps: true }
);

// Index để đảm bảo mỗi user chỉ mua 1 recipe 1 lần
premiumPurchaseSchema.index({ user: 1, recipe: 1 }, { unique: true });
premiumPurchaseSchema.index({ user: 1, createdAt: -1 });
premiumPurchaseSchema.index({ recipe: 1 });

export default mongoose.model("PremiumPurchase", premiumPurchaseSchema);

