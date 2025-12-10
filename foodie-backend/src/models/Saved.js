import mongoose from "mongoose";

const savedSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true }
  },
  { timestamps: true }
);

// Đảm bảo mỗi user chỉ save 1 recipe 1 lần
savedSchema.index({ user: 1, recipe: 1 }, { unique: true });

export default mongoose.model("Saved", savedSchema);

