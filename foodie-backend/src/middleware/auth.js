import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    // console.log("🪪 Authorization Header:", authHeader);

    if (!authHeader) {
      return res.status(401).json({ message: "Thiếu token" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Người dùng không tồn tại" });
    }

    // Log user info for debugging (remove in production)
    // console.log('🔐 Auth Middleware - User authenticated:', {
    //   userId: user._id,
    //   email: user.email,
    //   role: user.role
    // });

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ AUTH ERROR:", error.message);
    return res.status(401).json({ message: "Token không hợp lệ hoặc hết hạn" });
  }
};
