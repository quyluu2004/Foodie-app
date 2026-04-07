import axios from "axios";
import { Platform } from "react-native";
import { storage } from "./storage"; // Sử dụng storage từ contexts/storage.ts
import { resolveApiBase } from "../config/api";

// BASE_URL: dùng localhost để tự động resolve IP dựa trên môi trường
// - Android Emulator: tự động chuyển thành 10.0.2.2
// - iOS Simulator: giữ nguyên localhost
// - Expo Go / Thiết bị thật: tự động lấy IP từ Expo Constants
const BASE_URL = resolveApiBase("http://localhost:8080/api");

if (__DEV__) console.log('🌐 API Base URL:', BASE_URL);

// --- FormData Upload Helper ---
// Tách logic tạo axios instance cho FormData (tránh lặp lại)
const createFormDataRequest = (timeout = 30000) => {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  instance.interceptors.request.use(async (config) => {
    try {
      const token = await storage.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (_) { }
    return config;
  });
  return instance;
};

// --- Khởi tạo Axios ---
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Flag để tránh refresh loop
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use(async (config) => {
  try {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) { }
  return config;
});

// Response interceptor: auto-refresh token + xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = error.config?.url;

    // Auto-refresh token khi bị 401
    if (status === 401 && !originalRequest._retry) {
      // Kiểm tra xem có refresh token không
      const refreshToken = await storage.getRefreshToken();

      if (refreshToken) {
        if (isRefreshing) {
          // Đang refresh rồi → thêm vào queue chờ
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const newToken = data.token;
          const newRefreshToken = data.refreshToken;

          await storage.saveToken(newToken);
          if (newRefreshToken) {
            await storage.saveRefreshToken(newRefreshToken);
          }

          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          await storage.clear();
          error.isUnauthenticated = true;
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Không có refresh token
        error.isUnauthenticated = true;
      }
    } else if (status === 429) {
      error.isRateLimited = true;
      error.rateLimitMessage = error.response?.data?.message ||
        'Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một chút rồi thử lại.';
      const retryAfter = error.response?.headers?.['retry-after'];
      if (retryAfter) error.retryAfter = parseInt(retryAfter, 10);
    }

    return Promise.reject(error);
  }
);

// --- AUTH API ---
export const authAPI = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  register: (name: string, email: string, password: string) => api.post("/auth/register", { name, email, password }),
  googleAuth: (idToken: string) => api.post("/auth/google", { token: idToken }),
  refreshToken: (refreshToken: string) => api.post("/auth/refresh-token", { refreshToken }),
  updateProfile: (data?: {
    name?: string;
    phone?: string;
    birthDate?: string | Date | null;
    gender?: string;
    bio?: string;
    socialLinks?: any;
    avatarUrl?: string;
    isPrivate?: boolean;
  }) => {
    return api.put("/auth/profile", data || {});
  },
  getUserById: (userId: string) => {
    return api.get(`/auth/user/${userId}`);
  },
  getCurrentUser: () => {
    return api.get("/auth/me");
  },
};

// --- RECIPE API ---
export const recipeAPI = {
  // Lấy tất cả recipes với pagination và filter
  getAll: (page = 1, limit = 20, category?: string, status?: string, search?: string, difficulty?: string, minRating?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    if (search && search.trim()) params.append('q', search.trim());
    if (difficulty) params.append('difficulty', difficulty);
    if (minRating !== undefined && minRating !== null) params.append('minRating', minRating.toString());
    const query = params.toString();
    return api.get(`/recipes${query ? `?${query}` : ''}`);
  },
  // Lấy recipe theo ID
  getById: (id: string) => api.get(`/recipes/${id}`),
  // Lấy recipes theo category
  getByCategory: (category: string, page = 1, limit = 20) =>
    api.get(`/recipes/category/${category}?page=${page}&limit=${limit}`),
  // Tạo recipe mới (chỉ text data, không có video)
  create: (recipeData: any) => {
    return api.post("/recipes", recipeData);
  },
  // Upload video lên Cloudinary
  uploadVideo: (formData: FormData) => createFormDataRequest(120000).post("/recipes/upload-video", formData),
  // Cập nhật media (video) cho recipe
  updateMedia: (recipeId: string, mediaData: {
    videoUrl: string;
    videoThumbnail?: string;
    videoDuration?: number;
    videoSize?: number;
    videoFormat?: string;
    videoQualities?: any[];
  }) => {
    return api.patch(`/recipes/${recipeId}/media`, mediaData);
  },
  // Cập nhật recipe
  update: (id: string, formData: FormData) => createFormDataRequest().put(`/recipes/${id}`, formData),
  // Xóa recipe
  delete: (id: string) => api.delete(`/recipes/${id}`),
  // Legacy: giữ lại để tương thích
  favorite: (id: string) => api.post(`/recipes/${id}/favorite`),
  // Lấy công thức đã xem
  getViewed: (page = 1, limit = 20) =>
    api.get(`/recipes/viewed?page=${page}&limit=${limit}`),
  // Lấy gợi ý công thức dựa trên món đã lưu
  getRecommended: (page = 1, limit = 20) =>
    api.get(`/recipes/recommended?page=${page}&limit=${limit}`),
};

