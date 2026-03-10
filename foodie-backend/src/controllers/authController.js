import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendRegistrationEmail, sendPromotionEmail } from "../utils/emailService.js";
import Message from "../models/Message.js";
import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";
import { isAdmin } from "../utils/roleHelpers.js";
import Follow from "../models/Follow.js";
import Post from "../models/Post.js";
import RecipeCooked from "../models/RecipeCooked.js";

// ==============================
// 🔐 Password Policy
// ==============================
const PASSWORD_POLICY = {
  minLength: 6,
  requireUppercase: true,
  requireNumber: true,
  requireSpecial: true,
};

/**
 * Kiểm tra password có đủ mạnh theo policy không
 * @returns {{ valid: boolean, message: string }}
 */
const validatePasswordPolicy = (password) => {
  if (!password || password.length < PASSWORD_POLICY.minLength) {
    return { valid: false, message: `Mật khẩu phải có ít nhất ${PASSWORD_POLICY.minLength} ký tự` };
  }
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 1 chữ hoa (A-Z)' };
  }
  if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password)) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 1 chữ số (0-9)' };
  }
  if (PASSWORD_POLICY.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)' };
  }
  return { valid: true, message: '' };
};

// ==============================
// 🔑 Token Helpers
// ==============================

/**
 * Tạo access token (ngắn hạn: 1 giờ)
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Tạo refresh token (dài hạn: 30 ngày)
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '30d' }
  );
};

/**
 * Format user object cho response (loại bỏ sensitive data)
 */
const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl || "",
  phone: user.phone || "",
  bio: user.bio || "",
  gender: user.gender || "",
  birthDate: user.birthDate || null,
  socialLinks: user.socialLinks || {},
  role: user.role || "user",
  isPrivate: user.isPrivate || false,
});

// ==============================
// 📝 ĐĂNG KÝ
export const register = async (req, res) => {
  try {
    // Kiểm tra JWT_SECRET có tồn tại không
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: "Cấu hình server không đúng. Vui lòng liên hệ quản trị viên." });
    }

    // Validate request body
    // console.log('📥 Request body:', req.body); // Debug only

    const { email, password, name, phone, bio, gender, birthDate, avatarUrl } = req.body;

    // Kiểm tra email có tồn tại và là string
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc" });
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc" });
    }

    // Validate email format và normalize (trim + lowercase)
    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }

    // 🔐 Kiểm tra password policy
    const passwordCheck = validatePasswordPolicy(password.trim());
    if (!passwordCheck.valid) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    // Sử dụng email đã trim và lowercase
    const finalEmail = emailTrimmed;

    // Kiểm tra email đã tồn tại chưa
    const exists = await User.findOne({ email: finalEmail });
    if (exists) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // Xử lý avatar: ưu tiên file upload, sau đó là avatarUrl từ body, cuối cùng là mặc định
    let finalAvatarUrl = "https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_face,r_max/w_200/lady.jpg";
    if (req.file && req.file.path) {
      // Nếu là Cloudinary URL (bắt đầu bằng http)
      if (req.file.path.startsWith('http')) {
        finalAvatarUrl = req.file.path;
        console.log('✅ Avatar uploaded to Cloudinary:', finalAvatarUrl);
      } else {
        // Nếu là local file, tạo URL đầy đủ
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const filename = req.file.filename || req.file.path.split(/[/\\]/).pop();
        finalAvatarUrl = `${baseUrl}/uploads/${filename}`;
        console.log('✅ Avatar uploaded to local storage:', finalAvatarUrl);
      }
    } else if (avatarUrl) {
      finalAvatarUrl = avatarUrl;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Chuẩn bị dữ liệu user
    const userData = {
      email: finalEmail,
      passwordHash,
      name: (name || "Foodie User").trim(),
      role: "user",
      avatarUrl: finalAvatarUrl,
      phone: (phone || "").trim(),
      bio: (bio || "").trim(),
      gender: (gender || "").trim(),
      birthDate: birthDate ? new Date(birthDate) : null
    };

    // Tạo user trong database
    const user = await User.create(userData);

    // 🔑 Tạo access token + refresh token
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Gửi email xác nhận đăng ký (không chặn response nếu lỗi)
    try {
      await sendRegistrationEmail(finalEmail, user.name);
    } catch (emailError) {
      console.error('⚠️ Lỗi gửi email xác nhận (không ảnh hưởng đến đăng ký):', emailError);
    }

    // Trả về response thành công
    res.json({
      message: "Success",
      user: formatUserResponse(user),
      token,
      refreshToken
    });
  } catch (err) {
    console.error('❌ Register error:', err);
    console.error('❌ Error name:', err.name);
    console.error('❌ Error code:', err.code);
    console.error('❌ Error message:', err.message);
    console.error('❌ Error stack:', err.stack);

    if (err.name === 'ValidationError') {
      console.error('❌ Validation error:', err.message);
      return res.status(400).json({ message: "Dữ liệu không hợp lệ: " + err.message });
    }

    if (err.code === 11000) {
      console.error('❌ Duplicate email error');
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const errorMessage = err.message || "Lỗi hệ thống. Vui lòng thử lại sau.";
    console.error('❌ Sending error response:', errorMessage);
    res.status(500).json({
      message: errorMessage
    });
  }
};

