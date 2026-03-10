/**
 * XSS Sanitization Middleware
 * Làm sạch input để ngăn chặn Cross-Site Scripting (XSS)
 */

// Hàm sanitize cơ bản - escape HTML entities
const escapeHtml = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Hàm sanitize sâu - xóa các script tags và event handlers
const deepSanitize = (str) => {
    if (typeof str !== 'string') return str;
    return str
        // Xóa script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Xóa event handlers (onclick, onerror, etc.)
        .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
        // Xóa javascript: protocol
        .replace(/javascript\s*:/gi, '')
        // Xóa data: protocol (có thể dùng để inject)
        .replace(/data\s*:[^,]*,/gi, '')
        // Xóa vbscript: protocol
        .replace(/vbscript\s*:/gi, '')
        .trim();
};

// Hàm sanitize đệ quy cho object/array
const sanitizeValue = (value, options = {}) => {
    if (value === null || value === undefined) return value;

    if (typeof value === 'string') {
        let sanitized = deepSanitize(value);
        if (options.escapeHtml) {
            sanitized = escapeHtml(sanitized);
        }
        return sanitized;
    }

    if (Array.isArray(value)) {
        return value.map(item => sanitizeValue(item, options));
    }

    if (typeof value === 'object') {
        const sanitized = {};
        for (const key of Object.keys(value)) {
            sanitized[key] = sanitizeValue(value[key], options);
        }
        return sanitized;
    }

    return value;
};

// Các field không cần sanitize (ví dụ: password, URL)
const SKIP_FIELDS = ['password', 'passwordHash', 'currentPassword', 'newPassword', 'oldPassword', 'token', 'refreshToken'];
const URL_FIELDS = ['avatarUrl', 'imageUrl', 'videoUrl', 'videoThumbnail', 'website'];

/**
 * Middleware sanitize input
 * Áp dụng cho req.body, req.query, req.params
 */
export const sanitizeInput = (req, res, next) => {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
        for (const key of Object.keys(req.body)) {
            // Bỏ qua password fields
            if (SKIP_FIELDS.includes(key)) continue;
            // Bỏ qua URL fields (chỉ sanitize nhẹ)
            if (URL_FIELDS.includes(key)) {
                if (typeof req.body[key] === 'string') {
                    req.body[key] = deepSanitize(req.body[key]);
                }
                continue;
            }
            req.body[key] = sanitizeValue(req.body[key], { escapeHtml: false });
        }
    }

    // Sanitize query params
    if (req.query && typeof req.query === 'object') {
        for (const key of Object.keys(req.query)) {
            req.query[key] = sanitizeValue(req.query[key], { escapeHtml: true });
        }
    }

    // Sanitize URL params
    if (req.params && typeof req.params === 'object') {
        for (const key of Object.keys(req.params)) {
            if (typeof req.params[key] === 'string') {
                req.params[key] = deepSanitize(req.params[key]);
            }
        }
    }

    next();
};
