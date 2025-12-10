import Like from "../models/Like.js";
import Recipe from "../models/Recipe.js";

// Like/Unlike một recipe (toggle)
export const likeRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user._id;

    // Kiểm tra recipe tồn tại
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    // Kiểm tra đã like chưa
    const existingLike = await Like.findOne({ user: userId, recipe: recipeId });
    const isLiked = !!existingLike;

    if (isLiked) {
      // Unlike: Xóa like
      await Like.findOneAndDelete({ user: userId, recipe: recipeId });
      
      // Cập nhật likes trong Recipe
      recipe.likes = recipe.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      await recipe.save();

      res.status(200).json({
        message: "Đã bỏ thích công thức",
        isLiked: false,
        likesCount: recipe.likes.length,
      });
    } else {
      // Like: Tạo like mới
      const like = await Like.create({ user: userId, recipe: recipeId });

      // Cập nhật likes trong Recipe
      if (!recipe.likes.includes(userId)) {
        recipe.likes.push(userId);
        await recipe.save();
      }

      res.status(200).json({
        message: "Đã like công thức",
        like: like,
        isLiked: true,
        likesCount: recipe.likes.length,
      });
    }
  } catch (error) {
    console.error("❌ Lỗi like/unlike công thức:", error);
    res.status(500).json({ message: "Lỗi like/unlike công thức", error: error.message });
  }
};

// Unlike một recipe
export const unlikeRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user._id;

    // Xóa like
    const like = await Like.findOneAndDelete({ user: userId, recipe: recipeId });
    if (!like) {
      return res.status(404).json({ message: "Bạn chưa like công thức này" });
    }

    // Cập nhật likes trong Recipe
    const recipe = await Recipe.findById(recipeId);
    if (recipe) {
      recipe.likes = recipe.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      await recipe.save();
    }

    res.status(200).json({ message: "Đã unlike công thức" });
  } catch (error) {
    console.error("❌ Lỗi unlike công thức:", error);
    res.status(500).json({ message: "Lỗi unlike công thức", error: error.message });
  }
};

// Lấy danh sách users đã like recipe
export const getLikesByRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const likes = await Like.find({ recipe: recipeId })
      .populate("user", "name email avatarUrl")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Lấy danh sách likes thành công",
      likes: likes,
      count: likes.length,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách likes:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách likes", error: error.message });
  }
};

