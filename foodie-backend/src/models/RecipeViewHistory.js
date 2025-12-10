import mongoose from "mongoose";

const recipeViewHistorySchema = new mongoose.Schema(
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
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index để query nhanh
recipeViewHistorySchema.index({ user: 1, viewedAt: -1 });
recipeViewHistorySchema.index({ user: 1, recipe: 1 }, { unique: true }); // Mỗi user chỉ track 1 lần, update viewedAt khi xem lại

export default mongoose.model("RecipeViewHistory", recipeViewHistorySchema);

