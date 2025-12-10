import Comment from "../models/Comment.js";
import Recipe from "../models/Recipe.js";
import Post from "../models/Post.js";
import Notification from "../models/Notification.js";
import { isAdmin } from "../utils/roleHelpers.js";

// Tạo comment cho recipe
export const createComment = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    
    // Xử lý ảnh: ưu tiên file upload, sau đó là URL
    let finalImageUrl = req.body.imageUrl || null;
    
    if (req.file) {
      // Nếu có file upload
      if (req.file.path.startsWith('http')) {
        // Cloudinary URL
        finalImageUrl = req.file.path;
      } else {
        // Local file - convert thành URL HTTP
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const filename = req.file.filename || req.file.path.split(/[/\\]/).pop();
        finalImageUrl = `${baseUrl}/uploads/${filename}`;
      }
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Nội dung comment là bắt buộc" });
    }

    // Kiểm tra recipe tồn tại
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    // Tạo comment
    const comment = await Comment.create({
      user: userId,
      recipe: recipeId,
      text: text.trim(),
      imageUrl: finalImageUrl,
    });

    await comment.populate("user", "name email avatarUrl");

    res.status(201).json({
      message: "Đã thêm comment",
      comment: comment,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo comment:", error);
    res.status(500).json({ message: "Lỗi tạo comment", error: error.message });
  }
};

// Lấy tất cả comments (Admin only) - từ cả Recipe và Post
export const getAllComments = async (req, res) => {
  try {
    // Lấy comments từ Recipe
    const recipeComments = await Comment.find()
      .populate("user", "name email avatarUrl")
      .populate("recipe", "title")
      .populate("likes", "name email avatarUrl")
      .sort({ createdAt: -1 })
      .lean(); // Dùng lean() để convert thành plain object

    // Lấy comments từ Post
    const posts = await Post.find()
      .populate("user", "name email avatarUrl")
      .populate("comments.user", "name email avatarUrl")
      .populate("comments.likes", "name email avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    // Flatten comments từ Post
    const postComments = [];
    posts.forEach((post) => {
      if (post.comments && post.comments.length > 0) {
        post.comments.forEach((comment) => {
          postComments.push({
            _id: comment._id,
            user: comment.user,
            text: comment.text,
            likes: comment.likes || [],
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            source: "post", // Đánh dấu comment từ Post
            postId: post._id,
            postCaption: post.caption,
            recipe: null, // Không có recipe
          });
        });
      }
    });

    // Format comments từ Recipe
    const formattedRecipeComments = recipeComments.map((comment) => ({
      ...comment,
      source: "recipe", // Đánh dấu comment từ Recipe
      postId: null, // Không có post
      postCaption: null,
    }));

    // Gộp tất cả comments và sort theo createdAt
    const allComments = [...formattedRecipeComments, ...postComments].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      message: "Lấy danh sách comments thành công",
      comments: allComments,
      count: allComments.length,
      recipeCommentsCount: formattedRecipeComments.length,
      postCommentsCount: postComments.length,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách comments:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách comments", error: error.message });
  }
};

// Lấy danh sách comments của recipe
export const getCommentsByRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const comments = await Comment.find({ recipe: recipeId })
      .populate("user", "name email avatarUrl")
      .populate("likes", "name email avatarUrl")
      .populate("replies.user", "name email avatarUrl")
      .populate("replies.likes", "name email avatarUrl")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Lấy danh sách comments thành công",
      comments: comments,
      count: comments.length,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách comments:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách comments", error: error.message });
  }
};

// Xóa comment
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy comment" });
    }

    // Kiểm tra quyền: chỉ author hoặc admin mới xóa được
    const userIsAdmin = isAdmin(req.user);
    const commentOwnerId = comment.user?.toString() || comment.user;
    const currentUserId = userId?.toString() || userId;
    const isOwner = currentUserId && commentOwnerId && currentUserId === commentOwnerId;
    
    if (!isOwner && !userIsAdmin) {
      return res.status(403).json({ message: "Bạn không có quyền xóa comment này" });
    }

    // Nếu admin xóa comment của user khác, tạo thông báo
    if (userIsAdmin && !isOwner) {
      const { reason } = req.body; // Lý do xóa từ admin (tùy chọn)
      
      await Notification.create({
        user: comment.user,
        type: "comment_removed",
        title: "Admin đã xóa bình luận của bạn",
        message: `Bình luận của bạn đã bị admin xóa${reason ? `: ${reason}` : ''}.`,
        reason: reason || "",
        relatedId: comment.recipe || comment._id,
        relatedType: comment.recipe ? "Recipe" : null,
        isRead: false,
      });
      
      // Emit notification event via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${comment.user}`).emit('newNotification');
        console.log(`📤 Emitted newNotification event to user:${comment.user}`);
      }
      
      console.log(`✅ Đã tạo thông báo cho user ${comment.user} về comment bị xóa`);
    }

    await Comment.findByIdAndDelete(id);
    res.status(200).json({ 
      message: "Đã xóa comment",
      notificationSent: userIsAdmin && !isOwner
    });
  } catch (error) {
    console.error("❌ Lỗi xóa comment:", error);
    res.status(500).json({ message: "Lỗi xóa comment", error: error.message });
  }
};

// Like/Unlike comment (toggle)
export const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy comment" });
    }

    const isLiked = comment.likes.includes(userId);
    
    if (isLiked) {
      // Unlike
      comment.likes = comment.likes.filter(
        (likeId) => likeId.toString() !== userId.toString()
      );
    } else {
      // Like
      comment.likes.push(userId);
    }
    
    await comment.save();
    await comment.populate("user", "name email avatarUrl");
    await comment.populate("likes", "name email avatarUrl");
    await comment.populate("replies.user", "name email avatarUrl");
    await comment.populate("replies.likes", "name email avatarUrl");

    res.status(200).json({
      message: isLiked ? "Đã bỏ thích comment" : "Đã like comment",
      comment: comment,
      isLiked: !isLiked,
      likesCount: comment.likes.length,
    });
  } catch (error) {
    console.error("❌ Lỗi like/unlike comment:", error);
    res.status(500).json({ message: "Lỗi like/unlike comment", error: error.message });
  }
};

// Reply to comment
export const replyComment = async (req, res) => {
  try {
    const { id } = req.params; // commentId
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Nội dung trả lời không được để trống" });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }

    comment.replies.push({
      user: userId,
      text: text.trim(),
      likes: [],
    });

    await comment.save();
    await comment.populate("user", "name email avatarUrl");
    await comment.populate("likes", "name email avatarUrl");
    await comment.populate("replies.user", "name email avatarUrl");
    await comment.populate("replies.likes", "name email avatarUrl");

    const newReply = comment.replies[comment.replies.length - 1];

    res.status(201).json({
      message: "Đã thêm trả lời",
      reply: newReply,
      comment: comment,
    });
  } catch (error) {
    console.error("❌ Lỗi thêm trả lời:", error);
    res.status(500).json({ message: "Lỗi thêm trả lời", error: error.message });
  }
};

