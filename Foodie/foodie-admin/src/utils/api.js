import axios from 'axios';

// Sử dụng localhost vì web admin chạy trên cùng máy với backend
// Không cần đổi IP khi đổi WiFi
export const API_URL = "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm token nếu có
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xử lý lỗi 401 (Unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      // Redirect đến login page nếu chưa ở đó
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Xử lý lỗi kết nối (network error)
    if (!error.response) {
      console.error('❌ Network Error:', {
        message: error.message,
        code: error.code,
        url: error.config?.url
      });
      
      // Nếu là lỗi kết nối và không phải đang ở login page
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        console.error('⚠️ Không thể kết nối đến backend server!');
        console.error('💡 Hãy đảm bảo backend đang chạy tại: http://localhost:8080');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

