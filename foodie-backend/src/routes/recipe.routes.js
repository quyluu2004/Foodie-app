import { Router } from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { adminAuth } from "../middleware/adminAuth.js";
// Rate limiting đã tắt
// import { uploadLimiter } from "../middleware/rateLimiter.js";
import { videoStorage } from "../config/cloudinary.js";
import {
  validateCreateRecipe,
  validateUpdateRecipe,
  validateObjectId,
  validatePagination,
} from "../middleware/validate.js";
import {
  createRecipe,
  listRecipes,
  getRecipeById,
  getRecipesByCategory,
  updateRecipe,
  deleteRecipe,
  approveRecipe,
  rejectRecipe,
  getViewedRecipes,
  getRecommendedRecipes,
  updateRecipeMedia,
} from "../controllers/recipeController.js";

// ⚙️ Cấu hình upload video (CHỈ CÓ VIDEO, KHÔNG CÓ ẢNH)
// ⚠️ QUAN TRỌNG: Video CHỈ upload lên Cloudinary, KHÔNG lưu vào server disk
console.log('🔍 Recipe Routes - videoStorage check:', {
  videoStorage: videoStorage ? '✅ NOT NULL' : '❌ NULL',
  type: typeof videoStorage,
  processEnv: {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '✅ SET' : '❌ NOT SET',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ NOT SET',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ NOT SET',
  }
});

if (!videoStorage) {
  console.error('❌ CRITICAL: videoStorage is null! Cloudinary must be configured for video uploads.');
  console.error('   Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env');
  console.error('   Current process.env values:', {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'UNDEFINED',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 'UNDEFINED',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'SET (hidden)' : 'UNDEFINED',
  });
}

// Tạo upload middleware - chỉ tạo nếu videoStorage không null
let upload;
if (videoStorage) {
  upload = multer({
    storage: videoStorage,
    limits: { fileSize: 300 * 1024 * 1024 }, // 300MB
    fileFilter: (req, file, cb) => {
      // Chỉ cho phép video formats: MP4, MOV
      const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
      const allowedExtensions = ['mp4', 'mov'];
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      
      if (file.mimetype && allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else if (fileExtension && allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error("Chỉ cho phép tải lên file video (MP4, MOV)"), false);
      }
    },
  });
} else {
  // Nếu videoStorage null, tạo middleware reject ngay
  upload = {
    single: (fieldname) => {
      return (req, res, next) => {
        console.error('❌ ERROR: Cloudinary chưa được cấu hình!');
        return res.status(500).json({ 
          message: "Cloudinary chưa được cấu hình. Vui lòng cấu hình Cloudinary để upload video.",
          error: "Video storage not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env"
        });
      };
    }
  };
}

const router = Router();

/* ✅ CÁC ROUTE ĐÃ FIX VÀ CẢI THIỆN BẢO MẬT */

// 🟢 Lấy danh sách công thức (có thể public, nhưng có auth sẽ lấy thêm pending)
router.get("/", optionalAuth, validatePagination, listRecipes);

// 🟢 Lấy công thức theo category
router.get("/category/:category", validatePagination, getRecipesByCategory);

// 🟢 Lấy công thức đã xem (cần đăng nhập)
router.get("/viewed", auth, validatePagination, getViewedRecipes);

// 🟢 Lấy gợi ý công thức dựa trên món đã lưu (cần đăng nhập)
router.get("/recommended", auth, validatePagination, getRecommendedRecipes);

// 🟢 Lấy chi tiết công thức (optionalAuth để có thể xem user info nếu đã đăng nhập)
router.get("/:id", optionalAuth, validateObjectId(), getRecipeById);

// 🟠 Tạo công thức mới (cần đăng nhập) - CHỈ CÓ VIDEO
// Thêm error handler cho multer
const uploadVideo = upload.single("video");
const handleUploadError = (err, req, res, next) => {
  if (err) {
    console.error('❌ Multer upload error:', err);
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false,
          message: "File quá lớn. Kích thước tối đa là 300MB.",
          error: err.message 
        });
      }
      return res.status(400).json({ 
        success: false,
        message: "Lỗi upload file", 
        error: err.message 
      });
    }
    // Lỗi từ fileFilter
    return res.status(400).json({ 
      success: false,
      message: err.message || "Lỗi upload file",
      error: err.message 
    });
  }
  next();
};

