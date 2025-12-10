import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    recipes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipe",
      },
    ],
  },
  { timestamps: true }
);

collectionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Collection", collectionSchema);

