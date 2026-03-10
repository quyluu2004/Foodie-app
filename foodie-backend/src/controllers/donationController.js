import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

// User: Donate/Tip cho creator
export const donateToCreator = async (req, res) => {
  try {
    const userId = req.user._id;
    const { creatorId } = req.params;
    const { amount, message } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Số lượng xu phải lớn hơn 0",
      });
    }

    if (amount < 10) {
      return res.status(400).json({
        message: "Số lượng xu tối thiểu là 10",
      });
    }

    if (amount > 10000) {
      return res.status(400).json({
        message: "Số lượng xu tối đa là 10,000",
      });
    }

    // Kiểm tra creator
    const creator = await User.findById(creatorId);
    if (!creator) {
      return res.status(404).json({ message: "Không tìm thấy creator" });
    }

    if (creator.role !== "creator" && creator.role !== "admin") {
      return res.status(400).json({
        message: "Người này không phải là Creator",
      });
    }

    // Không thể donate cho chính mình
    if (creatorId === userId.toString()) {
      return res.status(400).json({
        message: "Bạn không thể donate cho chính mình",
      });
    }

    // Kiểm tra số xu của user
    const user = await User.findById(userId);
    if (user.coins < amount) {
      return res.status(400).json({
        message: `Bạn không đủ xu. Cần ${amount} xu, hiện có ${user.coins} xu`,
      });
    }

    // Thực hiện giao dịch
    const session = await User.db.startSession();
    session.startTransaction();

    try {
      // Trừ xu của user
      user.coins -= amount;
      user.totalSpent += amount;
      await user.save({ session });

      // Cộng xu cho creator
      creator.coins += amount;
      creator.totalEarned += amount;
      await creator.save({ session });

      // Tạo transaction records
      const transactions = await Transaction.create(
        [
          {
            user: userId,
            type: "donation",
            amount: -amount,
            recipient: creatorId,
            message: message || "",
            status: "completed",
            metadata: {
              recipientName: creator.name,
            },
          },
          {
            user: creatorId,
            type: "earn",
            amount: amount,
            recipient: userId,
            message: message || "",
            status: "completed",
            metadata: {
              donorName: user.name,
            },
          },
        ],
        { session }
      );

      await session.commitTransaction();

      res.json({
        message: `Đã donate ${amount} xu cho ${creator.name} thành công!`,
        transaction: transactions[0],
        remainingCoins: user.coins,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("❌ Lỗi donate:", error);
    res.status(500).json({
      message: "Lỗi thực hiện donation",
      error: error.message,
    });
  }
};

// Lấy lịch sử transactions của user
export const getMyTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, type } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { user: userId };
    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .populate("recipe", "title imageUrl")
      .populate("recipient", "name avatarUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Lỗi lấy transactions:", error);
    res.status(500).json({
      message: "Lỗi lấy lịch sử giao dịch",
      error: error.message,
    });
  }
};

// Lấy số xu hiện tại của user
export const getMyCoins = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("coins totalEarned totalSpent");

    res.json({
      coins: user.coins,
      totalEarned: user.totalEarned,
      totalSpent: user.totalSpent,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy coins:", error);
    res.status(500).json({
      message: "Lỗi lấy số xu",
      error: error.message,
    });
  }
};

