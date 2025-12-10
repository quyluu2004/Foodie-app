import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  saveRecipe,
  unsaveRecipe,
  getSavedRecipesByUser,
  checkSavedStatus,
} from "../controllers/savedController.js";

const router = Router();

// Check saved status (cần auth)
router.get("/check/:recipeId", auth, checkSavedStatus);

// Save/Unsave recipe (cần auth)
router.post("/:recipeId", auth, saveRecipe);
router.delete("/:recipeId", auth, unsaveRecipe);

// Lấy danh sách recipes đã save (có thể public)
router.get("/user/:userId", getSavedRecipesByUser);

export default router;

