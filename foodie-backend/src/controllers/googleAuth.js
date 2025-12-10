import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendRegistrationEmail } from "../utils/emailService.js";

export const googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, avatarUrl } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ message: "Thiếu thông tin Google" });
    }

    // Tìm user theo email hoặc googleId
    let user = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { googleId: googleId }
      ]
    });

    if (user) {
      // User đã tồn tại - cập nhật googleId nếu chưa có
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Tạo user mới
      user = await User.create({
        email: email.toLowerCase().trim(),
        name: name || "Foodie User",
        avatarUrl: avatarUrl || "https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_face,r_max/w_200/lady.jpg",
        googleId: googleId,
        role: "user",
      });

      // Gửi email chào mừng cho user mới
      try {
        await sendRegistrationEmail(user.email, user.name);
      } catch (emailError) {
        console.error('⚠️ Lỗi gửi email chào mừng:', emailError);
      }
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập bằng Google thành công",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        phone: user.phone || "",
        bio: user.bio || "",
        gender: user.gender || "",
        birthDate: user.birthDate || null,
        socialLinks: user.socialLinks || {},
        role: user.role || "user"
      },
      token
    });
  } catch (error) {
    console.error("❌ Lỗi Google auth:", error);
    res.status(500).json({ message: "Lỗi đăng nhập bằng Google", error: error.message });
  }
};

