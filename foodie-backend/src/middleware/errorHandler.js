/**
 * Centralized Error Handler Middleware
 * Xử lý tất cả errors từ controllers một cách thống nhất
 */

/**
 * Async handler wrapper - bọc async functions để tự bắt lỗi
 * Dùng thay cho try/catch lặp lại trong mỗi controller
 * 
 * @example
 * router.get('/recipes', asyncHandler(async (req, res) => {
 *   const recipes = await Recipe.find();
 *   res.json(recipes);
 * }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom Error class cho API errors
 */
export class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true; // Phân biệt operational error vs programming error
    }

    static badRequest(message, details) {
        return new ApiError(400, message, details);
    }

    static unauthorized(message = 'Bạn cần đăng nhập') {
        return new ApiError(401, message);
    }

    static forbidden(message = 'Bạn không có quyền truy cập') {
        return new ApiError(403, message);
    }

    static notFound(message = 'Không tìm thấy tài nguyên') {
        return new ApiError(404, message);
    }

    static conflict(message) {
        return new ApiError(409, message);
    }

    static internal(message = 'Lỗi hệ thống. Vui lòng thử lại sau.') {
        return new ApiError(500, message);
    }
}

/**
 * Global Error Handler Middleware
 * Đặt ở cuối middleware chain trong server.js
 */
export const errorHandler = (err, req, res, next) => {
    // Log error (chỉ log đầy đủ trong development)
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', {
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode,
            path: req.path,
            method: req.method,
        });
    } else {
        // Production: chỉ log message và path
        console.error(`❌ [${req.method}] ${req.path}: ${err.message}`);
    }

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            success: false,
            message: `Dữ liệu không hợp lệ: ${messages.join(', ')}`,
        });
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(409).json({
            success: false,
            message: `${field} đã tồn tại`,
        });
    }

    // Mongoose Cast Error (invalid ObjectId)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({
            success: false,
            message: 'ID không hợp lệ',
        });
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token đã hết hạn',
        });
    }

    // Multer Errors (file upload)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File quá lớn',
        });
    }

    // Custom ApiError
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.details && process.env.NODE_ENV === 'development' ? { details: err.details } : {}),
        });
    }

    // Unknown/Programming Errors - không leak thông tin
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500
        ? 'Lỗi hệ thống. Vui lòng thử lại sau.'
        : err.message;

    res.status(statusCode).json({
        success: false,
        message,
    });
};

/**
 * 404 Not Found Handler
 * Đặt sau tất cả routes
 */
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Không tìm thấy route: ${req.method} ${req.originalUrl}`,
    });
};
