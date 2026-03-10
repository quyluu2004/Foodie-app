import { Router } from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import { cacheResponse, invalidateCache } from "../middleware/cache.js";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

// Cấu hình upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split(".").pop();
    cb(null, `category-${uniqueSuffix}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Chỉ cho phép tải lên file hình ảnh"), false);
  },
});

const router = Router();

// Public routes (cached)
router.get("/", cacheResponse(10 * 60 * 1000), getAllCategories); // Cache 10 phút
router.get("/:id", cacheResponse(5 * 60 * 1000), getCategoryById); // Cache 5 phút

// Protected routes (cần auth)
router.post("/", auth, upload.single("image"), createCategory);
router.put("/:id", auth, upload.single("image"), updateCategory);
router.delete("/:id", auth, deleteCategory);

export default router;

