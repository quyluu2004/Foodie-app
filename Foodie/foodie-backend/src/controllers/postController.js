import Post from "../models/Post.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { isAdmin, canDelete } from "../utils/roleHelpers.js";

// Tạo bài đăng mới
export const createPost = async (req, res) => {
  try {
    const { caption, imageUrl } = req.body;
    const userId = req.user._id;

    // Xử lý ảnh: ưu tiên file upload, sau đó là URL
    let finalImageUrl = imageUrl;
    
    if (req.file) {
      // Nếu có file upload
      if (req.file.path.startsWith('http')) {
        // Cloudinary URL
        finalImageUrl = req.file.path;
      } else {
        // Local file
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const filename = req.file.filename || req.file.path.split(/[/\\]/).pop();
        finalImageUrl = `${baseUrl}/uploads/${filename}`;
      }
    }

    if (!caption || !finalImageUrl) {
      return res.status(400).json({ message: "Caption và ảnh là bắt buộc" });
    }

    const post = await Post.create({
      user: userId,
      caption: caption.trim(),
      imageUrl: finalImageUrl,
      likes: [],
      comments: [],
    });

    // Populate user info
    await post.populate("user", "name email avatarUrl");

    res.status(201).json({
      message: "Đăng bài thành công",
      post,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo bài đăng:", error);
    res.status(500).json({ message: "Lỗi tạo bài đăng", error: error.message });
  }
};

// Lấy danh sách tất cả bài đăng (Feed)
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate("user", "name email avatarUrl")
      .populate("comments.user", "name email avatarUrl")
      .populate("comments.likes", "name avatarUrl")
      .populate("comments.replies.user", "name email avatarUrl")
      .populate("comments.replies.likes", "name avatarUrl")
      .sort({ createdAt: -1 }) // Mới nhất trước
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    res.status(200).json({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách bài đăng:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách bài đăng", error: error.message });
  }
};

// Lấy bài đăng theo ID
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate("user", "name email avatarUrl")
      .populate("comments.user", "name email avatarUrl")
      .populate("comments.likes", "name avatarUrl")
      .populate("comments.replies.user", "name email avatarUrl")
      .populate("comments.replies.likes", "name avatarUrl")
      .populate("likes", "name avatarUrl");

    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("❌ Lỗi lấy bài đăng:", error);
    res.status(500).json({ message: "Lỗi lấy bài đăng", error: error.message });
  }
};

// Lấy bài đăng theo user
export const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: userId })
      .populate("user", "name email avatarUrl")
      .populate("comments.user", "name email avatarUrl")
      .populate("comments.likes", "name avatarUrl")
      .populate("comments.replies.user", "name email avatarUrl")
      .populate("comments.replies.likes", "name avatarUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ user: userId });

    res.status(200).json({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Lỗi lấy bài đăng theo user:", error);
    res.status(500).json({ message: "Lỗi lấy bài đăng theo user", error: error.message });
  }
};

// Like/Unlike bài đăng
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(
        (likeId) => likeId.toString() !== userId.toString()
      );
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
      message: isLiked ? "Đã bỏ thích" : "Đã thích",
      likesCount: post.likes.length,
      isLiked: !isLiked,
    });
  } catch (error) {
    console.error("❌ Lỗi like/unlike:", error);
    res.status(500).json({ message: "Lỗi like/unlike", error: error.message });
  }
};

// Thêm bình luận
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Nội dung bình luận không được để trống" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    post.comments.push({
      user: userId,
      text: text.trim(),
      likes: [],
      replies: [],
    });

    await post.save();

    // Populate comment user
    const updatedPost = await Post.findById(id)
      .populate("user", "name email avatarUrl")
      .populate("comments.user", "name email avatarUrl")
      .populate("comments.likes", "name avatarUrl")
      .populate("comments.replies.user", "name email avatarUrl")
      .populate("comments.replies.likes", "name avatarUrl");

    const newComment = updatedPost.comments[updatedPost.comments.length - 1];

    res.status(201).json({
      message: "Đã thêm bình luận",
      comment: newComment,
    });
  } catch (error) {
    console.error("❌ Lỗi thêm bình luận:", error);
    res.status(500).json({ message: "Lỗi thêm bình luận", error: error.message });
  }
};

