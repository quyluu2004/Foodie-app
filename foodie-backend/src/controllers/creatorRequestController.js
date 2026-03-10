import CreatorRequest from "../models/CreatorRequest.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { isAdmin } from "../utils/roleHelpers.js";

// User gửi yêu cầu đăng ký creator
export const createCreatorRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      fullName,
      email,
      phone,
      bio,
      experience,
      specialties,
      socialLinks,
      motivation,
    } = req.body;

    // Validation
    if (!fullName || !email || !motivation) {
      return res.status(400).json({
        message: "Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Email, Lý do)",
      });
    }

    if (motivation.trim().length < 20) {
      return res.status(400).json({
        message: "Lý do muốn trở thành creator phải có ít nhất 20 ký tự",
      });
    }

    // Kiểm tra user đã là creator chưa
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    if (user.role === "creator" || user.role === "admin") {
      return res.status(400).json({
        message: "Bạn đã là creator hoặc admin rồi",
      });
    }

    // Kiểm tra đã có request pending chưa
    const existingRequest = await CreatorRequest.findOne({
      user: userId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "Bạn đã có yêu cầu đang chờ xử lý. Vui lòng đợi admin xem xét.",
      });
    }

    // Tạo request mới
    const creatorRequest = await CreatorRequest.create({
      user: userId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      bio: bio?.trim() || "",
      experience: experience?.trim() || "",
      specialties: specialties || [],
      socialLinks: socialLinks || {},
      motivation: motivation.trim(),
      status: "pending",
    });

    // Tạo notification cho tất cả admin
    try {
      const admins = await User.find({ role: "admin" });
      const notificationPromises = admins.map((admin) =>
        Notification.create({
          user: admin._id,
          type: "admin_message",
          title: "Yêu cầu đăng ký Creator mới",
          message: `${user.name} (${user.email}) đã gửi yêu cầu đăng ký creator. Vui lòng xem xét.`,
          relatedId: creatorRequest._id,
          relatedType: "creator_request",
          isRead: false,
        })
      );

      await Promise.all(notificationPromises);

      // Emit notification event via Socket.IO
      const io = req.app.get("io");
      if (io) {
        admins.forEach((admin) => {
          io.to(`user:${admin._id}`).emit("newNotification");
        });
        console.log(`📤 Emitted newNotification events to ${admins.length} admins`);
      }
    } catch (notificationError) {
      console.error(
        "⚠️ Lỗi tạo notification (không ảnh hưởng đến request):",
        notificationError
      );
    }

    res.status(201).json({
      message:
        "Yêu cầu đăng ký creator đã được gửi thành công. Admin sẽ xem xét và phản hồi sớm nhất có thể.",
      request: creatorRequest,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo creator request:", error);
    res.status(500).json({
      message: "Lỗi tạo yêu cầu đăng ký creator",
      error: error.message,
    });
  }
};

// User xem trạng thái request của mình
export const getMyCreatorRequest = async (req, res) => {
  try {
    const userId = req.user._id;

    const request = await CreatorRequest.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .populate("reviewedBy", "name email");

    // Trả về 200 với request: null thay vì 404 (đây là trạng thái bình thường)
    res.json({ 
      request: request || null,
      hasRequest: !!request
    });
  } catch (error) {
    console.error("❌ Lỗi lấy creator request:", error);
    res.status(500).json({
      message: "Lỗi lấy thông tin yêu cầu",
      error: error.message,
    });
  }
};

// Admin: Lấy tất cả creator requests
export const getAllCreatorRequests = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Chỉ admin mới có quyền" });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await CreatorRequest.find(query)
      .populate("user", "name email avatarUrl role")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CreatorRequest.countDocuments(query);

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách creator requests:", error);
    res.status(500).json({
      message: "Lỗi lấy danh sách yêu cầu",
      error: error.message,
    });
  }
};

