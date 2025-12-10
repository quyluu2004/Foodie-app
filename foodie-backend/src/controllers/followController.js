import Follow from "../models/Follow.js";
import User from "../models/User.js";

// Theo dõi/Bỏ theo dõi người dùng
export const toggleFollow = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { userId } = req.params;

    if (followerId.toString() === userId) {
      return res.status(400).json({ message: "Bạn không thể theo dõi chính mình" });
    }

    // Kiểm tra user có tồn tại không
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra đã follow chưa
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: userId,
    });

    if (existingFollow) {
      // Unfollow
      await Follow.deleteOne({ _id: existingFollow._id });
      res.status(200).json({
        message: "Đã bỏ theo dõi",
        isFollowing: false,
      });
    } else {
      // Follow
      await Follow.create({
        follower: followerId,
        following: userId,
      });
      res.status(200).json({
        message: "Đã theo dõi",
        isFollowing: true,
      });
    }
  } catch (error) {
    console.error("❌ Lỗi follow/unfollow:", error);
    res.status(500).json({
      message: "Lỗi follow/unfollow",
      error: error.message,
    });
  }
};

// Kiểm tra trạng thái follow
export const checkFollowStatus = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { userId } = req.params;

    const isFollowing = await Follow.findOne({
      follower: followerId,
      following: userId,
    });

    res.status(200).json({
      isFollowing: !!isFollowing,
    });
  } catch (error) {
    console.error("❌ Lỗi kiểm tra follow status:", error);
    res.status(500).json({
      message: "Lỗi kiểm tra follow status",
      error: error.message,
    });
  }
};

// Lấy danh sách người đang theo dõi (following)
export const getFollowing = async (req, res) => {
  try {
    const userId = req.user._id;

    const following = await Follow.find({ follower: userId })
      .populate("following", "name email avatarUrl")
      .sort({ createdAt: -1 });

    res.status(200).json({
      following: following.map((f) => f.following),
      count: following.length,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách following:", error);
    res.status(500).json({
      message: "Lỗi lấy danh sách following",
      error: error.message,
    });
  }
};

// Lấy danh sách người theo dõi (followers)
export const getFollowers = async (req, res) => {
  try {
    const userId = req.user._id;

    const followers = await Follow.find({ following: userId })
      .populate("follower", "name email avatarUrl")
      .sort({ createdAt: -1 });

    res.status(200).json({
      followers: followers.map((f) => f.follower),
      count: followers.length,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách followers:", error);
    res.status(500).json({
      message: "Lỗi lấy danh sách followers",
      error: error.message,
    });
  }
};

