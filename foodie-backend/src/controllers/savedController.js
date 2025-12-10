import Saved from "../models/Saved.js";
import Recipe from "../models/Recipe.js";

// Check xem recipe đã được save chưa
export const checkSavedStatus = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user._id;

    const saved = await Saved.findOne({ user: userId, recipe: recipeId });
    
    res.status(200).json({
      isSaved: !!saved,
      savedId: saved?._id || null,
    });
  } catch (error) {
    console.error("❌ Lỗi kiểm tra trạng thái lưu:", error);
    res.status(500).json({ message: "Lỗi kiểm tra trạng thái lưu", error: error.message });
  }
};

// Save một recipe (toggle - nếu đã save thì unsave)
export const saveRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      console.error('❌ No user ID in request');
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    console.log('💾 [saveRecipe] ========================================');
    console.log('💾 [saveRecipe] Saving recipe:', { recipeId, userId: userId.toString() });

    // Kiểm tra recipe tồn tại
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      console.log('❌ Recipe not found:', recipeId);
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    console.log('✅ Recipe found:', recipe.title);

    // Kiểm tra đã save chưa
    const existingSaved = await Saved.findOne({ user: userId, recipe: recipeId });
    if (existingSaved) {
      // Đã save rồi -> unsave
      console.log('🔄 Unsave recipe (already saved)');
      await Saved.deleteOne({ _id: existingSaved._id });
      return res.status(200).json({ 
        message: "Đã bỏ lưu công thức",
        isSaved: false,
      });
    }

    // Chưa save -> save
    console.log('💾 Creating new saved record');
    try {
      // Đảm bảo recipeId và userId là ObjectId hợp lệ
      const saved = await Saved.create({ 
        user: userId, 
        recipe: recipeId 
      });
      console.log('✅ Recipe saved successfully:', {
        savedId: saved._id,
        userId: userId.toString(),
        recipeId: recipeId.toString()
      });

      res.status(201).json({
        message: "Đã lưu công thức",
        saved: saved,
        isSaved: true,
      });
    } catch (createError) {
      console.error('❌ Error creating saved record:', createError);
      
      // Nếu lỗi duplicate (đã tồn tại), kiểm tra lại
      if (createError.code === 11000 || createError.name === 'MongoServerError' || createError.message?.includes('duplicate')) {
        console.log('⚠️ Duplicate key error, checking existing saved...');
        const existingSaved = await Saved.findOne({ user: userId, recipe: recipeId });
        if (existingSaved) {
          console.log('✅ Found existing saved record:', existingSaved._id);
          return res.status(200).json({
            message: "Công thức đã được lưu trước đó",
            saved: existingSaved,
            isSaved: true,
          });
        }
      }
      
      // Nếu là lỗi validation, trả về lỗi rõ ràng hơn
      if (createError.name === 'ValidationError') {
        console.error('❌ Validation error:', createError.errors);
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ", 
          error: createError.message 
        });
      }
      
      throw createError;
    }
  } catch (error) {
    console.error("❌ Lỗi lưu công thức:", error);
    res.status(500).json({ message: "Lỗi lưu công thức", error: error.message });
  }
};

// Unsave một recipe
export const unsaveRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user._id;

    // Xóa saved
    const saved = await Saved.findOneAndDelete({ user: userId, recipe: recipeId });
    if (!saved) {
      return res.status(404).json({ message: "Bạn chưa lưu công thức này" });
    }

    res.status(200).json({ message: "Đã bỏ lưu công thức" });
  } catch (error) {
    console.error("❌ Lỗi bỏ lưu công thức:", error);
    res.status(500).json({ message: "Lỗi bỏ lưu công thức", error: error.message });
  }
};

// Lấy danh sách recipes đã save của user
export const getSavedRecipesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('📥 Getting saved recipes for user:', userId);
    
    // Lấy danh sách saved với populate đầy đủ
    const savedList = await Saved.find({ user: userId })
      .populate({
        path: "recipe",
        select: "title description imageUrl videoThumbnail image cookTimeMinutes difficulty servings category categoryName author createdBy status totalRating ratingCount averageRating createdAt updatedAt",
        populate: [
          { 
            path: "author", 
            select: "name email avatarUrl" 
          },
          {
            path: "category",
            select: "name"
          }
        ]
      })
      .sort({ createdAt: -1 });

    console.log('📦 Found saved items:', savedList.length);
    
    // Tự động cleanup saved records có recipe null (đã bị xóa)
    const nullSavedIds = [];
    savedList.forEach((item) => {
      if (!item.recipe) {
        nullSavedIds.push(item._id);
        console.warn('⚠️ Found saved item with null recipe, will cleanup:', item._id);
      }
    });
    
    // Xóa các saved records có recipe null
    if (nullSavedIds.length > 0) {
      await Saved.deleteMany({ _id: { $in: nullSavedIds } });
      console.log(`🗑️  Đã xóa ${nullSavedIds.length} saved records có recipe null`);
    }

    // Lọc bỏ recipes null hoặc đã bị xóa
    // Hiển thị TẤT CẢ recipes đã lưu (kể cả pending/rejected) vì user đã lưu chúng
    const recipes = savedList
      .map((item) => item.recipe)
      .filter((recipe) => {
        // Chỉ lọc bỏ null/undefined (recipes đã bị xóa)
        return recipe != null;
      });

    console.log('✅ Valid recipes after filter:', recipes.length);
    if (recipes.length > 0) {
      console.log('✅ Recipe titles:', recipes.map(r => r.title || 'No title'));
    }

    // Đảm bảo categoryName được set nếu có category
    recipes.forEach((recipe) => {
      if (recipe.category && !recipe.categoryName) {
        if (typeof recipe.category === 'object' && recipe.category.name) {
          recipe.categoryName = recipe.category.name;
        }
      }
    });

    const response = {
      message: "Lấy danh sách công thức đã lưu thành công",
      recipes: recipes,
      count: recipes.length,
    };

    console.log('📤 Sending response with', recipes.length, 'recipes');
    
    res.status(200).json(response);
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách công thức đã lưu:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách công thức đã lưu", error: error.message });
  }
};

