import { Router } from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import { validateAIChat } from "../middleware/validate.js";
import { chat } from "../controllers/aiController.js";

const router = Router();

// Configure multer for memory storage (to pass image to Gemini)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file hình ảnh'), false);
    }
  }
});

// POST /ai/chat - Chat với AI (cần đăng nhập)
// Có thể nhận cả text và image
// Đặt upload trước validate để req.file có sẵn khi validate
router.post("/chat", auth, upload.single('image'), validateAIChat, chat);

export default router;

