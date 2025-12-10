import { ChatMessage, Conversation } from "../models/Chat.js";
import User from "../models/User.js";
import { isAdmin } from "../utils/roleHelpers.js";

// Tạo hoặc lấy conversation giữa 2 users
export const getOrCreateConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.params;

    if (currentUserId.toString() === userId) {
      return res.status(400).json({ message: "Không thể chat với chính mình" });
    }

    // Tìm conversation giữa 2 users (sắp xếp để đảm bảo tìm đúng)
    const participantIds = [currentUserId.toString(), userId].sort();
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId], $size: 2 },
    }).populate("participants", "name avatarUrl");

    // Nếu chưa có, tạo mới
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, userId],
        unreadCount: new Map(),
      });
      await conversation.populate("participants", "name avatarUrl");
    }

    res.status(200).json({
      message: "Lấy conversation thành công",
      data: conversation,
    });
  } catch (error) {
    console.error("❌ Lỗi getOrCreateConversation:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy danh sách conversations của user
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate("participants", "name avatarUrl")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    // Format data để trả về và group theo userId để tránh duplicate
    const conversationsMap = new Map();
    
    await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.participants.find(
          (p) => p._id.toString() !== currentUserId.toString()
        );

        if (!otherUser) return; // Skip nếu không tìm thấy otherUser

        const otherUserId = otherUser._id.toString();
        
        // Nếu đã có conversation với user này, chỉ giữ conversation mới nhất
        if (conversationsMap.has(otherUserId)) {
          const existingConv = conversationsMap.get(otherUserId);
          // So sánh lastMessageAt để giữ conversation mới nhất
          if (conv.lastMessageAt && existingConv.lastMessageTime) {
            const convTime = new Date(conv.lastMessageAt).getTime();
            const existingTime = new Date(existingConv.lastMessageTime).getTime();
            if (convTime <= existingTime) {
              return; // Bỏ qua conversation cũ hơn
            }
          } else if (!conv.lastMessageAt) {
            return; // Bỏ qua conversation không có lastMessage nếu đã có conversation khác
          }
        }

        const unreadCount = conv.unreadCount.get(currentUserId.toString()) || 0;

        let lastMessageText = "";
        if (conv.lastMessage) {
          const lastMsg = await ChatMessage.findById(conv.lastMessage);
          lastMessageText = lastMsg ? lastMsg.text : "";
        }

        conversationsMap.set(otherUserId, {
          _id: conv._id,
          userId: otherUser._id,
          userName: otherUser.name || "Người dùng",
          userAvatar: otherUser.avatarUrl,
          lastMessage: lastMessageText,
          lastMessageTime: conv.lastMessageAt,
          unreadCount: unreadCount,
        });
      })
    );

    // Chuyển Map thành Array và sort lại theo lastMessageTime
    const formattedConversations = Array.from(conversationsMap.values()).sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA; // Sort descending
    });

    res.status(200).json({
      message: "Lấy danh sách conversations thành công",
      data: formattedConversations,
    });
  } catch (error) {
    console.error("❌ Lỗi getConversations:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy tổng số tin nhắn chưa đọc của user
export const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Lấy tất cả conversations của user
    const conversations = await Conversation.find({
      participants: currentUserId,
    });

    // Tính tổng unread count từ tất cả conversations
    let totalUnread = 0;
    for (const conv of conversations) {
      const unread = conv.unreadCount.get(currentUserId.toString()) || 0;
      totalUnread += unread;
    }

    res.status(200).json({
      message: "Lấy số tin nhắn chưa đọc thành công",
      unreadCount: totalUnread,
    });
  } catch (error) {
    console.error("❌ Lỗi getUnreadCount:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy tin nhắn trong một conversation
export const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.params;

    if (currentUserId.toString() === userId) {
      return res.status(400).json({ message: "Không thể chat với chính mình" });
    }

    // Tìm hoặc tạo conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId], $size: 2 },
    });

    // Nếu chưa có, tạo mới
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, userId],
        unreadCount: new Map(),
      });
    }

    // Lấy tin nhắn
    const messages = await ChatMessage.find({
      conversation: conversation._id,
    })
      .populate("sender", "name avatarUrl")
      .populate("receiver", "name avatarUrl")
      .populate("replyTo", "text imageUrl sender")
      .sort({ createdAt: 1 });

    // Đánh dấu tin nhắn chưa đọc là đã đọc
    await ChatMessage.updateMany(
      {
        conversation: conversation._id,
        receiver: currentUserId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Reset unread count
    conversation.unreadCount.set(currentUserId.toString(), 0);
    await conversation.save();

    res.status(200).json({
      message: "Lấy tin nhắn thành công",
      data: messages,
    });
  } catch (error) {
    console.error("❌ Lỗi getMessages:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Gửi tin nhắn
export const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.params;
    const { text } = req.body;

    // Cho phép gửi tin nhắn chỉ có hình ảnh hoặc chỉ có text
    if ((!text || !text.trim()) && !req.file) {
      return res.status(400).json({ message: "Nội dung tin nhắn hoặc hình ảnh là bắt buộc" });
    }

    if (currentUserId.toString() === userId) {
      return res.status(400).json({ message: "Không thể gửi tin nhắn cho chính mình" });
    }

    // Tìm hoặc tạo conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, userId],
        unreadCount: new Map(),
      });
    }

    // Xử lý ảnh: ưu tiên file upload, sau đó là URL
    let finalImageUrl = null;
    if (req.file) {
      if (req.file.path && req.file.path.startsWith('http')) {
        // Cloudinary URL
        finalImageUrl = req.file.path;
      } else {
        // Local file
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const filename = req.file.filename || req.file.path.split(/[/\\]/).pop();
        finalImageUrl = `${baseUrl}/uploads/${filename}`;
      }
    } else if (req.body.imageUrl) {
      finalImageUrl = req.body.imageUrl;
    }

    // Tạo tin nhắn
    const message = await ChatMessage.create({
      conversation: conversation._id,
      sender: currentUserId,
      receiver: userId,
      text: text ? text.trim() : '',
      imageUrl: finalImageUrl,
      replyTo: req.body.replyTo || null,
      isRead: false,
    });

    // Cập nhật conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();

    // Tăng unread count cho receiver
    const currentUnread = conversation.unreadCount.get(userId) || 0;
    conversation.unreadCount.set(userId, currentUnread + 1);

    await conversation.save();

    // Populate để trả về đầy đủ thông tin
    await message.populate("sender", "name avatarUrl");
    await message.populate("receiver", "name avatarUrl");
    if (message.replyTo) {
      await message.populate("replyTo", "text imageUrl sender");
    }

    // Format message for Socket.IO
    const messageData = {
      _id: message._id,
      text: message.text,
      imageUrl: message.imageUrl,
      senderId: message.sender._id.toString(),
      receiverId: message.receiver._id.toString(),
      sender: {
        _id: message.sender._id.toString(),
        name: message.sender.name,
        avatarUrl: message.sender.avatarUrl,
      },
      receiver: {
        _id: message.receiver._id.toString(),
        name: message.receiver.name,
        avatarUrl: message.receiver.avatarUrl,
      },
      createdAt: message.createdAt,
      isRead: message.isRead,
      reactions: message.reactions ? Object.fromEntries(message.reactions) : {},
      replyTo: message.replyTo ? {
        _id: message.replyTo._id.toString(),
        text: message.replyTo.text,
        imageUrl: message.replyTo.imageUrl,
        sender: message.replyTo.sender ? {
          _id: message.replyTo.sender._id.toString(),
          name: message.replyTo.sender.name,
        } : undefined,
      } : undefined,
      conversationId: conversation._id.toString(),
    };

    // Emit newMessage event via Socket.IO
    const io = req.app.get('io');
    if (io) {
      // Emit to conversation room
      io.to(`conversation:${conversation._id}`).emit('newMessage', messageData);
      // Also emit to receiver's personal room (in case they're not in conversation room)
      io.to(`user:${userId}`).emit('newMessage', messageData);
      console.log(`📤 Emitted newMessage to conversation:${conversation._id} and user:${userId}`);
      
      // Calculate and emit unread count for receiver
      const receiverConversations = await Conversation.find({
        participants: userId,
      });
      let receiverUnreadCount = 0;
      for (const conv of receiverConversations) {
        const unread = conv.unreadCount.get(userId) || 0;
        receiverUnreadCount += unread;
      }
      io.to(`user:${userId}`).emit('unreadChatCount', { unreadCount: receiverUnreadCount });
      console.log(`📬 Emitted unreadChatCount: ${receiverUnreadCount} to user:${userId}`);
    }

    res.status(201).json({
      message: "Gửi tin nhắn thành công",
      data: message,
    });
  } catch (error) {
    console.error("❌ Lỗi sendMessage:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Thêm hoặc xóa reaction
export const toggleReaction = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji là bắt buộc" });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    }

    // Kiểm tra quyền: chỉ có thể react tin nhắn trong conversation của mình
    const conversation = await Conversation.findById(message.conversation);
    if (!conversation.participants.includes(currentUserId)) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    // Lấy reactions hiện tại
    const reactions = message.reactions || new Map();
    const emojiReactions = reactions.get(emoji) || [];

    // Kiểm tra xem user đã react emoji này chưa
    const userReacted = emojiReactions.some(
      (userId) => userId.toString() === currentUserId.toString()
    );

    if (userReacted) {
      // Xóa reaction
      const newReactions = emojiReactions.filter(
        (userId) => userId.toString() !== currentUserId.toString()
      );
      if (newReactions.length === 0) {
        reactions.delete(emoji);
      } else {
        reactions.set(emoji, newReactions);
      }
    } else {
      // Thêm reaction
      reactions.set(emoji, [...emojiReactions, currentUserId]);
    }

    message.reactions = reactions;
    await message.save();

    // Populate để trả về đầy đủ thông tin
    await message.populate("sender", "name avatarUrl");
    await message.populate("receiver", "name avatarUrl");
    await message.populate("replyTo", "text imageUrl sender");

    res.status(200).json({
      message: "Cập nhật reaction thành công",
      data: message,
    });
  } catch (error) {
    console.error("❌ Lỗi toggleReaction:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Đánh dấu tin nhắn đã đọc
export const markAsRead = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.params;

    // Tìm hoặc tạo conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId], $size: 2 },
    });

    // Nếu chưa có, tạo mới
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, userId],
        unreadCount: new Map(),
      });
    }

    // Đánh dấu tất cả tin nhắn chưa đọc là đã đọc
    await ChatMessage.updateMany(
      {
        conversation: conversation._id,
        receiver: currentUserId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Reset unread count
    conversation.unreadCount.set(currentUserId.toString(), 0);
    await conversation.save();

    // Emit updated unread count via Socket.IO
    const io = req.app.get('io');
    if (io) {
      // Calculate total unread count for current user
      const userConversations = await Conversation.find({
        participants: currentUserId,
      });
      let totalUnreadCount = 0;
      for (const conv of userConversations) {
        const unread = conv.unreadCount.get(currentUserId.toString()) || 0;
        totalUnreadCount += unread;
      }
      io.to(`user:${currentUserId.toString()}`).emit('unreadChatCount', { unreadCount: totalUnreadCount });
      console.log(`📬 Emitted unreadChatCount: ${totalUnreadCount} to user:${currentUserId.toString()}`);
    }

    res.status(200).json({
      message: "Đánh dấu đã đọc thành công",
    });
  } catch (error) {
    console.error("❌ Lỗi markAsRead:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy hoặc tạo conversation với admin (cho user)
export const getOrCreateAdminConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    // Tìm admin đầu tiên (hoặc có thể chỉ định admin cụ thể)
    const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    
    if (!admin) {
      return res.status(404).json({ message: "Không tìm thấy admin trong hệ thống" });
    }

    const adminId = admin._id;

    // Tìm conversation với admin
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, adminId], $size: 2 },
    }).populate("participants", "name avatarUrl");

    // Nếu chưa có, tạo mới
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, adminId],
        unreadCount: new Map(),
      });
      await conversation.populate("participants", "name avatarUrl");
    }

    res.status(200).json({
      message: "Lấy conversation với admin thành công",
      data: conversation,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        avatarUrl: admin.avatarUrl,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi getOrCreateAdminConversation:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy danh sách conversations với users (cho admin)
export const getAdminConversations = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập" });
    }

    const adminId = req.user._id;

    const conversations = await Conversation.find({
      participants: adminId,
    })
      .populate("participants", "name avatarUrl email role")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    // Format data để trả về danh sách users đã chat với admin
    const conversationsList = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.participants.find(
          (p) => p._id.toString() !== adminId.toString()
        );

        if (!otherUser) return null;

        const unreadCount = conv.unreadCount.get(adminId.toString()) || 0;

        let lastMessageText = "";
        let lastMessageTime = null;
        if (conv.lastMessage) {
          const lastMsg = await ChatMessage.findById(conv.lastMessage);
          if (lastMsg) {
            lastMessageText = lastMsg.text || (lastMsg.imageUrl ? "📷 Hình ảnh" : "");
            lastMessageTime = lastMsg.createdAt;
          }
        }

        return {
          _id: conv._id,
          userId: otherUser._id,
          userName: otherUser.name || "Người dùng",
          userEmail: otherUser.email,
          userAvatar: otherUser.avatarUrl,
          lastMessage: lastMessageText,
          lastMessageTime: lastMessageTime || conv.lastMessageAt,
          unreadCount: unreadCount,
        };
      })
    );

    // Lọc bỏ null và sort lại
    const filteredConversations = conversationsList
      .filter(conv => conv !== null)
      .sort((a, b) => {
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        return timeB - timeA;
      });

    res.status(200).json({
      message: "Lấy danh sách conversations thành công",
      data: filteredConversations,
    });
  } catch (error) {
    console.error("❌ Lỗi getAdminConversations:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

