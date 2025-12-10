import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  likeRecipe,
  unlikeRecipe,
  getLikesByRecipe,
} from "../controllers/likeController.js";

const router = Router();

// Like/Unlike recipe (cần auth)
router.post("/:recipeId", auth, likeRecipe);
router.delete("/:recipeId", auth, unlikeRecipe);

// Lấy danh sách likes (có thể public)
router.get("/:recipeId", getLikesByRecipe);

export default router;

