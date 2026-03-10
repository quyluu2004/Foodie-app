import { Router } from "express";
import {
  createCreatorRequest,
  getMyCreatorRequest,
  getAllCreatorRequests,
  getCreatorRequestById,
  approveCreatorRequest,
  rejectCreatorRequest,
} from "../controllers/creatorRequestController.js";
import { auth } from "../middleware/auth.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { validateObjectId } from "../middleware/validate.js";

const router = Router();

// User routes
router.post("/", auth, createCreatorRequest); // User gửi yêu cầu
router.get("/my", auth, getMyCreatorRequest); // User xem request của mình

// Admin routes
router.get("/", auth, adminAuth, getAllCreatorRequests); // Admin: Lấy tất cả requests
router.get("/:requestId", auth, adminAuth, validateObjectId("requestId"), getCreatorRequestById); // Admin: Xem chi tiết
router.put("/:requestId/approve", auth, adminAuth, validateObjectId("requestId"), approveCreatorRequest); // Admin: Duyệt
router.put("/:requestId/reject", auth, adminAuth, validateObjectId("requestId"), rejectCreatorRequest); // Admin: Từ chối

export default router;

