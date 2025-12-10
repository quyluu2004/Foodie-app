import { Router } from "express";
import { auth } from "../middleware/auth.js";
import Favorite from "../models/Favorite.js";
import Recipe from "../models/Recipe.js";

const router = Router();

// 🟢 Lấy danh sách yêu thích của user
router.get("/", auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate("recipe")
      .sort({ createdAt: -1 });
    
    // Lấy danh sách recipe từ favorites
    const recipes = favorites.map(fav => fav.recipe).filter(Boolean);
    
    res.json({ favorites: recipes });
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách yêu thích:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// 🟢 Thêm / xóa yêu thích (toggle)
router.post("/toggle/:recipeId", auth, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user._id;

    // Kiểm tra recipe có tồn tại không
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    // Tìm favorite đã tồn tại
    const existingFavorite = await Favorite.findOne({
      user: userId,
      recipe: recipeId
    });

    if (existingFavorite) {
      // Xóa favorite
      await Favorite.findByIdAndDelete(existingFavorite._id);
      res.json({ 
        message: "Đã xóa khỏi yêu thích",
        isFavorite: false 
      });
    } else {
      // Thêm favorite
      await Favorite.create({
        user: userId,
        recipe: recipeId
      });
      res.json({ 
        message: "Đã thêm vào yêu thích",
        isFavorite: true 
      });
    }
  } catch (error) {
    console.error("❌ Lỗi khi toggle yêu thích:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

export default router;
