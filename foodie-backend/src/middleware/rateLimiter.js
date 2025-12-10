import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * Giới hạn 500 requests mỗi 15 phút cho mỗi IP (đã tăng từ 300)
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs (tăng từ 300)
  message: {
    success: false,
    message: 'Quá nhiều requests từ IP này, vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/' || req.path === '/api';
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Giới hạn 20 requests mỗi 15 phút cho mỗi IP (đã tăng từ 10)
 * Bỏ qua các requests thành công để chỉ đếm failed attempts
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs (tăng từ 10)
  message: {
    success: false,
    message: 'Quá nhiều lần thử đăng nhập/đăng ký, vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests
});

/**
 * Rate limiter for AI endpoints (expensive operations)
 * Giới hạn 100 requests mỗi giờ cho mỗi IP (đã tăng từ 50)
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 100 requests per hour (tăng từ 50)
  message: {
    success: false,
    message: 'Bạn đã sử dụng hết lượt AI chat trong giờ này. Vui lòng thử lại sau.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for file upload endpoints
 * Giới hạn 50 uploads mỗi giờ cho mỗi IP (đã tăng từ 30)
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 uploads per hour (tăng từ 30)
  message: {
    success: false,
    message: 'Bạn đã upload quá nhiều file trong giờ này. Vui lòng thử lại sau.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

