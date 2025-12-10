import mongoose from "mongoose";

// Reply schema (nested trong comment)
const replySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true },
    text: { type: String, required: true },
    imageUrl: { type: String, default: null }, // Ảnh kết quả khi làm theo công thức
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replies: [replySchema], // Thêm replies
  },
  { timestamps: true }
);

// Index để query nhanh
commentSchema.index({ recipe: 1 });
commentSchema.index({ user: 1 });

export default mongoose.model("Comment", commentSchema);

