import Report from "../models/Report.js";
import Recipe from "../models/Recipe.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";

// Tạo report
export const createReport = async (req, res) => {
  try {
    const { type, targetId, reason, description } = req.body;
    const userId = req.user._id;

    if (!type || !targetId || !reason) {
      return res.status(400).json({ message: "Type, targetId và reason là bắt buộc" });
    }

    // Kiểm tra đã report chưa
    const existingReport = await Report.findOne({
      reporter: userId,
      type: type,
      targetId: targetId,
      status: 'pending'
    });

    if (existingReport) {
      return res.status(400).json({ message: "Bạn đã báo cáo nội dung này rồi" });
    }

    const report = await Report.create({
      reporter: userId,
      type: type,
      targetId: targetId,
      reason: reason.trim(),
      description: description?.trim() || "",
    });

    await report.populate("reporter", "name email");

    // Tạo notification cho user khi báo cáo được tạo (pending)
    try {
      const getTypeLabel = (type) => {
        switch (type) {
          case 'recipe':
            return 'công thức';
          case 'post':
            return 'bài đăng';
          case 'comment':
            return 'bình luận';
          case 'user':
            return 'người dùng';
          default:
            return 'nội dung';
        }
      };

      await Notification.create({
        user: userId,
        type: "admin_message",
        title: "Báo cáo đã được gửi",
        message: `Báo cáo của bạn về ${getTypeLabel(type)} đã được gửi thành công và đang chờ admin xử lý.`,
        reason: "",
        relatedId: report._id,
        relatedType: null,
        isRead: false,
      });
    } catch (notifError) {
      console.error("❌ Lỗi tạo notification khi tạo report:", notifError);
      // Không fail request nếu notification lỗi
    }

    res.status(201).json({
      message: "Đã gửi báo cáo",
      report: report,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo report:", error);
    res.status(500).json({ message: "Lỗi tạo report", error: error.message });
  }
};

// Lấy danh sách reports (Admin only)
export const getAllReports = async (req, res) => {
  try {
    const userRole = (req.user.role || '').toLowerCase();
    if (userRole !== 'admin') {
      return res.status(403).json({ message: "Chỉ admin mới có quyền xem reports" });
    }

    const { status } = req.query;
    const query = status ? { status: status } : {};

    const reports = await Report.find(query)
      .populate("reporter", "name email avatarUrl")
      .populate("resolvedBy", "name email")
      .sort({ createdAt: -1 });

    // Populate target information based on type
    const reportsWithTarget = await Promise.all(
      reports.map(async (report) => {
        let targetInfo = null;
        
        try {
          if (report.type === 'recipe') {
            const recipe = await Recipe.findById(report.targetId).populate('author', 'name email');
            if (recipe) {
              targetInfo = {
                title: recipe.title,
                description: recipe.description,
                author: recipe.author?.name || 'N/A',
              };
            }
          } else if (report.type === 'post') {
            const post = await Post.findById(report.targetId).populate('user', 'name email');
            if (post) {
              targetInfo = {
                caption: post.caption,
                user: post.user?.name || 'N/A',
              };
            }
          } else if (report.type === 'comment') {
            // Comment có thể từ Recipe hoặc Post
            const comment = await Comment.findById(report.targetId).populate('user', 'name email');
            if (comment) {
              targetInfo = {
                text: comment.text,
                user: comment.user?.name || 'N/A',
              };
            }
          }
        } catch (error) {
          console.error(`Error populating target for report ${report._id}:`, error);
        }

        return {
          ...report.toObject(),
          targetInfo,
        };
      })
    );

    res.status(200).json({
      message: "Lấy danh sách reports thành công",
      reports: reportsWithTarget,
      count: reportsWithTarget.length,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách reports:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách reports", error: error.message });
  }
};

// Xử lý report (Admin only)
export const resolveReport = async (req, res) => {
  try {
    const userRole = (req.user.role || '').toLowerCase();
    if (userRole !== 'admin') {
      return res.status(403).json({ message: "Chỉ admin mới có quyền xử lý reports" });
    }

    const { id } = req.params;
    const { action, reason } = req.body; // action: 'delete', 'warn', 'ignore'
    const report = await Report.findById(id).populate("reporter", "name email");

    if (!report) {
      return res.status(404).json({ message: "Không tìm thấy report" });
    }

    // Xử lý action nếu có
    let actionMessage = '';
    if (action === 'delete') {
      // Xóa nội dung bị báo cáo
      if (report.type === 'recipe') {
        const recipe = await Recipe.findById(report.targetId);
        if (recipe) {
          await Recipe.findByIdAndDelete(report.targetId);
          actionMessage = 'Công thức đã bị xóa do vi phạm.';
          
          // Thông báo cho tác giả công thức
          if (recipe.author) {
            await Notification.create({
              user: recipe.author,
              type: "recipe_removed",
              title: "Công thức của bạn đã bị xóa",
              message: `Công thức "${recipe.title}" của bạn đã bị admin xóa do vi phạm${reason ? `: ${reason}` : ''}.`,
              reason: reason || "",
              relatedId: recipe._id,
              relatedType: "Recipe",
              isRead: false,
            });
            
            // Emit notification event via Socket.IO
            const io = req.app.get('io');
            if (io) {
              io.to(`user:${recipe.author}`).emit('newNotification');
              console.log(`📤 Emitted newNotification event to user:${recipe.author}`);
            }
          }
        }
      } else if (report.type === 'post') {
        const post = await Post.findById(report.targetId);
        if (post) {
          await Post.findByIdAndDelete(report.targetId);
          actionMessage = 'Bài đăng đã bị xóa do vi phạm.';
          
          // Thông báo cho tác giả bài đăng
          if (post.user) {
            await Notification.create({
              user: post.user,
              type: "post_removed",
              title: "Bài đăng của bạn đã bị xóa",
              message: `Bài đăng của bạn đã bị admin xóa do vi phạm${reason ? `: ${reason}` : ''}.`,
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
      } else if (report.type === 'comment') {
        const comment = await Comment.findById(report.targetId);
        if (comment) {
          await Comment.findByIdAndDelete(report.targetId);
          actionMessage = 'Bình luận đã bị xóa do vi phạm.';
          
          // Thông báo cho tác giả bình luận
          if (comment.user) {
            await Notification.create({
              user: comment.user,
              type: "comment_removed",
              title: "Bình luận của bạn đã bị xóa",
              message: `Bình luận của bạn đã bị admin xóa do vi phạm${reason ? `: ${reason}` : ''}.`,
              reason: reason || "",
              relatedId: comment._id,
              relatedType: "Comment",
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
      }
    } else if (action === 'warn') {
      actionMessage = 'Đã cảnh báo người dùng.';
    } else {
      actionMessage = 'Báo cáo đã được xem xét.';
    }

    // Cập nhật trạng thái report
    report.status = 'resolved';
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    await report.save();

    await report.populate("resolvedBy", "name email");

    // Tạo notification cho user đã báo cáo
    try {
      const getTypeLabel = (type) => {
        switch (type) {
          case 'recipe':
            return 'công thức';
          case 'post':
            return 'bài đăng';
          case 'comment':
            return 'bình luận';
          case 'user':
            return 'người dùng';
          default:
            return 'nội dung';
        }
      };

      await Notification.create({
        user: report.reporter._id,
        type: "report_resolved",
        title: "Báo cáo của bạn đã được xử lý",
        message: `Báo cáo của bạn về ${getTypeLabel(report.type)} đã được admin xử lý${actionMessage ? `. ${actionMessage}` : ' thành công.'}${reason ? ` Lý do: ${reason}` : ''}`,
        reason: reason || "",
        relatedId: report._id,
        relatedType: null,
        isRead: false,
      });
    } catch (notifError) {
      console.error("❌ Lỗi tạo notification:", notifError);
      // Không fail request nếu notification lỗi
    }

    res.status(200).json({
      message: "Đã xử lý report",
      report: report,
      action: action || 'resolved',
    });
  } catch (error) {
    console.error("❌ Lỗi xử lý report:", error);
    res.status(500).json({ message: "Lỗi xử lý report", error: error.message });
  }
};

// Lấy danh sách reports của user
export const getMyReports = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const query = { reporter: userId };
    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .populate("resolvedBy", "name email");

    // Populate target information based on type
    const reportsWithTarget = await Promise.all(
      reports.map(async (report) => {
        let targetInfo = null;
        
        try {
          if (report.type === 'recipe') {
            const recipe = await Recipe.findById(report.targetId).populate('author', 'name email');
            if (recipe) {
              targetInfo = {
                title: recipe.title,
                description: recipe.description,
                author: recipe.author?.name || 'N/A',
              };
            }
          } else if (report.type === 'post') {
            const post = await Post.findById(report.targetId).populate('user', 'name email');
            if (post) {
              targetInfo = {
                caption: post.caption,
                user: post.user?.name || 'N/A',
              };
            }
          } else if (report.type === 'comment') {
            const comment = await Comment.findById(report.targetId).populate('user', 'name email');
            if (comment) {
              targetInfo = {
                text: comment.text,
                user: comment.user?.name || 'N/A',
              };
            }
          }
        } catch (error) {
          console.error(`Error populating target for report ${report._id}:`, error);
        }

        return {
          ...report.toObject(),
          targetInfo,
        };
      })
    );

    res.status(200).json({
      message: "Lấy danh sách reports thành công",
      reports: reportsWithTarget,
      count: reportsWithTarget.length,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách reports:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách reports", error: error.message });
  }
};

// Xóa report (Admin only)
export const deleteReport = async (req, res) => {
  try {
    const userRole = (req.user.role || '').toLowerCase();
    if (userRole !== 'admin') {
      return res.status(403).json({ message: "Chỉ admin mới có quyền xóa reports" });
    }

    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Không tìm thấy report" });
    }

    res.status(200).json({ message: "Đã xóa report" });
  } catch (error) {
    console.error("❌ Lỗi xóa report:", error);
    res.status(500).json({ message: "Lỗi xóa report", error: error.message });
  }
};

