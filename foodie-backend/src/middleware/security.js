/**
 * Security Middleware
 * Bao gồm: HTTPS enforcement, security headers bổ sung
 */

/**
 * Middleware bắt buộc HTTPS trong production
 * Chuyển hướng HTTP → HTTPS
 */
export const enforceHttps = (req, res, next) => {
    // Chỉ enforce trong production
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }

    // Kiểm tra x-forwarded-proto (khi chạy sau reverse proxy như Nginx, Heroku)
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

    if (!isHttps) {
        // Redirect sang HTTPS
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }

    next();
};

/**
 * Middleware thêm security headers bổ sung (ngoài Helmet)
 */
export const additionalSecurityHeaders = (req, res, next) => {
    // Ngăn browser cache sensitive data
    if (req.path.includes('/api/auth') || req.path.includes('/api/premium')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }

    // Ngăn clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Ngăn MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    next();
};