// Xóa bài đăng
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { reason } = req.body; // Lý do xóa từ admin

    // Debug: Log thông tin user
    console.log('🔍 Delete Post - User Info:', {
      userId: userId.toString(),
      userRole: req.user.role,
      userEmail: req.user.email
    });

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    // Xác định quyền của user
    const userIsAdmin = isAdmin(req.user);
    const postOwnerId = post.user?.toString() || post.user;
    const currentUserId = userId?.toString() || userId;
    const isOwner = currentUserId && postOwnerId && currentUserId === postOwnerId;

    // Chỉ cho phép xóa bài của chính mình hoặc admin
    if (!canDelete(req.user, post.user)) {
      return res.status(403).json({ 
        message: "Bạn không có quyền xóa bài đăng này",
        debug: {
          isAdmin: userIsAdmin,
          isOwner: isOwner,
          userRole: req.user.role
        }
      });
    }

    // Nếu admin xóa bài của user khác, tạo thông báo
    if (userIsAdmin && !isOwner) {
      const postOwner = await User.findById(post.user);
      if (postOwner) {
        await Notification.create({
          user: post.user,
          type: "post_removed",
          title: "Admin đã gỡ bài đăng của bạn",
          message: `Bài đăng của bạn đã bị admin gỡ bỏ${reason ? `: ${reason}` : ''}`,
          reason: reason || "",
          relatedId: post._id,
          relatedType: "Post",
          isRead: false,
        });
        
        // Emit notification event via Socket.IO
        const io = req.app.get('io');
        if (io) {
          io.to(`user:${post.user}`).emit('newNotification');
          console.log(`📤 Emitted newNotification event to user:${post.user}`);
        }
      }
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({ 
      message: "Đã xóa bài đăng thành công",
      notificationSent: userIsAdmin && !isOwner
    });
  } catch (error) {
    console.error("❌ Lỗi xóa bài đăng:", error);
    res.status(500).json({ message: "Lỗi xóa bài đăng", error: error.message });
  }
};

// Cập nhật bài đăng
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { caption, imageUrl } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    // Chỉ cho phép sửa bài của chính mình
    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền sửa bài đăng này" });
    }

    if (caption) post.caption = caption.trim();
    
    // Xử lý ảnh: ưu tiên file upload, sau đó là URL
    if (req.file) {
      if (req.file.path.startsWith('http')) {
        post.imageUrl = req.file.path;
      } else {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const filename = req.file.filename || req.file.path.split(/[/\\]/).pop();
        post.imageUrl = `${baseUrl}/uploads/${filename}`;
      }
    } else if (imageUrl) {
      post.imageUrl = imageUrl;
    }

    await post.save();

    await post.populate("user", "name email avatarUrl");
    await post.populate("comments.user", "name avatarUrl");

    res.status(200).json({
      message: "Đã cập nhật bài đăng",
      post,
    });
  } catch (error) {
    console.error("❌ Lỗi cập nhật bài đăng:", error);
    res.status(500).json({ message: "Lỗi cập nhật bài đăng", error: error.message });
  }
};

// Like/Unlike comment
export const likeComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }

    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      comment.likes = comment.likes.filter(
        (likeId) => likeId.toString() !== userId.toString()
      );
    } else {
      comment.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
      message: isLiked ? "Đã bỏ thích bình luận" : "Đã thích bình luận",
      likesCount: comment.likes.length,
      isLiked: !isLiked,
    });
  } catch (error) {
    console.error("❌ Lỗi like/unlike comment:", error);
    res.status(500).json({ message: "Lỗi like/unlike comment", error: error.message });
  }
};

// Reply to comment
export const replyComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Nội dung trả lời không được để trống" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }

    comment.replies.push({
      user: userId,
      text: text.trim(),
      likes: [],
    });

    await post.save();

    // Populate để trả về đầy đủ thông tin
    await post.populate("comments.replies.user", "name email avatarUrl");

    const newReply = comment.replies[comment.replies.length - 1];

    res.status(201).json({
      message: "Đã thêm trả lời",
      reply: newReply,
    });
  } catch (error) {
    console.error("❌ Lỗi thêm trả lời:", error);
    res.status(500).json({ message: "Lỗi thêm trả lời", error: error.message });
  }
};

