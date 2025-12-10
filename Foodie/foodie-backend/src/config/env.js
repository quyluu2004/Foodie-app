// ⚠️ QUAN TRỌNG: File này PHẢI được import đầu tiên trong server.js
// để đảm bảo dotenv được load trước khi import bất kỳ module nào sử dụng process.env

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env từ thư mục gốc của project (foodie-backend/)
// __dirname = foodie-backend/src/config
// envPath = foodie-backend/.env
const envPath = path.join(__dirname, '../../.env');
console.log('🔍 Attempting to load .env from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('⚠️  Không thể load file .env từ:', envPath);
  console.warn('   Error:', result.error.message);
  console.warn('   Đang thử load .env từ thư mục hiện tại...');
  const fallbackResult = dotenv.config(); // Fallback: thử load từ thư mục hiện tại
  if (fallbackResult.error) {
    console.error('❌ Không thể load .env từ thư mục hiện tại:', fallbackResult.error.message);
  } else {
    console.log('✅ Đã load .env từ thư mục hiện tại');
  }
} else {
  console.log('✅ Đã load file .env từ:', envPath);
}

// Debug: Kiểm tra Cloudinary config
console.log('🔍 Cloudinary Environment Variables Check:', {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? `✅ ${process.env.CLOUDINARY_CLOUD_NAME}` : '❌ NOT SET',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ NOT SET',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ NOT SET',
});

// Export để các module khác có thể verify
export default {
  loaded: true,
  envPath
};