export const login = async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: "Cấu hình server không đúng. Vui lòng liên hệ quản trị viên." });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc" });
    }

    // Trim và normalize email
    const emailTrimmed = email.trim().toLowerCase();
    const passwordTrimmed = password.trim();

    // Tìm user trong database
    const user = await User.findOne({ email: emailTrimmed });
    if (!user) {
      // 🔐 Thống nhất error message để tránh user enumeration
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // So sánh password
    const match = await bcrypt.compare(passwordTrimmed, user.passwordHash);

    if (!match) {
      // 🔐 Cùng error message với email không tồn tại
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // 🔑 Tạo access token + refresh token
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      message: "Đăng nhập thành công",
      user: formatUserResponse(user),
      token,
      refreshToken
    });
  } catch (error) {
    console.error("❌ Lỗi khi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi hệ thống. Vui lòng thử lại sau." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, phone, bio, gender, birthDate, socialLinks, avatarUrl, isPrivate } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    if (name !== undefined) user.name = name ? String(name).trim() : '';
    if (phone !== undefined) user.phone = phone ? String(phone).trim() : '';
    if (bio !== undefined) user.bio = bio ? String(bio).trim() : '';
    if (gender !== undefined) user.gender = gender ? String(gender).trim() : '';
    if (birthDate !== undefined) {
      if (birthDate === null || birthDate === '') {
        user.birthDate = null;
      } else {
        user.birthDate = new Date(birthDate);
      }
    }
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl || '';
    if (isPrivate !== undefined) user.isPrivate = Boolean(isPrivate);

    if (socialLinks !== undefined && socialLinks !== null) {
      // Đảm bảo socialLinks là object
      if (typeof socialLinks === 'object' && !Array.isArray(socialLinks)) {
        if (socialLinks.email !== undefined) user.socialLinks.email = socialLinks.email ? String(socialLinks.email).trim() : '';
        if (socialLinks.facebook !== undefined) user.socialLinks.facebook = socialLinks.facebook ? String(socialLinks.facebook).trim() : '';
        if (socialLinks.instagram !== undefined) user.socialLinks.instagram = socialLinks.instagram ? String(socialLinks.instagram).trim() : '';
        if (socialLinks.twitter !== undefined) user.socialLinks.twitter = socialLinks.twitter ? String(socialLinks.twitter).trim() : '';
        if (socialLinks.youtube !== undefined) user.socialLinks.youtube = socialLinks.youtube ? String(socialLinks.youtube).trim() : '';
        if (socialLinks.website !== undefined) user.socialLinks.website = socialLinks.website ? String(socialLinks.website).trim() : '';
        if (socialLinks.custom !== undefined) user.socialLinks.custom = socialLinks.custom;
      }
    }

    await user.save();

    res.json({
      message: "Cập nhật profile thành công",
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error("❌ Lỗi cập nhật profile:", error);
    res.status(500).json({ message: "Lỗi cập nhật profile", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?._id; // User đang xem profile

    const user = await User.findById(userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    // Kiểm tra xem current user có đang follow user này không
    let isFollowing = false;
    if (currentUserId && currentUserId.toString() !== userId.toString()) {
      const followRelation = await Follow.findOne({
        follower: currentUserId,
        following: userId
      });
      isFollowing = !!followRelation;
    }

    // Kiểm tra privacy: Nếu user là private và current user không phải chính họ và không follow thì chỉ trả về thông tin cơ bản
    const isOwnProfile = currentUserId && currentUserId.toString() === userId.toString();
    const canViewFullProfile = isOwnProfile || !user.isPrivate || isFollowing;

    // Tính toán số lượng followers, following, và posts
    // followersCount: Số người đang theo dõi user này (following: userId nghĩa là userId được follow)
    const followersCount = await Follow.countDocuments({ following: userId });

    // followingCount: Số người mà user này đang theo dõi (follower: userId nghĩa là userId đang follow)
    const followingCount = await Follow.countDocuments({ follower: userId });

    // postsCount: Số bài đăng của user này
    const postsCount = await Post.countDocuments({ user: userId });

    // ratingsCount: Số đánh giá của user này
    const ratingsCount = await RecipeCooked.countDocuments({
      user: userId,
      rating: { $exists: true, $ne: null }
    });

    console.log(`📊 User ${userId} stats:`, {
      followers: followersCount,
      following: followingCount,
      posts: postsCount,
      ratings: ratingsCount,
      isPrivate: user.isPrivate,
      canViewFullProfile: canViewFullProfile
    });

    // Nếu không thể xem full profile, chỉ trả về thông tin cơ bản
    if (!canViewFullProfile) {
      return res.json({
        message: "Lấy thông tin user thành công",
        user: {
          _id: user._id,
          name: user.name,
          avatarUrl: user.avatarUrl || "",
          role: user.role || "user",
          isPrivate: true
        },
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        postsCount: postsCount || 0,
        ratingsCount: ratingsCount || 0,
        isFollowing: isFollowing,
        isPrivate: true,
        canViewFullProfile: false
      });
    }

    res.json({
      message: "Lấy thông tin user thành công",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        phone: user.phone || "",
        bio: user.bio || "",
        gender: user.gender || "",
        birthDate: user.birthDate || null,
        socialLinks: user.socialLinks || {},
        role: user.role || "user",
        isPrivate: user.isPrivate || false
      },
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      postsCount: postsCount || 0,
      ratingsCount: ratingsCount || 0,
      isFollowing: isFollowing,
      canViewFullProfile: true
    });
  } catch (error) {
    console.error("❌ Lỗi lấy thông tin user:", error);
    res.status(500).json({ message: "Lỗi lấy thông tin user", error: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    if (req.file) {
      if (req.file.path.startsWith('http')) {
        user.avatarUrl = req.file.path;
      } else {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const filename = req.file.filename || req.file.path.split(/[/\\]/).pop();
        user.avatarUrl = `${baseUrl}/uploads/${filename}`;
      }
      await user.save();
    }

    res.json({
      message: "Upload avatar thành công",
      avatarUrl: user.avatarUrl
    });
  } catch (error) {
    console.error("❌ Lỗi upload avatar:", error);
    res.status(500).json({ message: "Lỗi upload avatar", error: error.message });
  }
};

// 🧠 LẤY THÔNG TIN USER HIỆN TẠI (từ token)
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    res.json({
      message: "Lấy thông tin user thành công",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        phone: user.phone || "",
        bio: user.bio || "",
        gender: user.gender || "",
        birthDate: user.birthDate || null,
        socialLinks: user.socialLinks || {},
        role: user.role || "user"
      }
    });
  } catch (error) {
    console.error("❌ Lỗi lấy thông tin user:", error);
    res.status(500).json({ message: "Lỗi lấy thông tin user", error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập" });
    }

    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    res.json({
      message: "Lấy danh sách users thành công",
      users
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách users:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách users", error: error.message });
  }
};

export const promoteUser = async (req, res) => {
  try {
    // ✅ Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Chỉ admin mới có quyền thực hiện thao tác này" });
    }

    const { userId } = req.params;
    const { role, reason } = req.body;

    // ✅ Validation: role phải là 'creator'
    if (role !== 'creator') {
      return res.status(400).json({ message: "Chỉ có thể nâng cấp user lên creator" });
    }

    // ✅ Validation: lý do bắt buộc
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        message: "Lý do nâng cấp là bắt buộc và phải có ít nhất 10 ký tự"
      });
    }

    if (reason.trim().length > 500) {
      return res.status(400).json({
        message: "Lý do nâng cấp không được vượt quá 500 ký tự"
      });
    }

    // ✅ Tìm user cần promote
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    // ✅ Validation: Không thể promote chính mình
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Bạn không thể nâng cấp chính mình" });
    }

    // ✅ Validation: Kiểm tra role hiện tại
    if (user.role === 'creator') {
      return res.status(400).json({ message: "User này đã là Creator" });
    }

    if (isAdmin(user)) {
      return res.status(400).json({ message: "Không thể nâng cấp Admin" });
    }

    // ✅ Lưu role cũ để log
    const oldRole = user.role;

    // ✅ Cập nhật role
    user.role = role;
    await user.save();

    // ✅ Lấy thông tin IP và User Agent
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // ✅ Tạo audit log (async, không chặn response)
    try {
      await AuditLog.create({
        action: 'USER_PROMOTED',
        actor: req.user._id,
        target: user._id,
        targetType: 'user',
        changes: {
          role: {
            from: oldRole,
            to: role
          }
        },
        reason: reason.trim(),
        metadata: {
          ip,
          userAgent,
          timestamp: new Date()
        }
      });
      console.log('✅ Audit log đã được tạo');
    } catch (auditError) {
      console.error('⚠️ Lỗi tạo audit log (không ảnh hưởng đến promote):', auditError);
    }

    // ✅ Gửi email thông báo (async, không chặn response)
    try {
      await sendPromotionEmail(
        user.email,
        user.name,
        reason.trim(),
        req.user.name || req.user.email
      );
      console.log('✅ Email thông báo đã được gửi');
    } catch (emailError) {
      console.error('⚠️ Lỗi gửi email (không ảnh hưởng đến promote):', emailError);
    }

    // ✅ Tạo notification cho user
    try {
      await Notification.create({
        user: user._id,
        type: "admin_message",
        title: "Bạn đã được nâng cấp lên Creator",
        message: `Chúc mừng! Bạn đã được admin nâng cấp lên Creator. Lý do: ${reason.trim()}`,
        relatedId: user._id,
        relatedType: null,
        isRead: false,
      });

      // Emit notification event via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${user._id}`).emit('newNotification');
        console.log(`📤 Emitted newNotification event to user:${user._id}`);
      }

      console.log(`✅ Đã tạo notification cho user ${user._id} về việc được promote`);
    } catch (notificationError) {
      console.error('⚠️ Lỗi tạo notification (không ảnh hưởng đến promote):', notificationError);
    }

    // ✅ Trả về response thành công với user đã được cập nhật
    res.json({
      message: "Đã nâng cấp user lên Creator thành công",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        phone: user.phone || "",
        bio: user.bio || "",
        gender: user.gender || "",
        birthDate: user.birthDate || null,
        socialLinks: user.socialLinks || {},
        role: user.role
      }
    });
  } catch (error) {
    console.error("❌ Lỗi cập nhật role:", error);
    res.status(500).json({ message: "Lỗi cập nhật role", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Chỉ admin mới có quyền" });
    }

    const { userId } = req.params;
    const { reason } = req.body; // Lý do xóa từ admin (tùy chọn)

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    // Tạo notification cho user trước khi xóa (nếu có thể)
    // Lưu ý: User sẽ bị xóa nên notification có thể không được đọc, nhưng vẫn tạo để có record
    try {
      await Notification.create({
        user: user._id,
        type: "admin_message",
        title: "Tài khoản của bạn đã bị xóa",
        message: `Tài khoản của bạn đã bị admin xóa${reason ? `: ${reason}` : ''}.`,
        reason: reason || "",
        relatedId: user._id,
        relatedType: null,
        isRead: false,
      });
      console.log(`✅ Đã tạo notification cho user ${user._id} về việc bị xóa`);
    } catch (notificationError) {
      console.error('⚠️ Lỗi tạo notification (không ảnh hưởng đến xóa user):', notificationError);
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: "Xóa user thành công" });
  } catch (error) {
    console.error("❌ Lỗi xóa user:", error);
    res.status(500).json({ message: "Lỗi xóa user", error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    const match = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!match) {
      return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
    }

    // 🔐 Kiểm tra password policy cho mật khẩu mới
    const passwordCheck = validatePasswordPolicy(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("❌ Lỗi đổi mật khẩu:", error);
    res.status(500).json({ message: "Lỗi đổi mật khẩu", error: error.message });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email, reason, name } = req.body;
    let user = req.user;

    const messageData = {
      type: "password_reset",
      subject: "",
      message: "",
      user: null,
      senderName: name || "Người dùng",
      senderEmail: "",
    };

    if (user) {
      messageData.user = user._id;
      messageData.subject = `Yêu cầu đặt lại mật khẩu - ${user.email}`;
      messageData.message = reason || `Người dùng ${user.name} (${user.email}) yêu cầu đặt lại mật khẩu.`;
    } else {
      if (!email) {
        return res.status(400).json({ message: "Email là bắt buộc" });
      }

      const emailTrimmed = email.trim().toLowerCase();
      user = await User.findOne({ email: emailTrimmed });

      if (!user) {
        return res.status(404).json({ message: "Email không tồn tại trong hệ thống" });
      }

      messageData.user = user._id;
      messageData.senderEmail = emailTrimmed;
      messageData.subject = `Yêu cầu đặt lại mật khẩu - ${emailTrimmed}`;
      messageData.message = reason || `Người dùng ${messageData.senderName} (${emailTrimmed}) yêu cầu đặt lại mật khẩu vì quên mật khẩu.`;
    }

    await Message.create(messageData);

    res.json({
      message: "Yêu cầu đặt lại mật khẩu đã được gửi cho admin. Vui lòng kiểm tra email hoặc liên hệ với admin để nhận mật khẩu mới.",
    });
  } catch (error) {
    console.error("❌ Lỗi yêu cầu đặt lại mật khẩu:", error);
    res.status(500).json({ message: "Lỗi yêu cầu đặt lại mật khẩu", error: error.message });
  }
};