// --- FAVORITES API (compat with hooks expecting favoriteAPI) ---
export const favoriteAPI = {
  getAll: () => api.get('/favorites'),
  add: (id: string) => api.post(`/favorites/toggle/${id}`),
};

// --- POST API ---
export const postAPI = {
  // Lấy danh sách tất cả bài đăng (Feed)
  getAll: (page = 1, limit = 10) => api.get(`/posts?page=${page}&limit=${limit}`),

  // Lấy bài đăng theo ID
  getById: (id: string) => api.get(`/posts/${id}`),

  // Lấy bài đăng theo user
  getByUser: (userId: string, page = 1, limit = 10) =>
    api.get(`/posts/user/${userId}?page=${page}&limit=${limit}`),

  // Tạo bài đăng mới (FormData với image)
  create: (formData: FormData) => {
    return createFormDataRequest().post("/posts", formData);
  },

  // Like/Unlike bài đăng
  toggleLike: (id: string) => api.post(`/posts/${id}/like`),

  // Thêm bình luận
  addComment: (id: string, text: string) =>
    api.post(`/posts/${id}/comments`, { text }),

  // Cập nhật bài đăng
  update: (id: string, formData: FormData) => createFormDataRequest().put(`/posts/${id}`, formData),

  // Xóa bài đăng
  delete: (id: string) => api.delete(`/posts/${id}`),

  // Like/Unlike comment
  likeComment: (postId: string, commentId: string) =>
    api.post(`/posts/${postId}/comments/${commentId}/like`),

  // Reply to comment
  replyComment: (postId: string, commentId: string, text: string) =>
    api.post(`/posts/${postId}/comments/${commentId}/replies`, { text }),

  // Like/Unlike reply
  likeReply: (postId: string, commentId: string, replyId: string) =>
    api.post(`/posts/${postId}/comments/${commentId}/replies/${replyId}/like`),

  // Lưu/Bỏ lưu bài đăng
  toggleSave: (postId: string) => api.post(`/posts/${postId}/save`),

  // Lấy danh sách bài đăng đã lưu
  getSavedPosts: (page?: number, limit?: number) =>
    api.get(`/posts/saved/all?page=${page || 1}&limit=${limit || 10}`),
};

// --- STATS API ---
export const statsAPI = {
  // Thống kê công thức đã lưu
  getSavedRecipesStats: () => api.get("/stats/saved-recipes"),

  // Thống kê đã nấu
  getCookedStats: () => api.get("/stats/cooked"),

  // Thống kê hoạt động
  getActivityStats: () => api.get("/stats/activity"),

  // Danh sách người đã like
  getLikesReceived: () => api.get("/stats/likes-received"),

  // Danh sách người đã comment
  getCommentsReceived: () => api.get("/stats/comments-received"),

  // Thống kê Creator Dashboard
  getCreatorStats: () => api.get("/stats/creator"),
};

// --- NOTIFICATION API ---
export const notificationAPI = {
  // Lấy tất cả thông báo của user
  getAll: (page = 1, limit = 20, unreadOnly = false) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (unreadOnly) params.append('unreadOnly', 'true');
    return api.get(`/notifications?${params.toString()}`);
  },

  // Đánh dấu thông báo đã đọc
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),

  // Đánh dấu tất cả thông báo đã đọc
  markAllAsRead: () => api.put('/notifications/read-all'),

  // Xóa thông báo
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// --- REPORT API ---
export const reportAPI = {
  // Tạo báo cáo
  create: (data: {
    type: 'recipe' | 'post' | 'comment' | 'user';
    targetId: string;
    reason: string;
    description?: string;
  }) => api.post('/reports', data),

  // Lấy danh sách báo cáo của user
  getMyReports: (status?: 'pending' | 'resolved') => {
    const params = status ? `?status=${status}` : '';
    return api.get(`/reports/my${params}`);
  },
};

