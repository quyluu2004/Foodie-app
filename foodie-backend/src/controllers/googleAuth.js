import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendRegistrationEmail } from "../utils/emailService.js";

// Initialize Google OAuth2Client with Web Client ID
const client = new OAuth2Client('788618099954-2hovbh2gdu0tv91mouudhqsaelueud62.apps.googleusercontent.com');

export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Thiếu idToken từ Google" });
    }

    // Verify the idToken
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: '788618099954-2hovbh2gdu0tv91mouudhqsaelueud62.apps.googleusercontent.com',
      });
    } catch (verifyError) {
      console.error("❌ Lỗi verify Google token:", verifyError);
      return res.status(401).json({ message: "Token Google không hợp lệ hoặc đã hết hạn" });
    }

    // Get user info from the verified token
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ message: "Không thể lấy thông tin từ Google token" });
    }

    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ message: "Email không có trong Google token" });
    }

    // Normalize email
    const emailTrimmed = email.trim().toLowerCase();

    // Database Logic: Find or Create
    let user = await User.findOne({ email: emailTrimmed });

    if (user) {
      // Case A: User exists - update googleId if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Case B: New User - create new User document
      user = await User.create({
        email: emailTrimmed,
        name: name || "Foodie User",
        avatarUrl: picture || "https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_face,r_max/w_200/lady.jpg",
        googleId: googleId,
        role: "user",
      });

      // Send welcome email for new user
      try {
        await sendRegistrationEmail(user.email, user.name);
      } catch (emailError) {
        console.error('⚠️ Lỗi gửi email chào mừng:', emailError);
      }
    }

    // Create JWT token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: "Cấu hình server không đúng. Vui lòng liên hệ quản trị viên." });
    }

    const sessionToken = jwt.sign(
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
      token: sessionToken
    });
  } catch (error) {
    console.error("❌ Lỗi Google auth:", error);
    res.status(500).json({ message: "Lỗi đăng nhập bằng Google", error: error.message });
  }
};