// Xóa comment từ Post (Admin only hoặc author)
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id;
    const { reason } = req.body; // Lý do xóa từ admin

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }

    // Kiểm tra quyền: chỉ author của comment hoặc admin mới xóa được
    if (!canDelete(req.user, comment.user)) {
      return res.status(403).json({ message: "Bạn không có quyền xóa bình luận này" });
    }

    // Nếu admin xóa bình luận của user khác, tạo thông báo
    const commentOwnerId = comment.user?.toString() || comment.user;
    const currentUserId = req.user._id?.toString() || req.user._id;
    const userIsAdmin = isAdmin(req.user);
    const isOwner = currentUserId && commentOwnerId && currentUserId === commentOwnerId;
    if (userIsAdmin && !isOwner) {
      const commentOwner = await User.findById(comment.user);
      if (commentOwner) {
        await Notification.create({
          user: comment.user,
          type: "comment_removed",
          title: "Admin đã xóa bình luận của bạn",
          message: `Bình luận của bạn đã bị admin xóa${reason ? `: ${reason}` : ''}`,
          reason: reason || "",
          relatedId: post._id,
          relatedType: "Post",
          isRead: false,
        });
        
        // Emit notification event via Socket.IO
        const io = req.app.get('io');
        if (io) {
          io.to(`user:${comment.user}`).emit('newNotification');
          console.log(`📤 Emitted newNotification event to user:${comment.user}`);
        }
      }
    }

    post.comments.pull(commentId);
    await post.save();

    res.status(200).json({ 
      message: "Đã xóa bình luận thành công",
      notificationSent: userIsAdmin && !isOwner
    });
  } catch (error) {
    console.error("❌ Lỗi xóa bình luận:", error);
    res.status(500).json({ message: "Lỗi xóa bình luận", error: error.message });
  }
};

// Like/Unlike reply
export const likeReply = async (req, res) => {
  try {
    const { id, commentId, replyId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Không tìm thấy trả lời" });
    }

    const isLiked = reply.likes.includes(userId);

    if (isLiked) {
      reply.likes = reply.likes.filter(
        (likeId) => likeId.toString() !== userId.toString()
      );
    } else {
      reply.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
      message: isLiked ? "Đã bỏ thích trả lời" : "Đã thích trả lời",
      likesCount: reply.likes.length,
      isLiked: !isLiked,
    });
  } catch (error) {
    console.error("❌ Lỗi like/unlike reply:", error);
    res.status(500).json({ message: "Lỗi like/unlike reply", error: error.message });
  }
};

// Lưu/Bỏ lưu bài đăng
export const toggleSavePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      console.error('❌ No user ID in request');
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    console.log('💾 [toggleSavePost] ========================================');
    console.log('💾 [toggleSavePost] Toggling save post:', { postId: id, userId: userId.toString() });

    const SavedPost = (await import("../models/SavedPost.js")).default;

    const existingSave = await SavedPost.findOne({
      user: userId,
      post: id,
    });

    console.log('💾 [toggleSavePost] Existing save:', existingSave ? 'Found' : 'Not found');

    if (existingSave) {
      // Bỏ lưu
      console.log('🔄 [toggleSavePost] Unsave post');
      await SavedPost.deleteOne({ _id: existingSave._id });
      console.log('✅ [toggleSavePost] Post unsaved successfully');
      res.status(200).json({
        message: "Đã bỏ lưu bài đăng",
        isSaved: false,
      });
    } else {
      // Lưu
      console.log('💾 [toggleSavePost] Save post');
      const saved = await SavedPost.create({
        user: userId,
        post: id,
      });
      console.log('✅ [toggleSavePost] Post saved successfully:', saved._id);
      res.status(200).json({
        message: "Đã lưu bài đăng",
        isSaved: true,
      });
    }
  } catch (error) {
    console.error("❌ Lỗi lưu/bỏ lưu bài đăng:", error);
    res.status(500).json({
      message: "Lỗi lưu/bỏ lưu bài đăng",
      error: error.message,
    });
  }
};

// Lấy danh sách bài đăng đã lưu
export const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const SavedPost = (await import("../models/SavedPost.js")).default;

    const savedPosts = await SavedPost.find({ user: userId })
      .populate({
        path: "post",
        populate: {
          path: "user",
          select: "name email avatarUrl",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SavedPost.countDocuments({ user: userId });

    // Lọc ra các post đã bị xóa
    const validPosts = savedPosts
      .filter((sp) => sp.post)
      .map((sp) => sp.post);

    res.status(200).json({
      posts: validPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách bài đăng đã lưu:", error);
    res.status(500).json({
      message: "Lỗi lấy danh sách bài đăng đã lưu",
      error: error.message,
    });
  }
};

// Lấy tổng số bình luận (Admin/Stats)
export const getTotalComments = async (req, res) => {
  try {
    // Lấy tất cả posts
    const posts = await Post.find({});
    
    // Đếm tổng số comments (bao gồm cả replies)
    let totalComments = 0;
    posts.forEach((post) => {
      // Đếm số comments chính
      totalComments += post.comments.length;
      
      // Đếm số replies trong mỗi comment
      post.comments.forEach((comment) => {
        if (comment.replies && comment.replies.length > 0) {
          totalComments += comment.replies.length;
        }
      });
    });

    res.status(200).json({
      totalComments,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy tổng số bình luận:", error);
    res.status(500).json({
      message: "Lỗi lấy tổng số bình luận",
      error: error.message,
    });
  }
};

