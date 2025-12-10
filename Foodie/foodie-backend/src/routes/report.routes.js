import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  createReport,
  getAllReports,
  getMyReports,
  resolveReport,
  deleteReport,
} from "../controllers/reportController.js";

const router = Router();

// Tạo report (cần auth)
router.post("/", auth, createReport);

// Lấy danh sách reports của user
router.get("/my", auth, getMyReports);

// Lấy danh sách reports (Admin only)
router.get("/", auth, getAllReports);

// Xử lý report (Admin only)
router.put("/:id/resolve", auth, resolveReport);

// Xóa report (Admin only)
router.delete("/:id", auth, deleteReport);

export default router;

