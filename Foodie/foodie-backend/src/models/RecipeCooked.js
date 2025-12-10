import mongoose from "mongoose";

const recipeCookedSchema = new mongoose.Schema(
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
    success: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    notes: String,
  },
  { timestamps: true }
);

recipeCookedSchema.index({ user: 1, createdAt: -1 });
recipeCookedSchema.index({ user: 1, recipe: 1 });

export default mongoose.model("RecipeCooked", recipeCookedSchema);

