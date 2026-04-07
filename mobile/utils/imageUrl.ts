/**
 * Utility function để xử lý và normalize image/avatar URLs
 * Tự động resolve IP dựa trên môi trường (Android Emulator, iOS Simulator, Expo Go)
 * Thêm cache busting để đảm bảo ảnh được tải lại khi có thay đổi
 */

import { resolveApiBase } from '../config/api';

// Lấy base URL động (không bao gồm /api)
function getBaseUrl(): string {
  const apiBase = resolveApiBase('http://localhost:8080/api');
  // Loại bỏ /api để lấy base URL
  return apiBase.replace('/api', '');
}

/**
 * Sửa URL ảnh/avatar, thay thế IP cũ bằng IP mới và thêm cache busting
 * @param url - URL cần xử lý
 * @param updatedAt - Timestamp của lần cập nhật cuối (optional, dùng để cache busting)
 * @returns URL đã được sửa hoặc null nếu không hợp lệ
 */
export function normalizeImageUrl(url: string | null | undefined, updatedAt?: string | Date | null): string | null {
  if (!url) return null;
  
  // Nếu là data URI, trả về luôn
  if (url.startsWith('data:')) return url;
  
  // Kiểm tra xem có chứa đường dẫn file system không (C:/, D:/, etc.) - xử lý trước
  // Có thể là URL encoded (C:%5C...) hoặc plain path
  const decodedUrl = decodeURIComponent(url);
  if (/[A-Z]:[/\\]/.test(decodedUrl) || decodedUrl.includes('uploads\\') || decodedUrl.includes('uploads/')) {
    // Nếu là đường dẫn local, lấy tên file và tạo URL đúng
    const filename = decodedUrl.split(/[/\\]/).pop();
    if (filename) {
      // Tạo URL mới với /uploads/filename - dùng base URL động
      const baseUrl = getBaseUrl();
      return `${baseUrl}/uploads/${filename}`;
    } else {
      return null;
    }
  }
  
  // Fix common URL typos (httpps:// -> https://)
  if (url.includes('httpps://')) {
    url = url.replace(/httpps:\/\//gi, 'https://');
  }

  // Nếu là URL http/https hợp lệ
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Nếu là URL external (Unsplash, CDN, etc.), trả về trực tiếp không normalize
    // Chỉ normalize URL local (localhost, IP local, hoặc đường dẫn uploads)
    const isExternalUrl = url.includes('unsplash.com') || 
                          url.includes('pexels.com') || 
                          url.includes('cloudinary.com') ||
                          url.includes('cdn.') ||
                          (!url.includes('localhost') && 
                           !url.includes('127.0.0.1') && 
                           !url.includes('192.168.') && 
                           !url.includes('10.0.2.2') &&
                           !url.includes('/uploads/'));
    
    if (isExternalUrl) {
      // URL external, trả về trực tiếp (đã fix typo nếu có)
      return url;
    }
    
    // URL local, cần normalize
    let fixedUrl = url;
    
    // Nếu URL chứa IP cũ hoặc localhost, thay bằng base URL động
    const baseUrl = getBaseUrl();
    const baseUrlMatch = baseUrl.match(/https?:\/\/([^/:]+)/);
    const currentHost = baseUrlMatch ? baseUrlMatch[1] : null;
    
    if (currentHost) {
      // Thay thế các IP cũ hoặc localhost bằng host hiện tại
      // Pattern: http://[old-ip]:8080 hoặc http://localhost:8080
      fixedUrl = fixedUrl.replace(/https?:\/\/(?:192\.168\.\d+\.\d+|localhost|127\.0\.0\.1|10\.0\.2\.2)(?::\d+)?/, baseUrl);
    }
    
    // Kiểm tra xem có chứa đường dẫn file system không (C:/, D:/, etc.)
    if (/[A-Z]:[/\\]/.test(fixedUrl)) {
      // Sửa URL: lấy tên file và tạo URL đúng
      const filename = fixedUrl.split(/[/\\]/).pop();
      if (filename) {
        // Tạo URL mới với /uploads/filename
        fixedUrl = `${baseUrl}/uploads/${filename}`;
      } else {
        return null;
      }
    }
    
    // Thêm cache busting cho URL local
    let cacheBuster: string;
    if (updatedAt) {
      const timestamp = typeof updatedAt === 'string' 
        ? new Date(updatedAt).getTime() 
        : updatedAt.getTime();
      cacheBuster = `?v=${timestamp}`;
    } else {
      const now = Date.now();
      const minuteTimestamp = Math.floor(now / 60000) * 60000;
      cacheBuster = `?v=${minuteTimestamp}`;
    }
    
    // Kiểm tra xem URL đã có query parameters chưa
    if (fixedUrl.includes('?')) {
      if (!fixedUrl.includes('?v=') && !fixedUrl.includes('&v=')) {
        fixedUrl = `${fixedUrl}&v=${cacheBuster.split('=')[1]}`;
      }
    } else {
      fixedUrl = `${fixedUrl}${cacheBuster}`;
    }
    
    return fixedUrl;
  }
  
  return null;
}

