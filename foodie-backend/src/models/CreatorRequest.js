import mongoose from "mongoose";

const creatorRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Thông tin bổ sung từ user
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    bio: { type: String, default: "" },
    experience: { type: String, default: "" }, // Kinh nghiệm nấu ăn
    specialties: [{ type: String }], // Chuyên môn (ví dụ: ["Món Việt", "Bánh ngọt"])
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    motivation: { type: String, required: true }, // Lý do muốn trở thành creator
    // Thông tin xử lý từ admin
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    adminNotes: { type: String, default: "" }, // Ghi chú từ admin
    rejectionReason: { type: String, default: "" }, // Lý do từ chối (nếu bị reject)
  },
  { timestamps: true }
);

// Index để tìm nhanh các request pending
creatorRequestSchema.index({ status: 1, createdAt: -1 });
creatorRequestSchema.index({ user: 1 });

export default mongoose.model("CreatorRequest", creatorRequestSchema);