// --- FOLLOW API ---
export const followAPI = {
  // Theo dõi/Bỏ theo dõi
  toggleFollow: (userId: string) => api.post(`/follow/${userId}`),

  // Kiểm tra trạng thái follow
  checkFollowStatus: (userId: string) => api.get(`/follow/${userId}/status`),

  // Lấy danh sách đang theo dõi
  getFollowing: () => api.get("/follow/following"),

  // Lấy danh sách người theo dõi
  getFollowers: () => api.get("/follow/followers"),
};

// --- CATEGORY API ---
export const categoryAPI = {
  // Lấy tất cả categories
  getAll: () => api.get("/categories"),
  // Lấy category theo ID
  getById: (id: string) => api.get(`/categories/${id}`),
  // Tạo category mới (admin only)
  create: (data: { name: string; description?: string; imageUrl?: string }) =>
    api.post("/categories", data),
  // Cập nhật category (admin only)
  update: (id: string, data: { name?: string; description?: string; imageUrl?: string }) =>
    api.put(`/categories/${id}`, data),
  // Xóa category (admin only)
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// --- LIKE API (cho recipes) ---
export const likeAPI = {
  // Like/Unlike recipe
  toggleLike: (recipeId: string) => api.post(`/like/${recipeId}`),
  // Unlike recipe
  unlike: (recipeId: string) => api.delete(`/like/${recipeId}`),
  // Lấy danh sách likes của recipe
  getLikes: (recipeId: string) => api.get(`/like/${recipeId}`),
};

// --- SAVE API (cho recipes) ---
export const saveAPI = {
  // Check xem recipe đã được save chưa
  checkSaved: (recipeId: string) => api.get(`/saved/check/${recipeId}`),
  // Save/Unsave recipe (toggle - backend tự động toggle)
  toggleSave: (recipeId: string) => api.post(`/saved/${recipeId}`),
  // Unsave recipe
  unsave: (recipeId: string) => api.delete(`/saved/${recipeId}`),
  // Lấy danh sách saved recipes của user
  getSavedRecipes: (userId: string) => api.get(`/saved/user/${userId}`),
};

// --- COMMENT API (cho recipes) ---
export const commentAPI = {
  // Thêm comment vào recipe (hỗ trợ upload ảnh)
  addComment: (recipeId: string, text: string, imageUri?: string | null) => {
    if (imageUri) {
      // Xử lý URI cho từng platform
      // iOS: cần loại bỏ file:// prefix
      // Android: giữ nguyên URI (có thể là content:// hoặc file://)
      let processedUri = imageUri;
      if (Platform.OS === 'ios' && imageUri.startsWith('file://')) {
        processedUri = imageUri.replace('file://', '');
      }
      // Trên Android, giữ nguyên URI (content:// hoặc file:// đều được hỗ trợ)

      // Lấy tên file và type từ URI
      // Nếu là content:// URI, dùng tên mặc định
      let filename = 'comment.jpg';
      if (imageUri.includes('/')) {
        const uriParts = imageUri.split('/');
        const lastPart = uriParts[uriParts.length - 1];
        if (lastPart && lastPart.includes('.')) {
          filename = lastPart.split('?')[0]; // Loại bỏ query params nếu có
        }
      }
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // Tạo FormData nếu có ảnh
      const formData = new FormData();
      formData.append('text', text);
      formData.append('image', {
        uri: processedUri,
        name: filename,
        type: type,
      } as any);

      return createFormDataRequest().post(`/comment/${recipeId}`, formData);
    } else {
      // Gửi text thông thường nếu không có ảnh
      return api.post(`/comment/${recipeId}`, { text });
    }
  },
  // Lấy danh sách comments của recipe
  getComments: (recipeId: string) => api.get(`/comment/${recipeId}`),
  // Xóa comment
  deleteComment: (commentId: string) => api.delete(`/comment/${commentId}`),
  // Like/Unlike comment
  likeComment: (commentId: string) => api.post(`/comment/${commentId}/like`),
  // Reply to comment
  replyComment: (commentId: string, text: string) =>
    api.post(`/comment/${commentId}/reply`, { text }),
};

// --- RATING API (cho recipes) ---
export const ratingAPI = {
  // Đánh giá công thức (tạo hoặc cập nhật)
  rateRecipe: (recipeId: string, rating: number, notes?: string) =>
    api.post(`/rating/${recipeId}`, { rating, notes }),
  // Lấy đánh giá của user cho recipe
  getMyRating: (recipeId: string) => api.get(`/rating/${recipeId}/my`),
  // Lấy tất cả đánh giá của recipe
  getRecipeRatings: (recipeId: string, page = 1, limit = 10) =>
    api.get(`/rating/${recipeId}?page=${page}&limit=${limit}`),
  // Xóa đánh giá
  deleteRating: (recipeId: string) => api.delete(`/rating/${recipeId}`),
};

// --- MESSAGE API ---
export const messageAPI = {
  // Gửi tin nhắn cho admin (có thể có hoặc không có auth)
  sendMessage: (subject: string, message: string, type?: string, email?: string, name?: string) => {
    const payload: any = { subject, message, type };
    // Nếu có email và name, thêm vào payload (cho trường hợp chưa đăng nhập)
    if (email) payload.email = email;
    if (name) payload.name = name;
    return api.post('/messages', payload);
  },
  // Lấy tin nhắn của user (cần đăng nhập)
  getMyMessages: () => api.get('/messages/my-messages'),
  // Lấy tin nhắn theo email (không cần đăng nhập)
  getMessagesByEmail: (email: string) => api.get(`/messages/by-email?email=${encodeURIComponent(email)}`),
};

// --- USER API (Password management) ---
export const userAPI = {
  // Đổi mật khẩu (cần đăng nhập)
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword }),
  // Yêu cầu reset mật khẩu (không cần đăng nhập, dùng email)
  requestPasswordReset: (email: string, reason?: string, name?: string) =>
    api.post('/auth/reset-password', { email, reason, name }),
};

