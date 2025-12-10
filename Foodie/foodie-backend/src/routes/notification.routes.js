import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAllNotifications,
} from "../controllers/notificationController.js";

const router = Router();

// 🟢 Lấy thông báo của user - cần đăng nhập
router.get("/", auth, getUserNotifications);

// 🟢 Lấy tất cả thông báo (Admin only) - để xem ai làm gì
router.get("/all", auth, getAllNotifications);

// 🟠 Đánh dấu thông báo đã đọc - cần đăng nhập
router.put("/:id/read", auth, markAsRead);

// 🟠 Đánh dấu tất cả thông báo đã đọc - cần đăng nhập
router.put("/read-all", auth, markAllAsRead);

// 🟠 Xóa thông báo - cần đăng nhập
router.delete("/:id", auth, deleteNotification);

export default router;

