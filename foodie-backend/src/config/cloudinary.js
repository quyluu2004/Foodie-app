// ⚠️ QUAN TRỌNG: Đảm bảo dotenv đã được load trước khi import module này
// (dotenv.config() phải được gọi trong server.js TRƯỚC khi import routes)

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chỉ config Cloudinary nếu có đủ thông tin
const hasCloudinaryConfig = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

// Debug: Log để kiểm tra
console.log('🔍 Cloudinary Config Check:', {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '✅ SET' : '❌ NOT SET',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ NOT SET',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ NOT SET',
  hasCloudinaryConfig: hasCloudinaryConfig ? '✅ YES' : '❌ NO'
});

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('✅ Cloudinary đã được cấu hình');
} else {
  console.warn('⚠️  Cloudinary chưa được cấu hình. Upload ảnh sẽ lưu local.');
  console.warn('   Thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET vào .env');
}

// Tạo storage: Cloudinary nếu có config
// ⚠️ QUAN TRỌNG: Video KHÔNG BAO GIỜ lưu vào server disk, chỉ upload lên Cloudinary
let recipeStorage;
let avatarStorage;
let videoStorage;

if (hasCloudinaryConfig) {
  recipeStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'foodie/recipes',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
    }
  });

  avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'foodie/avatars',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }]
    }
  });

  // Video storage với auto transformation
  // ⚠️ CHỈ DÙNG CLOUDINARY, KHÔNG CÓ FALLBACK LOCAL STORAGE
  videoStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'foodie/videos',
      resource_type: 'video',
      allowed_formats: ['mp4', 'mov'],
      // Tự động tạo multiple qualities và thumbnail
      transformation: [
        {
          quality: 'auto',
          fetch_format: 'auto',
        }
      ],
      // Tự động tạo thumbnail từ frame đầu tiên (QUAN TRỌNG: phải tạo thumbnail)
      eager: [
        {
          format: 'jpg',
          width: 800,
          height: 800,
          crop: 'fill',
          quality: 'auto',
          start_offset: 0 // Lấy frame đầu tiên (0 giây)
        }
      ],
      // Tự động tạo multiple video qualities
      eager_async: false, // false = đợi thumbnail được tạo xong trước khi trả về
      // Tạo HLS streaming format
      format: 'mp4',
    }
  });
} else {
  // Fallback: Local disk storage (CHỈ CHO ẢNH VÀ AVATAR, KHÔNG CHO VIDEO)
  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = file.originalname.split('.').pop();
      cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
    }
  });
  
  recipeStorage = diskStorage;
  avatarStorage = diskStorage;
  // ⚠️ VIDEO KHÔNG CÓ FALLBACK - PHẢI CÓ CLOUDINARY CONFIG
  // Nếu không có Cloudinary config, videoStorage sẽ là null và sẽ reject upload
  videoStorage = null;
}

export { cloudinary, recipeStorage, avatarStorage, videoStorage };