// Admin: Xem chi tiết một request
export const getCreatorRequestById = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Chỉ admin mới có quyền" });
    }

    const { requestId } = req.params;

    const request = await CreatorRequest.findById(requestId)
      .populate("user", "name email avatarUrl role phone bio gender birthDate socialLinks createdAt")
      .populate("reviewedBy", "name email");

    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
    }

    res.json({ request });
  } catch (error) {
    console.error("❌ Lỗi lấy chi tiết creator request:", error);
    res.status(500).json({
      message: "Lỗi lấy chi tiết yêu cầu",
      error: error.message,
    });
  }
};

// Admin: Approve creator request
export const approveCreatorRequest = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Chỉ admin mới có quyền" });
    }

    const { requestId } = req.params;
    const { adminNotes } = req.body;

    const request = await CreatorRequest.findById(requestId).populate("user");

    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "Yêu cầu này đã được xử lý rồi",
      });
    }

    // Cập nhật role của user
    const user = request.user;
    if (user.role === "creator") {
      return res.status(400).json({
        message: "User này đã là creator rồi",
      });
    }

    user.role = "creator";
    await user.save();

    // Cập nhật request
    request.status = "approved";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.adminNotes = adminNotes?.trim() || "";
    await request.save();

    // Tạo notification cho user
    try {
      await Notification.create({
        user: user._id,
        type: "admin_message",
        title: "🎉 Yêu cầu đăng ký Creator đã được duyệt",
        message: `Chúc mừng! Yêu cầu đăng ký creator của bạn đã được admin duyệt. Bạn giờ đã có thể tạo và chia sẻ công thức nấu ăn.${adminNotes ? `\n\nGhi chú từ admin: ${adminNotes}` : ""}`,
        relatedId: user._id,
        relatedType: "role_update",
        isRead: false,
      });

      // Emit notification event via Socket.IO
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${user._id}`).emit("newNotification");
        console.log(`📤 Emitted newNotification event to user:${user._id}`);
      }
    } catch (notificationError) {
      console.error(
        "⚠️ Lỗi tạo notification (không ảnh hưởng đến approve):",
        notificationError
      );
    }

    res.json({
      message: "Đã duyệt yêu cầu và nâng cấp user lên creator thành công",
      request,
    });
  } catch (error) {
    console.error("❌ Lỗi approve creator request:", error);
    res.status(500).json({
      message: "Lỗi duyệt yêu cầu",
      error: error.message,
    });
  }
};

// Admin: Reject creator request
export const rejectCreatorRequest = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Chỉ admin mới có quyền" });
    }

    const { requestId } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason || rejectionReason.trim().length < 10) {
      return res.status(400).json({
        message: "Lý do từ chối là bắt buộc và phải có ít nhất 10 ký tự",
      });
    }

    const request = await CreatorRequest.findById(requestId).populate("user");

    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "Yêu cầu này đã được xử lý rồi",
      });
    }

    // Cập nhật request
    request.status = "rejected";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.rejectionReason = rejectionReason.trim();
    request.adminNotes = adminNotes?.trim() || "";
    await request.save();

    // Tạo notification cho user
    try {
      await Notification.create({
        user: request.user._id,
        type: "admin_message",
        title: "Yêu cầu đăng ký Creator đã bị từ chối",
        message: `Rất tiếc, yêu cầu đăng ký creator của bạn đã bị từ chối.\n\nLý do: ${rejectionReason.trim()}${adminNotes ? `\n\nGhi chú từ admin: ${adminNotes}` : ""}\n\nBạn có thể gửi lại yêu cầu sau khi cải thiện hồ sơ của mình.`,
        relatedId: request._id,
        relatedType: "creator_request",
        isRead: false,
      });

      // Emit notification event via Socket.IO
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${request.user._id}`).emit("newNotification");
        console.log(`📤 Emitted newNotification event to user:${request.user._id}`);
      }
    } catch (notificationError) {
      console.error(
        "⚠️ Lỗi tạo notification (không ảnh hưởng đến reject):",
        notificationError
      );
    }

    res.json({
      message: "Đã từ chối yêu cầu thành công",
      request,
    });
  } catch (error) {
    console.error("❌ Lỗi reject creator request:", error);
    res.status(500).json({
      message: "Lỗi từ chối yêu cầu",
      error: error.message,
    });
  }
};

