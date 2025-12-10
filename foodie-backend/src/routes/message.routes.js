import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  sendMessage,
  getAllMessages,
  getUserMessages,
  getMessagesByEmail,
  replyMessage,
  markAsRead,
  markAsResolved,
  deleteMessage,
} from "../controllers/messageController.js";

const router = Router();

// User gửi tin nhắn cho admin (có thể có hoặc không có auth)
// Nếu có auth, dùng userId. Nếu không, dùng email và name
router.post("/", sendMessage); // Bỏ auth middleware để cho phép gửi khi chưa đăng nhập

// User xem tin nhắn của mình (cần đăng nhập)
router.get("/my-messages", auth, getUserMessages);

// User xem tin nhắn theo email (không cần đăng nhập)
router.get("/by-email", getMessagesByEmail);

// Admin lấy tất cả tin nhắn
router.get("/", auth, getAllMessages);

// Admin trả lời tin nhắn
router.post("/:messageId/reply", auth, replyMessage);

// Admin đánh dấu đã đọc
router.put("/:messageId/read", auth, markAsRead);

// Admin đánh dấu đã giải quyết
router.put("/:messageId/resolve", auth, markAsResolved);

// Admin xóa tin nhắn
router.delete("/:messageId", auth, deleteMessage);

export default router;

