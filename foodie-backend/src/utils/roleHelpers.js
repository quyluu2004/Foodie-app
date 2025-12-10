/**
 * Helper functions để kiểm tra role của user
 * Đảm bảo logic nhất quán trong toàn bộ ứng dụng
 */

/**
 * Kiểm tra user có phải admin không
 * Hỗ trợ cả 'admin' và 'Admin' (case-insensitive)
 * @param {Object} user - User object từ req.user
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  if (!user || !user.role) return false;
  const role = user.role.toLowerCase();
  return role === 'admin';
};

/**
 * Kiểm tra user có phải creator không
 * @param {Object} user - User object từ req.user
 * @returns {boolean}
 */
export const isCreator = (user) => {
  if (!user || !user.role) return false;
  const role = user.role.toLowerCase();
  return role === 'creator';
};

/**
 * Kiểm tra user có phải admin hoặc creator không
 * @param {Object} user - User object từ req.user
 * @returns {boolean}
 */
export const isAdminOrCreator = (user) => {
  return isAdmin(user) || isCreator(user);
};

/**
 * Kiểm tra user có quyền chỉnh sửa resource không
 * @param {Object} user - User object từ req.user
 * @param {Object|string} resourceAuthorId - Author ID của resource (có thể là ObjectId hoặc string)
 * @param {Object} resource - Resource object (optional, để kiểm tra status nếu cần)
 * @returns {boolean}
 */
export const canEdit = (user, resourceAuthorId, resource = null) => {
  if (!user) return false;
  
  // Admin có thể edit tất cả
  if (isAdmin(user)) return true;
  
  // Creator có thể edit resource của chính mình
  if (isCreator(user)) {
    if (!resourceAuthorId) return false;
    const userId = user._id?.toString() || user._id;
    const authorId = resourceAuthorId?.toString() || resourceAuthorId;
    return userId === authorId;
  }
  
  // User thường: chỉ có thể edit khi recipe chưa được duyệt (status = 'pending')
  // Sau khi admin duyệt (status = 'approved'), user thường không thể edit nữa
  if (resource && resource.status === 'approved') {
    return false; // User thường không thể edit sau khi đã được duyệt
  }
  
  // User thường chỉ có thể edit recipe pending của chính mình
  if (!resourceAuthorId) return false;
  const userId = user._id?.toString() || user._id;
  const authorId = resourceAuthorId?.toString() || resourceAuthorId;
  
  // Chỉ cho phép edit nếu là owner và recipe chưa được duyệt
  return userId === authorId && (!resource || resource.status !== 'approved');
};

/**
 * Kiểm tra user có quyền xóa resource không
 * @param {Object} user - User object từ req.user
 * @param {Object|string} resourceAuthorId - Author ID của resource
 * @param {Object} resource - Resource object (optional, để kiểm tra status nếu cần)
 * @returns {boolean}
 */
export const canDelete = (user, resourceAuthorId, resource = null) => {
  if (!user) return false;
  
  // Admin có thể delete tất cả
  if (isAdmin(user)) return true;
  
  // Creator có thể delete resource của chính mình
  if (isCreator(user)) {
    if (!resourceAuthorId) return false;
    const userId = user._id?.toString() || user._id;
    const authorId = resourceAuthorId?.toString() || resourceAuthorId;
    return userId === authorId;
  }
  
  // User thường: chỉ có thể delete khi recipe chưa được duyệt (status = 'pending')
  // Sau khi admin duyệt (status = 'approved'), user thường không thể delete nữa
  if (resource && resource.status === 'approved') {
    return false; // User thường không thể delete sau khi đã được duyệt
  }
  
  // User thường chỉ có thể delete recipe pending của chính mình
  if (!resourceAuthorId) return false;
  const userId = user._id?.toString() || user._id;
  const authorId = resourceAuthorId?.toString() || resourceAuthorId;
  
  // Chỉ cho phép delete nếu là owner và recipe chưa được duyệt
  return userId === authorId && (!resource || resource.status !== 'approved');
};