// --- CHAT API ---
export const chatAPI = {
  // Lấy danh sách conversations
  getConversations: () => api.get('/chat/conversations'),
  // Lấy tổng số tin nhắn chưa đọc
  getUnreadCount: () => api.get('/chat/unreadCount'),
  // Tạo hoặc lấy conversation với một user
  getOrCreateConversation: (userId: string) => api.get(`/chat/conversation/${userId}`),
  // Lấy hoặc tạo conversation với admin (cho user)
  getOrCreateAdminConversation: () => api.get('/chat/admin/conversation'),
  // Lấy tin nhắn trong conversation với một user
  getMessages: (userId: string) => api.get(`/chat/messages/${userId}`),
  // Gửi tin nhắn cho một user (text only - image được xử lý riêng trong component)
  sendMessage: (userId: string, text: string, replyTo?: string) => api.post(`/chat/messages/${userId}`, { text, replyTo }),
  // Đánh dấu tin nhắn đã đọc
  markAsRead: (userId: string) => api.put(`/chat/messages/${userId}/read`),
  // Thêm/xóa reaction
  toggleReaction: (messageId: string, emoji: string) => api.post(`/chat/messages/${messageId}/reaction`, { emoji }),
};

// --- HOMEPAGE API ---
export const homepageAPI = {
  // Lấy tất cả homepage sections
  getSections: () => api.get('/homepage/sections'),
  // Lấy section theo ID
  getSection: (id: string) => api.get(`/homepage/sections/${id}`),
};

// --- PREMIUM & MONETIZATION API ---
export const premiumAPI = {
  // Creator: Set recipe là premium
  setRecipePremium: (recipeId: string, isPremium: boolean, price?: number) =>
    api.put(`/premium/recipe/${recipeId}/premium`, { isPremium, price }),

  // User: Mua premium recipe
  purchaseRecipe: (recipeId: string) => api.post(`/premium/recipe/${recipeId}/purchase`),

  // Kiểm tra đã mua recipe chưa
  checkPurchaseStatus: (recipeId: string) => api.get(`/premium/recipe/${recipeId}/purchase-status`),

  // Lấy danh sách recipes đã mua
  getMyPurchases: (page = 1, limit = 20) => api.get(`/premium/purchases?page=${page}&limit=${limit}`),

  // Donate/Tip cho creator
  donateToCreator: (creatorId: string, amount: number, message?: string) =>
    api.post(`/premium/donate/${creatorId}`, { amount, message }),

  // Lấy lịch sử giao dịch
  getMyTransactions: (page = 1, limit = 20, type?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (type) params.append('type', type);
    return api.get(`/premium/transactions?${params.toString()}`);
  },

  // Lấy số xu hiện tại
  getMyCoins: () => api.get('/premium/coins'),

  // Nạp xu
  topUpCoins: (amount: number) => api.post('/premium/topup', { amount }),
};

// --- CREATOR REQUEST API ---
export const creatorRequestAPI = {
  // Gửi yêu cầu đăng ký creator
  createRequest: (data: {
    fullName: string;
    email: string;
    phone?: string;
    bio?: string;
    experience?: string;
    specialties?: string[];
    socialLinks?: {
      facebook?: string;
      instagram?: string;
      youtube?: string;
      website?: string;
    };
    motivation: string;
  }) => api.post('/creator-requests', data),

  // Lấy yêu cầu của mình
  getMyRequest: () => api.get('/creator-requests/my'),
};

// --- Export storage và api để các file khác dùng được ---
export { storage, api };
