import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true }
  },
  { timestamps: true }
);

// Đảm bảo mỗi user chỉ like 1 recipe 1 lần
likeSchema.index({ user: 1, recipe: 1 }, { unique: true });

export default mongoose.model("Like", likeSchema);

