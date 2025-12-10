import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  rateRecipe,
  getMyRating,
  getRecipeRatings,
  deleteRating,
  getAllRatings,
} from "../controllers/ratingController.js";

const router = Router();

// Lấy tất cả đánh giá (Admin only) - Phải đặt trước route /:recipeId
router.get("/", auth, getAllRatings);

// Đánh giá công thức (cần auth)
router.post("/:recipeId", auth, rateRecipe);

// Lấy đánh giá của user cho recipe (cần auth)
router.get("/:recipeId/my", auth, getMyRating);

// Lấy tất cả đánh giá của recipe (có thể public)
router.get("/:recipeId", getRecipeRatings);

// Xóa đánh giá (cần auth) - Admin có thể xóa bất kỳ rating nào
router.delete("/:recipeId", auth, deleteRating);

export default router;

