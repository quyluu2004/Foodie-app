import Message from "../models/Message.js";
import User from "../models/User.js";

// Gửi tin nhắn cho admin (có thể có hoặc không có auth)
export const sendMessage = async (req, res) => {
  try {
    const { subject, message, type, email, name } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: "Tiêu đề và nội dung tin nhắn là bắt buộc" });
    }

    // Nếu có user đăng nhập, dùng userId
    // Nếu chưa đăng nhập, dùng email và name
    let messageData = {
      subject: subject.trim(),
      message: message.trim(),
      type: type || "general",
      status: "pending",
    };

    if (req.user && req.user._id) {
      // User đã đăng nhập
      messageData.user = req.user._id;
    } else {
      // User chưa đăng nhập - cần email
      if (!email) {
        return res.status(400).json({ message: "Email là bắt buộc khi chưa đăng nhập" });
      }
      const emailTrimmed = email.trim().toLowerCase();
      messageData.senderEmail = emailTrimmed;
      messageData.senderName = name?.trim() || "Người dùng chưa đăng nhập";
      
      // Tìm user theo email để link nếu có
      const user = await User.findOne({ email: emailTrimmed });
      if (user) {
        messageData.user = user._id;
      }
    }

    const newMessage = await Message.create(messageData);

    // Populate user info nếu có
    if (newMessage.user) {
      await newMessage.populate("user", "name email");
    }

    res.status(201).json({
      message: "Gửi tin nhắn thành công",
      data: newMessage,
    });
  } catch (error) {
    console.error("❌ Lỗi gửi tin nhắn:", error);
    res.status(500).json({ message: "Lỗi gửi tin nhắn", error: error.message });
  }
};

// Lấy tất cả tin nhắn (Admin only)
export const getAllMessages = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới có quyền xem tin nhắn" });
    }

    const { status, type } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (type) {
      filter.type = type;
    }

    const messages = await Message.find(filter)
      .populate("user", "name email avatarUrl")
      .populate("repliedBy", "name email")
      .sort({ createdAt: -1 });

    // Format messages để hiển thị thông tin người gửi
    const formattedMessages = messages.map((msg) => {
      const messageObj = msg.toObject();
      // Nếu không có user (chưa đăng nhập), dùng senderEmail và senderName
      if (!messageObj.user && messageObj.senderEmail) {
        messageObj.user = {
          name: messageObj.senderName || "Người dùng chưa đăng nhập",
          email: messageObj.senderEmail,
          avatarUrl: null,
        };
      }
      return messageObj;
    });

    // Đếm số tin nhắn chưa đọc
    const unreadCount = await Message.countDocuments({ status: "pending" });

    res.status(200).json({
      message: "Lấy danh sách tin nhắn thành công",
      data: formattedMessages,
      unreadCount,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách tin nhắn:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách tin nhắn", error: error.message });
  }
};

// Lấy tin nhắn theo email (cho user chưa đăng nhập)
export const getMessagesByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc" });
    }

    const emailTrimmed = email.trim().toLowerCase();

    // Tìm user theo email
    const user = await User.findOne({ email: emailTrimmed });
    const userId = user?._id;

    // Tìm tin nhắn theo senderEmail hoặc user email
    const messages = await Message.find({
      $or: [
        { senderEmail: emailTrimmed },
        ...(userId ? [{ user: userId }] : [])
      ]
    })
      .populate("user", "name email")
      .populate("repliedBy", "name email")
      .sort({ createdAt: -1 });

    // Format messages
    const formattedMessages = messages.map((msg) => {
      const messageObj = msg.toObject();
      if (!messageObj.user && messageObj.senderEmail) {
        messageObj.user = {
          name: messageObj.senderName || "Người dùng chưa đăng nhập",
          email: messageObj.senderEmail,
        };
      }
      return messageObj;
    });

    res.status(200).json({
      message: "Lấy danh sách tin nhắn thành công",
      data: formattedMessages,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy tin nhắn theo email:", error);
    res.status(500).json({ message: "Lỗi lấy tin nhắn", error: error.message });
  }
};