// ⚠️ POST /api/recipes - Chỉ tạo recipe với text data, KHÔNG upload video
// Video sẽ được upload riêng từ frontend và cập nhật qua PATCH /api/recipes/:id/media
router.post("/", auth, validateCreateRecipe, createRecipe);

// 🟠 Cập nhật công thức (cần đăng nhập) - CHỈ CÓ VIDEO
router.put("/:id", auth, validateObjectId(), validateUpdateRecipe, uploadVideo, handleUploadError, updateRecipe);

// 🟠 Xóa công thức (cần đăng nhập)
router.delete("/:id", auth, validateObjectId(), deleteRecipe);

// 🟠 Duyệt/Từ chối công thức (Admin only)
router.put("/:id/approve", auth, adminAuth, validateObjectId(), approveRecipe);
router.put("/:id/reject", auth, adminAuth, validateObjectId(), rejectRecipe);

// 🟠 Upload video lên Cloudinary và trả về videoUrl
// POST /api/recipes/upload-video
// Body: FormData với field 'video'
router.post("/upload-video", auth, uploadVideo, handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Video là bắt buộc" });
    }

    const videoUrl = req.file.secure_url || req.file.url || req.file.path;
    
    if (!videoUrl || (!videoUrl.startsWith('https://res.cloudinary.com') && !videoUrl.startsWith('http://res.cloudinary.com'))) {
      return res.status(500).json({ 
        message: "Lỗi upload video lên Cloudinary" 
      });
    }

    // Extract public_id và lấy metadata
    let publicId = req.file.public_id || req.file.filename;
    let videoThumbnail = null;
    let videoDuration = 0;
    let videoSize = 0;
    let videoFormat = 'mp4';
    let videoQualities = [];

    if (publicId) {
      try {
        const { cloudinary } = await import('../config/cloudinary.js');
        const resource = await cloudinary.api.resource(publicId, {
          resource_type: 'video'
        });
        
        if (resource) {
          videoDuration = Math.round(resource.duration || 0);
          videoSize = resource.bytes || 0;
          videoFormat = resource.format || 'mp4';
          
          // Lấy thumbnail từ eager
          if (resource.eager && resource.eager.length > 0) {
            const thumbnailEager = resource.eager.find((e) => e.format === 'jpg' || e.format === 'png');
            if (thumbnailEager) {
              videoThumbnail = thumbnailEager.secure_url || thumbnailEager.url;
            }
          }
          
          // Tạo thumbnail nếu chưa có
          if (!videoThumbnail) {
            videoThumbnail = cloudinary.url(publicId, {
              resource_type: 'video',
              format: 'jpg',
              transformation: [
                { width: 800, height: 800, crop: 'fill', quality: 'auto' },
                { start_offset: 0 }
              ]
            });
          }
          
          // Tạo multiple qualities
          videoQualities = [
            {
              quality: '480p',
              url: cloudinary.url(publicId, {
                resource_type: 'video',
                format: 'mp4',
                transformation: [{ width: 854, height: 480, crop: 'limit', quality: 'auto' }]
              })
            },
            {
              quality: '720p',
              url: cloudinary.url(publicId, {
                resource_type: 'video',
                format: 'mp4',
                transformation: [{ width: 1280, height: 720, crop: 'limit', quality: 'auto' }]
              })
            },
            {
              quality: '1080p',
              url: cloudinary.url(publicId, {
                resource_type: 'video',
                format: 'mp4',
                transformation: [{ width: 1920, height: 1080, crop: 'limit', quality: 'auto' }]
              })
            }
          ];
        }
      } catch (cloudinaryError) {
        console.warn('⚠️ Không thể lấy metadata từ Cloudinary:', cloudinaryError.message);
      }
    }

    res.status(200).json({
      message: "Upload video thành công",
      videoUrl,
      videoThumbnail,
      videoDuration,
      videoSize,
      videoFormat,
      videoQualities,
    });
  } catch (error) {
    console.error("❌ Lỗi upload video:", error);
    res.status(500).json({ 
      message: "Lỗi upload video", 
      error: error.message 
    });
  }
});

// 🟠 Cập nhật media (video) cho recipe
// PATCH /api/recipes/:id/media
// Body: { videoUrl: string, videoThumbnail?: string, videoDuration?: number, videoSize?: number, videoFormat?: string, videoQualities?: array }
router.patch("/:id/media", auth, validateObjectId(), updateRecipeMedia);

export default router;
