/**
 * In-Memory Response Caching Middleware
 * Cache đơn giản không cần Redis, phù hợp cho ứng dụng nhỏ-trung bình
 */

// Cache store đơn giản trong memory
const cache = new Map();

// Cấu hình mặc định
const DEFAULT_TTL = 5 * 60 * 1000; // 5 phút
const MAX_CACHE_SIZE = 500; // Tối đa 500 entries

/**
 * Xóa cache entries đã hết hạn
 */
const cleanExpiredEntries = () => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now > value.expiry) {
            cache.delete(key);
        }
    }
};

// Tự động dọn cache mỗi 5 phút
setInterval(cleanExpiredEntries, 5 * 60 * 1000);

/**
 * Tạo cache key từ request
 */
const generateCacheKey = (req) => {
    const queryString = JSON.stringify(req.query || {});
    return `${req.method}:${req.originalUrl}:${queryString}`;
};

/**
 * Middleware cache response
 * @param {number} ttl - Thời gian cache (ms), mặc định 5 phút
 * @param {function} keyGenerator - Custom key generator (optional)
 * 
 * @example
 * // Cache 5 phút (mặc định)
 * router.get('/categories', cacheResponse(), getCategories);
 * 
 * // Cache 30 phút
 * router.get('/popular', cacheResponse(30 * 60 * 1000), getPopular);
 */
export const cacheResponse = (ttl = DEFAULT_TTL, keyGenerator = null) => {
    return (req, res, next) => {
        // Chỉ cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Không cache nếu có Authorization header (authenticated requests)
        // Trừ khi route được đánh dấu là cacheable cho authenticated users
        if (req.headers.authorization && !req.cacheAuthenticated) {
            return next();
        }

        const key = keyGenerator ? keyGenerator(req) : generateCacheKey(req);
        const cached = cache.get(key);

        if (cached && Date.now() < cached.expiry) {
            // Trả về cached response
            res.setHeader('X-Cache', 'HIT');
            return res.status(cached.statusCode).json(cached.data);
        }

        // Override res.json để capture response
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            // Chỉ cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Kiểm tra cache size
                if (cache.size >= MAX_CACHE_SIZE) {
                    // Xóa entry cũ nhất
                    const firstKey = cache.keys().next().value;
                    cache.delete(firstKey);
                }

                cache.set(key, {
                    data,
                    statusCode: res.statusCode,
                    expiry: Date.now() + ttl,
                });
            }

            res.setHeader('X-Cache', 'MISS');
            return originalJson(data);
        };

        next();
    };
};

/**
 * Xóa cache theo pattern
 * @param {string} pattern - Pattern để match keys (partial match)
 * 
 * @example
 * // Xóa tất cả cache liên quan đến categories
 * invalidateCache('/api/categories');
 */
export const invalidateCache = (pattern) => {
    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key);
        }
    }
};

/**
 * Xóa toàn bộ cache
 */
export const clearAllCache = () => {
    cache.clear();
};

/**
 * Lấy thống kê cache
 */
export const getCacheStats = () => ({
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    keys: Array.from(cache.keys()),
});
