import { Router } from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import {
  createPost,
  getPosts,
  getPostById,
  getPostsByUser,
  toggleLike,
  addComment,
  deletePost,
  updatePost,
  likeComment,
  deleteComment,
  replyComment,
  likeReply,
  toggleSavePost,
  getSavedPosts,
  getTotalComments,
} from "../controllers/postController.js";

// ⚙️ Cấu hình upload ảnh (tạm thời dùng local storage, có thể thay bằng Cloudinary)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split(".").pop();
    cb(null, `post-${uniqueSuffix}.${ext}`);
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

const router = Router();

// 🟢 Lấy danh sách tất cả bài đăng (Feed) - cần đăng nhập
router.get("/", auth, getPosts);

// 🟢 Lấy tổng số bình luận (Admin/Stats) - cần đăng nhập (phải đặt trước /:id)
router.get("/stats/comments", auth, getTotalComments);

// 🟢 Lấy bài đăng theo ID - cần đăng nhập
router.get("/:id", auth, getPostById);

// 🟢 Lấy bài đăng theo user - cần đăng nhập
router.get("/user/:userId", auth, getPostsByUser);

// 🟠 Tạo bài đăng mới - cần đăng nhập
router.post("/", auth, upload.single("image"), createPost);

// 🟠 Like/Unlike bài đăng - cần đăng nhập
router.post("/:id/like", auth, toggleLike);

// 🟠 Thêm bình luận - cần đăng nhập
router.post("/:id/comments", auth, addComment);

// 🟠 Cập nhật bài đăng - cần đăng nhập
router.put("/:id", auth, upload.single("image"), updatePost);

// 🟠 Xóa bài đăng - cần đăng nhập
router.delete("/:id", auth, deletePost);

// 🟠 Like/Unlike comment - cần đăng nhập
router.post("/:id/comments/:commentId/like", auth, likeComment);

// 🟠 Xóa comment từ Post - cần đăng nhập
router.delete("/:id/comments/:commentId", auth, deleteComment);

// 🟠 Reply to comment - cần đăng nhập
router.post("/:id/comments/:commentId/replies", auth, replyComment);

// 🟠 Like/Unlike reply - cần đăng nhập
router.post("/:id/comments/:commentId/replies/:replyId/like", auth, likeReply);

// 🟠 Lưu/Bỏ lưu bài đăng - cần đăng nhập
router.post("/:id/save", auth, toggleSavePost);

// 🟢 Lấy danh sách bài đăng đã lưu - cần đăng nhập
router.get("/saved/all", auth, getSavedPosts);

export default router;