// Lấy tin nhắn của user hiện tại
export const getUserMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email?.toLowerCase();

    // Tìm tin nhắn theo userId hoặc senderEmail (cho trường hợp gửi khi chưa đăng nhập)
    const messages = await Message.find({
      $or: [
        { user: userId },
        { senderEmail: userEmail }
      ]
    })
      .populate("user", "name email")
      .populate("repliedBy", "name email")
      .sort({ createdAt: -1 });

    // Format messages để hiển thị thông tin người gửi
    const formattedMessages = messages.map((msg) => {
      const messageObj = msg.toObject();
      // Nếu không có user (chưa đăng nhập khi gửi), dùng senderEmail và senderName
      if (!messageObj.user && messageObj.senderEmail) {
        messageObj.user = {
          name: messageObj.senderName || "Người dùng chưa đăng nhập",
          email: messageObj.senderEmail,
        };
      }
      return messageObj;
    });

    res.status(200).json({
      message: "Lấy danh sách tin nhắn thành công",
      data: formattedMessages,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy tin nhắn của user:", error);
    res.status(500).json({ message: "Lỗi lấy tin nhắn", error: error.message });
  }
};

// Trả lời tin nhắn (Admin only)
export const replyMessage = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới có quyền trả lời tin nhắn" });
    }

    const { messageId } = req.params;
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: "Nội dung trả lời là bắt buộc" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    }

    message.adminReply = reply.trim();
    message.status = "replied";
    message.repliedAt = new Date();
    message.repliedBy = req.user._id;

    await message.save();

    // Populate để trả về đầy đủ thông tin
    await message.populate("user", "name email");
    await message.populate("repliedBy", "name email");

    res.status(200).json({
      message: "Trả lời tin nhắn thành công",
      data: message,
    });
  } catch (error) {
    console.error("❌ Lỗi trả lời tin nhắn:", error);
    res.status(500).json({ message: "Lỗi trả lời tin nhắn", error: error.message });
  }
};

// Đánh dấu tin nhắn đã đọc (Admin only)
export const markAsRead = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới có quyền đánh dấu đã đọc" });
    }

    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    }

    if (message.status === "pending") {
      message.status = "read";
      await message.save();
    }

    res.status(200).json({
      message: "Đánh dấu đã đọc thành công",
      data: message,
    });
  } catch (error) {
    console.error("❌ Lỗi đánh dấu đã đọc:", error);
    res.status(500).json({ message: "Lỗi đánh dấu đã đọc", error: error.message });
  }
};

// Đánh dấu tin nhắn đã giải quyết (Admin only)
export const markAsResolved = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới có quyền đánh dấu đã giải quyết" });
    }

    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    }

    message.status = "resolved";
    await message.save();

    res.status(200).json({
      message: "Đánh dấu đã giải quyết thành công",
      data: message,
    });
  } catch (error) {
    console.error("❌ Lỗi đánh dấu đã giải quyết:", error);
    res.status(500).json({ message: "Lỗi đánh dấu đã giải quyết", error: error.message });
  }
};

// Xóa tin nhắn (Admin only)
export const deleteMessage = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới có quyền xóa tin nhắn" });
    }

    const { messageId } = req.params;
    const { reason } = req.body; // Lý do xóa (tùy chọn)

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    }

    // Lưu thông tin tin nhắn trước khi xóa (để log nếu cần)
    const messageSubject = message.subject;
    const messageUser = message.user;

    await Message.findByIdAndDelete(messageId);

    console.log(`✅ Admin ${req.user.email} đã xóa tin nhắn: ${messageSubject}${reason ? ` - Lý do: ${reason}` : ''}`);

    res.status(200).json({
      message: "Xóa tin nhắn thành công",
      deletedMessage: {
        _id: messageId,
        subject: messageSubject
      }
    });
  } catch (error) {
    console.error("❌ Lỗi xóa tin nhắn:", error);
    res.status(500).json({ message: "Lỗi xóa tin nhắn", error: error.message });
  }
};

