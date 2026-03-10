import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Foodie User" },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: false }, // Không bắt buộc nếu đăng nhập bằng Google
    googleId: { type: String, unique: true, sparse: true }, // Cho phép null, unique nếu có giá trị
    role: { type: String, enum: ["user", "creator", "admin"], default: "user" },
    avatarUrl: { type: String, default: "https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_face,r_max/w_200/lady.jpg" },
    phone: { type: String, default: "" },
    bio: { type: String, default: "" },
    gender: {
      type: String,
      enum: {
        values: ["Nam", "Nữ", "Khác", ""],
        message: 'Gender phải là "Nam", "Nữ", "Khác" hoặc để trống'
      },
      default: ""
    },
    birthDate: { type: Date, default: null },
    socialLinks: {
      email: { type: String, default: "" },
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
      youtube: { type: String, default: "" },
      website: { type: String, default: "" },
      // Cho phép thêm các link tùy chỉnh khác
      custom: [{ label: String, url: String }]
    },
    isPrivate: { type: Boolean, default: false }, // Chế độ riêng tư: true = chỉ người theo dõi mới xem được
    coins: { type: Number, default: 100 }, // Số xu/coin của user (mặc định 100 xu khi đăng ký)
    totalEarned: { type: Number, default: 0 }, // Tổng số xu đã kiếm được (cho creator)
    totalSpent: { type: Number, default: 0 }, // Tổng số xu đã chi tiêu
  },
  { timestamps: true }
);

// Index giúp tối ưu query lọc theo role (cho Admin dashboard)
userSchema.index({ role: 1 });
userSchema.index({ email: 1 }); // Đảm bảo query login nhanh nhất

export default mongoose.model("User", userSchema);

