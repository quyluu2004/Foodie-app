import { Router } from "express";
import multer from "multer";
import { avatarStorage } from "../config/cloudinary.js";
import {
  register,
  login,
  updateProfile,
  getUserById,
  uploadAvatar,
  getAllUsers,
  promoteUser,
  deleteUser,
  changePassword,
  requestPasswordReset,
  adminChangeUserPassword,
  getAdminUserDetail,
  getCurrentUser,
  refreshToken
} from "../controllers/authController.js";
import { googleAuth } from "../controllers/googleAuth.js";
import { auth } from "../middleware/auth.js";
import { adminAuth } from "../middleware/adminAuth.js";
// Rate limiting đã tắt
// import { uploadLimiter } from "../middleware/rateLimiter.js";
import {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateObjectId,
} from "../middleware/validate.js";

const upload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ cho phép tải lên file hình ảnh"), false);
    }
  }
});

const router = Router();

// 🔐 Authentication routes với validation
// Multer phải chạy trước validation để parse FormData vào req.body
router.post("/register", upload.single("avatar"), validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/google", googleAuth); // Google OAuth
router.post("/refresh-token", refreshToken); // 🔑 Refresh token

// 🔐 Profile management với validation
router.post("/upload-avatar", auth, upload.single("avatar"), uploadAvatar);
router.put("/profile", auth, validateUpdateProfile, updateProfile);
router.get("/me", auth, getCurrentUser); // Lấy thông tin user hiện tại

// 🔐 Password management với validation
router.put("/password", auth, validateChangePassword, changePassword); // User tự đổi mật khẩu (cần đăng nhập)
router.post("/reset-password", requestPasswordReset); // User yêu cầu reset mật khẩu (không cần đăng nhập)

// 🔐 User management - Admin only
router.get("/users", auth, adminAuth, getAllUsers); // Admin: Lấy tất cả users
router.get("/user/:userId", auth, validateObjectId("userId"), getUserById); // Public profile
router.get("/users/:userId/detail", auth, adminAuth, validateObjectId("userId"), getAdminUserDetail); // Admin: Lấy chi tiết user
router.put("/users/:userId/promote", auth, adminAuth, validateObjectId("userId"), promoteUser); // Admin: Promote user
router.put("/users/:userId/password", auth, adminAuth, validateObjectId("userId"), adminChangeUserPassword); // Admin: Đổi mật khẩu cho user
router.delete("/users/:userId", auth, adminAuth, validateObjectId("userId"), deleteUser); // Admin: Xóa user

export default router;

