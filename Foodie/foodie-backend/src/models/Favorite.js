import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true }
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, recipe: 1 }, { unique: true });

export default mongoose.model("Favorite", favoriteSchema);







