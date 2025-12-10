import { Router } from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  toggleReaction,
  getUnreadCount,
  getOrCreateAdminConversation,
  getAdminConversations,
} from "../controllers/chatController.js";

const router = Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split(".").pop();
    cb(null, `chat-${uniqueSuffix}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Chỉ cho phép tải lên file hình ảnh"), false);
  },
});

// Tất cả routes đều cần auth
router.use(auth);

// Lấy danh sách conversations
router.get("/conversations", getConversations);

// Lấy hoặc tạo conversation với admin (cho user)
router.get("/admin/conversation", getOrCreateAdminConversation);

// Lấy danh sách conversations với users (cho admin)
router.get("/admin/conversations", getAdminConversations);

// Lấy tổng số tin nhắn chưa đọc
router.get("/unreadCount", getUnreadCount);

// Tạo hoặc lấy conversation với một user
router.get("/conversation/:userId", getOrCreateConversation);

// Lấy tin nhắn trong conversation với một user
router.get("/messages/:userId", getMessages);

// Gửi tin nhắn cho một user (có thể có hình ảnh)
router.post("/messages/:userId", upload.single('image'), sendMessage);

// Đánh dấu tin nhắn đã đọc
router.put("/messages/:userId/read", markAsRead);

// Thêm/xóa reaction
router.post("/messages/:messageId/reaction", toggleReaction);

export default router;

