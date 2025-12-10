import Recipe from "../models/Recipe.js";
import RecipeCooked from "../models/RecipeCooked.js";
import Notification from "../models/Notification.js";
import { isAdmin } from "../utils/roleHelpers.js";

// Đánh giá công thức (tạo hoặc cập nhật rating)
export const rateRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { rating, notes } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating phải từ 1 đến 5" });
    }

    // Kiểm tra recipe tồn tại
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    // Kiểm tra đã đánh giá chưa
    let recipeCooked = await RecipeCooked.findOne({
      user: userId,
      recipe: recipeId,
    });

    if (recipeCooked) {
      // Đã đánh giá rồi -> cập nhật
      const oldRating = recipeCooked.rating || 0;
      recipeCooked.rating = rating;
      if (notes !== undefined) {
        recipeCooked.notes = notes;
      }
      await recipeCooked.save();

      // Cập nhật tổng rating trong Recipe
      recipe.totalRating = recipe.totalRating - oldRating + rating;
      await recipe.save();
    } else {
      // Chưa đánh giá -> tạo mới
      recipeCooked = await RecipeCooked.create({
        user: userId,
        recipe: recipeId,
        rating: rating,
        notes: notes || "",
        success: true,
      });

      // Cập nhật tổng rating và số lượng đánh giá trong Recipe
      recipe.totalRating = (recipe.totalRating || 0) + rating;
      recipe.ratingCount = (recipe.ratingCount || 0) + 1;
      await recipe.save();
    }

    // Populate để trả về đầy đủ thông tin
    await recipeCooked.populate("user", "name email avatarUrl");
    await recipeCooked.populate("recipe", "title");

    res.status(200).json({
      message: recipeCooked.rating === rating ? "Đã cập nhật đánh giá" : "Đã thêm đánh giá",
      rating: recipeCooked,
      recipe: {
        averageRating: recipe.averageRating,
        ratingCount: recipe.ratingCount,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi đánh giá công thức:", error);
    res.status(500).json({ message: "Lỗi đánh giá công thức", error: error.message });
  }
};

// Lấy đánh giá của user cho recipe
export const getMyRating = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user._id;

    const recipeCooked = await RecipeCooked.findOne({
      user: userId,
      recipe: recipeId,
    })
      .populate("user", "name email avatarUrl")
      .populate("recipe", "title");

    if (!recipeCooked) {
      return res.status(200).json({
        message: "Bạn chưa đánh giá công thức này",
        rating: null,
      });
    }

    res.status(200).json({
      message: "Lấy đánh giá thành công",
      rating: recipeCooked,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy đánh giá:", error);
    res.status(500).json({ message: "Lỗi lấy đánh giá", error: error.message });
  }
};

// Lấy tất cả đánh giá của recipe
export const getRecipeRatings = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const ratings = await RecipeCooked.find({ recipe: recipeId, rating: { $exists: true, $ne: null } })
      .populate("user", "name email avatarUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RecipeCooked.countDocuments({ recipe: recipeId, rating: { $exists: true, $ne: null } });

    const recipe = await Recipe.findById(recipeId);

    res.status(200).json({
      message: "Lấy danh sách đánh giá thành công",
      ratings: ratings,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      recipe: {
        averageRating: recipe?.averageRating || 0,
        ratingCount: recipe?.ratingCount || 0,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách đánh giá:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách đánh giá", error: error.message });
  }
};

// Lấy tất cả đánh giá (Admin only)
export const getAllRatings = async (req, res) => {
  try {
    const { page = 1, limit = 50, recipeId, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (recipeId) {
      query.recipe = recipeId;
    }
    if (userId) {
      query.user = userId;
    }
    // Chỉ lấy ratings có rating (không null)
    query.rating = { $exists: true, $ne: null };

    const ratings = await RecipeCooked.find(query)
      .populate("user", "name email avatarUrl")
      .populate("recipe", "title imageUrl categoryName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RecipeCooked.countDocuments(query);

    res.status(200).json({
      message: "Lấy danh sách đánh giá thành công",
      ratings: ratings,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách đánh giá:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách đánh giá", error: error.message });
  }
};

// Xóa đánh giá (user hoặc admin)
export const deleteRating = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { ratingId } = req.body; // ratingId từ body (cho admin)
    const userId = req.user._id;
    const userIsAdmin = isAdmin(req.user);

    let recipeCooked;
    
    // Nếu có ratingId trong body và là admin, xóa rating cụ thể
    if (ratingId && userIsAdmin) {
      recipeCooked = await RecipeCooked.findById(ratingId);
      if (!recipeCooked) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá" });
      }
    } else {
      // Tìm rating của user cho recipe này
      recipeCooked = await RecipeCooked.findOne({
        user: userId,
        recipe: recipeId,
      });
      if (!recipeCooked) {
        return res.status(404).json({ message: "Bạn chưa đánh giá công thức này" });
      }
    // Kiểm tra quyền: chỉ user sở hữu hoặc admin mới được xóa
    const userIsAdmin = isAdmin(req.user);
    const ratingOwnerId = recipeCooked.user?.toString() || recipeCooked.user;
    const currentUserId = userId?.toString() || userId;
    const isOwner = currentUserId && ratingOwnerId && currentUserId === ratingOwnerId;
    
    if (!isOwner && !userIsAdmin) {
      return res.status(403).json({ message: "Bạn không có quyền xóa đánh giá này" });
    }
    }

    if (!recipeCooked.rating) {
      return res.status(400).json({ message: "Đánh giá này không có rating" });
    }

    const ratingValue = recipeCooked.rating;
    const targetRecipeId = recipeCooked.recipe;

    // Xóa rating (giữ lại record nhưng xóa rating)
    recipeCooked.rating = null;
    recipeCooked.notes = null;
    await recipeCooked.save();

    // Nếu admin xóa rating của user khác, tạo thông báo
    if (userIsAdmin && !isOwner) {
      const { reason } = req.body; // Lý do xóa từ admin (tùy chọn)
      
      await Notification.create({
        user: recipeCooked.user,
        type: "comment_removed", // Sử dụng type này vì không có rating_removed
        title: "Admin đã xóa đánh giá của bạn",
        message: `Đánh giá của bạn cho công thức đã bị admin xóa${reason ? `: ${reason}` : ''}.`,
        reason: reason || "",
        relatedId: targetRecipeId,
        relatedType: "Recipe",
        isRead: false,
      });
      
      // Emit notification event via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${recipeCooked.user}`).emit('newNotification');
        console.log(`📤 Emitted newNotification event to user:${recipeCooked.user}`);
      }
      
      console.log(`✅ Đã tạo thông báo cho user ${recipeCooked.user} về rating bị xóa`);
    }

    // Cập nhật tổng rating và số lượng đánh giá trong Recipe
    const recipe = await Recipe.findById(targetRecipeId);
    if (recipe) {
      const allRatings = await RecipeCooked.find({ 
        recipe: targetRecipeId, 
        rating: { $exists: true, $ne: null } 
      });
      recipe.totalRating = allRatings.reduce((sum, r) => sum + (r.rating || 0), 0);
      recipe.ratingCount = allRatings.length;
      await recipe.save();
    }

    res.status(200).json({
      message: "Đã xóa đánh giá",
      rating: recipeCooked,
      recipe: {
        averageRating: recipe?.averageRating || 0,
        ratingCount: recipe?.ratingCount || 0,
      },
      notificationSent: userIsAdmin && !isOwner
    });
  } catch (error) {
    console.error("❌ Lỗi xóa đánh giá:", error);
    res.status(500).json({ message: "Lỗi xóa đánh giá", error: error.message });
  }
};

