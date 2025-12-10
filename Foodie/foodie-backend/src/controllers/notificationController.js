import Notification from "../models/Notification.js";

// Lấy tất cả thông báo của user
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { user: userId };
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.status(200).json({
      notifications,
      total,
      unreadCount,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("❌ Lỗi lấy thông báo:", error);
    res.status(500).json({ message: "Lỗi lấy thông báo", error: error.message });
  }
};

// Đánh dấu thông báo đã đọc
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Admin có thể mark as read bất kỳ notification nào, user chỉ có thể mark as read notification của mình
    const query = isAdmin ? { _id: id } : { _id: id, user: userId };
    
    const notification = await Notification.findOne(query);
    if (!notification) {
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: "Đã đánh dấu đã đọc", notification });
  } catch (error) {
    console.error("❌ Lỗi đánh dấu đã đọc:", error);
    res.status(500).json({ message: "Lỗi đánh dấu đã đọc", error: error.message });
  }
};

// Đánh dấu tất cả thông báo đã đọc
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ message: "Đã đánh dấu tất cả thông báo đã đọc" });
  } catch (error) {
    console.error("❌ Lỗi đánh dấu tất cả đã đọc:", error);
    res.status(500).json({ message: "Lỗi đánh dấu tất cả đã đọc", error: error.message });
  }
};

// Xóa thông báo
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({ _id: id, user: userId });
    if (!notification) {
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }

    res.status(200).json({ message: "Đã xóa thông báo" });
  } catch (error) {
    console.error("❌ Lỗi xóa thông báo:", error);
    res.status(500).json({ message: "Lỗi xóa thông báo", error: error.message });
  }
};

// Lấy tất cả thông báo (Admin only) - để xem ai làm gì
export const getAllNotifications = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập" });
    }

    const { page = 1, limit = 50, unreadOnly = false, userId } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    if (userId) {
      query.user = userId;
    }

    const notifications = await Notification.find(query)
      .populate('user', 'name email avatarUrl role')
      .populate('relatedId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

    res.status(200).json({
      notifications,
      total,
      unreadCount,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("❌ Lỗi lấy tất cả thông báo:", error);
    res.status(500).json({ message: "Lỗi lấy thông báo", error: error.message });
  }
};

