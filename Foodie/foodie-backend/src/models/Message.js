import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Không bắt buộc nếu chưa đăng nhập
    },
    // Thông tin người gửi khi chưa đăng nhập
    senderEmail: {
      type: String,
      required: false,
      trim: true,
    },
    senderName: {
      type: String,
      required: false,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["support", "password_reset", "general", "report"],
      default: "general",
    },
    status: {
      type: String,
      enum: ["pending", "read", "replied", "resolved"],
      default: "pending",
    },
    adminReply: {
      type: String,
      default: "",
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);

