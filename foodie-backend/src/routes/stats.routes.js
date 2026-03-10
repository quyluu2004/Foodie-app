import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  getSavedRecipesStats,
  getCookedStats,
  getActivityStats,
  getLikesReceived,
  getCommentsReceived,
  getDashboardStats,
  getAnalyticsStats,
  getCreatorStats,
} from "../controllers/statsController.js";

const router = Router();

router.get("/saved-recipes", auth, getSavedRecipesStats);
router.get("/cooked", auth, getCookedStats);
router.get("/activity", auth, getActivityStats);
router.get("/likes-received", auth, getLikesReceived);
router.get("/comments-received", auth, getCommentsReceived);
router.get("/dashboard", auth, getDashboardStats);
router.get("/analytics", auth, getAnalyticsStats);
router.get("/creator", auth, getCreatorStats);

export default router;

