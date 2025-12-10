import { Router } from "express";
import { auth } from "../middleware/auth.js";
import multer from "multer";
import { recipeStorage } from "../config/cloudinary.js";
import {
  createComment,
  getAllComments,
  getCommentsByRecipe,
  deleteComment,
  likeComment,
  replyComment,
} from "../controllers/commentController.js";

const upload = multer({ storage: recipeStorage });
const router = Router();

// Lấy tất cả comments (Admin only) - Phải đặt trước route /:recipeId
router.get("/", auth, getAllComments);

// Tạo comment (cần auth) - hỗ trợ upload ảnh
router.post("/:recipeId", auth, upload.single("image"), createComment);

// Lấy danh sách comments của recipe (có thể public)
router.get("/:recipeId", getCommentsByRecipe);

// Xóa comment (cần auth)
router.delete("/:id", auth, deleteComment);

// Like comment (cần auth)
router.post("/:id/like", auth, likeComment);

// Reply to comment (cần auth)
router.post("/:id/reply", auth, replyComment);

export default router;

