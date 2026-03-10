import Recipe from "../models/Recipe.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import PremiumPurchase from "../models/PremiumPurchase.js";
import { isCreator } from "../utils/roleHelpers.js";

// Creator: Set recipe là premium
export const setRecipePremium = async (req, res) => {
  try {
    const userId = req.user._id;
    const { recipeId } = req.params;
    const { isPremium, price } = req.body;

    // Kiểm tra user có phải creator không
    if (!isCreator(req.user) && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Chỉ Creator mới có quyền set recipe premium",
      });
    }

    // Tìm recipe
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    // Kiểm tra quyền sở hữu
    if (recipe.author.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền chỉnh sửa công thức này",
      });
    }

    // Validation
    if (isPremium && (!price || price < 0)) {
      return res.status(400).json({
        message: "Giá phải lớn hơn 0 nếu đặt là premium",
      });
    }

    // Cập nhật recipe
    recipe.isPremium = isPremium || false;
    recipe.price = isPremium ? price : 0;

    await recipe.save();

    res.json({
      message: isPremium
        ? "Đã đặt công thức là Premium thành công"
        : "Đã bỏ Premium cho công thức",
      recipe,
    });
  } catch (error) {
    console.error("❌ Lỗi set recipe premium:", error);
    res.status(500).json({
      message: "Lỗi cập nhật công thức premium",
      error: error.message,
    });
  }
};

// User: Mua premium recipe
export const purchasePremiumRecipe = async (req, res) => {
  try {
    const userId = req.user._id;
    const { recipeId } = req.params;

    // Tìm recipe
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    // Kiểm tra recipe có phải premium không
    if (!recipe.isPremium) {
      return res.status(400).json({
        message: "Công thức này không phải là Premium",
      });
    }

    // Kiểm tra đã mua chưa
    const existingPurchase = await PremiumPurchase.findOne({
      user: userId,
      recipe: recipeId,
    });

    if (existingPurchase) {
      return res.status(400).json({
        message: "Bạn đã mua công thức này rồi",
      });
    }

    // Kiểm tra số xu của user (reload để đảm bảo có số xu mới nhất)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (user.coins < recipe.price) {
      return res.status(400).json({
        message: `Bạn không đủ xu. Cần ${recipe.price} xu, hiện có ${user.coins} xu`,
      });
    }

    // Thực hiện giao dịch (không dùng transaction để tương thích với standalone MongoDB)
    try {
      // Trừ xu của user
      user.coins -= recipe.price;
      user.totalSpent = (user.totalSpent || 0) + recipe.price;
      await user.save();

      // Cộng xu cho creator
      const creator = await User.findById(recipe.author);
      if (creator) {
        creator.coins = (creator.coins || 0) + recipe.price;
        creator.totalEarned = (creator.totalEarned || 0) + recipe.price;
        await creator.save();
      }

      // Tạo transaction record cho buyer
      const buyerTransaction = await Transaction.create({
        user: userId,
        type: "purchase",
        amount: -recipe.price,
        recipe: recipeId,
        status: "completed",
        metadata: {
          recipeTitle: recipe.title,
          recipeAuthor: recipe.author,
        },
      });

      // Tạo transaction record cho creator
      const creatorTransaction = await Transaction.create({
        user: recipe.author,
        type: "earn",
        amount: recipe.price,
        recipe: recipeId,
        status: "completed",
        metadata: {
          recipeTitle: recipe.title,
          buyer: userId,
        },
      });

      // Tạo purchase record
      const purchase = await PremiumPurchase.create({
        user: userId,
        recipe: recipeId,
        price: recipe.price,
        transaction: buyerTransaction._id,
      });

      // Cập nhật stats của recipe
      recipe.totalPurchases = (recipe.totalPurchases || 0) + 1;
      recipe.totalRevenue = (recipe.totalRevenue || 0) + recipe.price;
      await recipe.save();

      // Reload user để lấy số xu mới nhất
      const updatedUser = await User.findById(userId);

      res.json({
        message: "Mua công thức Premium thành công!",
        purchase: purchase,
        remainingCoins: updatedUser.coins,
      });
    } catch (error) {
      console.error("❌ Lỗi trong quá trình mua:", error);
      // Nếu có lỗi, cố gắng rollback bằng cách cộng lại xu cho user
      try {
        const userToRefund = await User.findById(userId);
        if (userToRefund) {
          userToRefund.coins = (userToRefund.coins || 0) + recipe.price;
          userToRefund.totalSpent = Math.max(0, (userToRefund.totalSpent || 0) - recipe.price);
          await userToRefund.save();
        }
      } catch (rollbackError) {
        console.error("❌ Lỗi khi rollback:", rollbackError);
      }
      throw error;
    }
  } catch (error) {
    console.error("❌ Lỗi mua premium recipe:", error);
    res.status(500).json({
      message: "Lỗi mua công thức Premium",
      error: error.message,
    });
  }
};

// Kiểm tra user đã mua recipe chưa
export const checkPurchaseStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { recipeId } = req.params;

    const purchase = await PremiumPurchase.findOne({
      user: userId,
      recipe: recipeId,
    });

    res.json({
      hasPurchased: !!purchase,
      purchase: purchase || null,
    });
  } catch (error) {
    console.error("❌ Lỗi kiểm tra purchase status:", error);
    res.status(500).json({
      message: "Lỗi kiểm tra trạng thái mua",
      error: error.message,
    });
  }
};

// Lấy danh sách premium recipes đã mua
export const getMyPurchases = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const purchases = await PremiumPurchase.find({ user: userId })
      .populate("recipe", "title imageUrl videoThumbnail categoryName author isPremium price")
      .populate("recipe.author", "name avatarUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PremiumPurchase.countDocuments({ user: userId });

    res.json({
      purchases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách purchases:", error);
    res.status(500).json({
      message: "Lỗi lấy danh sách công thức đã mua",
      error: error.message,
    });
  }
};

// Nạp xu cho user
export const topUpCoins = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Số lượng xu phải lớn hơn 0",
      });
    }

    // Kiểm tra amount hợp lệ (tối thiểu 10, tối đa 100000)
    if (amount < 10) {
      return res.status(400).json({
        message: "Số lượng xu tối thiểu là 10",
      });
    }

    if (amount > 100000) {
      return res.status(400).json({
        message: "Số lượng xu tối đa là 100,000",
      });
    }

    // Tìm user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    // Cập nhật coins
    const oldCoins = user.coins || 0;
    const newCoins = oldCoins + amount;
    user.coins = newCoins;
    await user.save();

    // Tạo transaction record
    const transaction = await Transaction.create({
      user: userId,
      type: "topup",
      amount: amount,
      status: "completed",
      metadata: {
        oldBalance: oldCoins,
        newBalance: newCoins,
      },
    });

    console.log(`✅ User ${userId} nạp ${amount} xu. Số dư: ${oldCoins} → ${newCoins}`);

    res.status(200).json({
      message: "Nạp xu thành công",
      coins: newCoins,
      transaction: transaction,
    });
  } catch (error) {
    console.error("❌ Lỗi nạp xu:", error);
    res.status(500).json({
      message: "Lỗi nạp xu",
      error: error.message,
    });
  }
};

