/**
 * Cloudinary Image Optimization Utility
 * Tự động tối ưu hóa hình ảnh khi lấy từ Cloudinary
 */

/**
 * Tạo URL Cloudinary đã tối ưu
 * @param {string} originalUrl - URL gốc từ Cloudinary
 * @param {object} options - Tùy chọn tối ưu
 * @returns {string} URL đã tối ưu
 * 
 * @example
 * // Tối ưu cho thumbnail (200x200)
 * optimizeCloudinaryUrl(url, { width: 200, height: 200, crop: 'fill' })
 * 
 * // Tối ưu cho mobile (400w, auto quality)
 * optimizeCloudinaryUrl(url, { width: 400, quality: 'auto' })
 */
export const optimizeCloudinaryUrl = (originalUrl, options = {}) => {
    if (!originalUrl || typeof originalUrl !== 'string') return originalUrl;

    // Chỉ xử lý Cloudinary URLs
    if (!originalUrl.includes('cloudinary.com') && !originalUrl.includes('res.cloudinary')) {
        return originalUrl;
    }

    const {
        width = null,
        height = null,
        crop = 'fill',       // fill, fit, scale, limit, pad
        quality = 'auto',    // auto, auto:low, auto:good, auto:best, 1-100
        format = 'auto',     // auto (webp/avif), jpg, png, webp
        gravity = 'auto',    // auto, face, center
        dpr = 'auto',        // device pixel ratio
    } = options;

    // Build transformation string
    const transforms = [];

    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (crop) transforms.push(`c_${crop}`);
    if (quality) transforms.push(`q_${quality}`);
    if (format) transforms.push(`f_${format}`);
    if (gravity) transforms.push(`g_${gravity}`);
    if (dpr) transforms.push(`dpr_${dpr}`);

    const transformString = transforms.join(',');

    // Insert transformation into Cloudinary URL
    // Pattern: .../upload/[transformation]/...
    const uploadIndex = originalUrl.indexOf('/upload/');
    if (uploadIndex === -1) {
        // Fallback: try /image/upload/ pattern  
        const imageUploadIndex = originalUrl.indexOf('/image/upload/');
        if (imageUploadIndex !== -1) {
            const insertPos = imageUploadIndex + '/image/upload/'.length;
            // Kiểm tra xem đã có transformation chưa
            const afterUpload = originalUrl.substring(insertPos);
            if (afterUpload.match(/^[a-z]_/)) {
                // Đã có transformation → thay thế
                const nextSlash = originalUrl.indexOf('/', insertPos);
                if (nextSlash !== -1) {
                    return originalUrl.substring(0, insertPos) + transformString + originalUrl.substring(nextSlash);
                }
            }
            return originalUrl.substring(0, insertPos) + transformString + '/' + afterUpload;
        }
        return originalUrl;
    }

    const insertPos = uploadIndex + '/upload/'.length;
    const afterUpload = originalUrl.substring(insertPos);

    // Kiểm tra xem đã có transformation chưa
    if (afterUpload.match(/^[a-z]_/)) {
        const nextSlash = originalUrl.indexOf('/', insertPos);
        if (nextSlash !== -1) {
            return originalUrl.substring(0, insertPos) + transformString + originalUrl.substring(nextSlash);
        }
    }

    return originalUrl.substring(0, insertPos) + transformString + '/' + afterUpload;
};

/**
 * Presets tối ưu cho các trường hợp phổ biến
 */
export const ImagePresets = {
    // Avatar nhỏ (40x40)
    avatarSmall: (url) => optimizeCloudinaryUrl(url, {
        width: 80, height: 80, crop: 'fill', gravity: 'face', quality: 'auto:good'
    }),

    // Avatar medium (100x100)
    avatarMedium: (url) => optimizeCloudinaryUrl(url, {
        width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto:good'
    }),

    // Thumbnail recipe card (300x200)
    recipeThumbnail: (url) => optimizeCloudinaryUrl(url, {
        width: 600, height: 400, crop: 'fill', quality: 'auto:good'
    }),

    // Recipe detail image (full width)
    recipeDetail: (url) => optimizeCloudinaryUrl(url, {
        width: 800, quality: 'auto:good', crop: 'limit'
    }),

    // Post image
    postImage: (url) => optimizeCloudinaryUrl(url, {
        width: 600, quality: 'auto:good', crop: 'limit'
    }),

    // Category icon
    categoryIcon: (url) => optimizeCloudinaryUrl(url, {
        width: 200, height: 200, crop: 'fill', quality: 'auto'
    }),
};
