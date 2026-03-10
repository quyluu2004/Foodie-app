import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env từ thư mục gốc của project (foodie-backend/)
const envPath = path.join(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  // Fallback: thử load từ thư mục hiện tại
  const fallbackResult = dotenv.config();
  if (fallbackResult.error) {
    console.error('❌ Không thể load file .env');
  }
}

// ==============================
// Validate biến môi trường bắt buộc
// ==============================
const requiredVars = ['MONGO_URI', 'JWT_SECRET'];
const optionalVars = ['JWT_REFRESH_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'GEMINI_API_KEY'];

const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`❌ Thiếu biến môi trường bắt buộc: ${missing.join(', ')}`);
  console.error('   Vui lòng tạo file .env dựa trên .env.example');
  process.exit(1);
}

// Kiểm tra JWT_SECRET đủ mạnh (ít nhất 32 ký tự)
if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET quá ngắn! Phải có ít nhất 32 ký tự.');
  console.error('   Tạo bằng: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

// Nếu không có JWT_REFRESH_SECRET, tự động dùng JWT_SECRET + suffix
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET + '_refresh';
  console.warn('⚠️ JWT_REFRESH_SECRET chưa được thiết lập. Đang dùng giá trị tự sinh.');
}

// Set NODE_ENV mặc định
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Chỉ log chi tiết trong development
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Đã load environment config');
  console.log('   Environment:', process.env.NODE_ENV);
  console.log('   Cloudinary:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ configured' : '⚠️ not set');
  console.log('   Gemini AI:', process.env.GEMINI_API_KEY ? '✅ configured' : '⚠️ not set');
}

export default {
  loaded: true,
  envPath
};
