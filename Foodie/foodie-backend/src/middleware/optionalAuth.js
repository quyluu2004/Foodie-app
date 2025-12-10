import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Optional auth middleware - không bắt buộc phải có token
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return next(); // Không có token, tiếp tục nhưng không có req.user
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(); // Token không hợp lệ, tiếp tục
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-passwordHash");
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Token không hợp lệ, nhưng không throw error, chỉ bỏ qua
      console.log("⚠️ Optional auth: Token không hợp lệ, tiếp tục không có user");
    }

    next();
  } catch (error) {
    // Lỗi khác, tiếp tục không có user
    next();
  }
};