export const adminChangeUserPassword = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Chỉ admin mới có quyền" });
    }

    const { userId } = req.params;
    const { newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Tạo notification cho user
    try {
      await Notification.create({
        user: user._id,
        type: "admin_message",
        title: "Mật khẩu của bạn đã được admin thay đổi",
        message: `Admin đã thay đổi mật khẩu tài khoản của bạn. Mật khẩu mới đã được gửi cho bạn qua tin nhắn.`,
        relatedId: user._id,
        relatedType: null,
        isRead: false,
      });

      // Emit notification event via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${user._id}`).emit('newNotification');
        console.log(`📤 Emitted newNotification event to user:${user._id}`);
      }

      console.log(`✅ Đã tạo notification cho user ${user._id} về việc đổi mật khẩu`);
    } catch (notificationError) {
      console.error('⚠️ Lỗi tạo notification (không ảnh hưởng đến đổi mật khẩu):', notificationError);
    }

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("❌ Lỗi đổi mật khẩu:", error);
    res.status(500).json({ message: "Lỗi đổi mật khẩu", error: error.message });
  }
};

export const getAdminUserDetail = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Chỉ admin mới có quyền" });
    }

    const { userId } = req.params;
    const user = await User.findById(userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    res.json({
      message: "Lấy thông tin chi tiết user thành công",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        phone: user.phone || "",
        bio: user.bio || "",
        gender: user.gender || "",
        birthDate: user.birthDate || null,
        socialLinks: user.socialLinks || {},
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error("❌ Lỗi lấy thông tin chi tiết user:", error);
    res.status(500).json({
      message: "Lỗi lấy thông tin chi tiết user",
      error: error.message,
    });
  }
};

// ==============================
// 🔑 REFRESH TOKEN
// ==============================
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Refresh token là bắt buộc" });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    );

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    // Tìm user
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Người dùng không tồn tại" });
    }

    // Tạo access token mới
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      message: "Token đã được làm mới",
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Refresh token đã hết hạn. Vui lòng đăng nhập lại." });
    }
    console.error("❌ Lỗi refresh token:", error.message);
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};

// Export password policy cho validate.js sử dụng
export { validatePasswordPolicy };
