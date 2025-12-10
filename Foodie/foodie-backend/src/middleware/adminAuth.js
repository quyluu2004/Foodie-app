import { isAdmin } from '../utils/roleHelpers.js';

/**
 * Middleware để kiểm tra user có phải admin không
 * Phải được sử dụng sau auth middleware
 */
export const adminAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Bạn cần đăng nhập để thực hiện thao tác này',
    });
  }

  if (!isAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Chỉ admin mới có quyền thực hiện thao tác này',
    });
  }

  next();
};

