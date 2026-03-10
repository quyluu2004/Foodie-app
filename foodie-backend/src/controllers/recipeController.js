import Recipe from "../models/Recipe.js";
import Category from "../models/Category.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import RecipeViewHistory from "../models/RecipeViewHistory.js";
import Saved from "../models/Saved.js";
import Favorite from "../models/Favorite.js";
import PremiumPurchase from "../models/PremiumPurchase.js";
import { isAdmin, isAdminOrCreator, canEdit, canDelete } from "../utils/roleHelpers.js";
import { normalizeVietnameseText, getVietnameseCharVariants } from "../utils/textUtils.js";

// 🧠 TẠO CÔNG THỨC MỚI
export const createRecipe = async (req, res) => {
  try {
    console.log('📥 Creating recipe - Request body:', req.body);
    console.log('📥 Request user:', req.user);
    console.log('📁 Request file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    } : '❌ NO FILE RECEIVED!');
    console.log('📁 Request files:', req.files ? Object.keys(req.files) : 'NO FILES');
    
    // ✅ Kiểm tra người dùng đăng nhập
    if (!req.user) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    // ✅ Gắn thông tin người tạo (user thật)
    const recipeData = {
      ...req.body,
      author: req.user._id,
      createdBy: req.user._id, // Alias cho author
    };

    // Xử lý category - nếu category là string rỗng hoặc không hợp lệ, bỏ qua
    if (recipeData.category && (typeof recipeData.category === 'string' ? recipeData.category.trim() !== '' : true)) {
      try {
        const category = await Category.findById(recipeData.category);
        if (category) {
          recipeData.categoryName = category.name;
          console.log('✅ Category found:', category.name);
        } else {
          console.warn('⚠️ Category not found:', recipeData.category);
          // Nếu category không tồn tại, có thể tìm theo tên hoặc bỏ qua
          const categoryByName = await Category.findOne({ name: recipeData.category });
          if (categoryByName) {
            recipeData.category = categoryByName._id;
            recipeData.categoryName = categoryByName.name;
            console.log('✅ Category found by name:', categoryByName.name);
          } else {
            // Nếu không tìm thấy, đặt category = null
            console.warn('⚠️ Category not found, setting to null');
            recipeData.category = null;
            recipeData.categoryName = null;
          }
        }
      } catch (categoryError) {
        console.error('❌ Error finding category:', categoryError);
        // Nếu lỗi khi tìm category, đặt null
        recipeData.category = null;
        recipeData.categoryName = null;
      }
    } else {
      // Nếu category rỗng, đặt null
      recipeData.category = null;
      recipeData.categoryName = null;
    }

    // Xử lý time (alias cho cookTimeMinutes)
    if (recipeData.time && !recipeData.cookTimeMinutes) {
      recipeData.cookTimeMinutes = parseInt(recipeData.time) || 0;
    }
    if (recipeData.cookTime && !recipeData.cookTimeMinutes) {
      recipeData.cookTimeMinutes = parseInt(recipeData.cookTime) || 0;
    }
    if (recipeData.cookTimeMinutes) {
      recipeData.cookTimeMinutes = parseInt(recipeData.cookTimeMinutes) || 0;
    }

    // ⚠️ KHÔNG xử lý video upload ở đây - video sẽ được upload riêng từ frontend
    // và cập nhật sau qua PATCH /api/recipes/:id/media
    // Recipe được tạo nhanh với text data, video sẽ được gắn sau

    // ✅ Ingredients/steps đã được parse trong validation middleware
    // Chỉ parse lại nếu vẫn là string (fallback)
    if (typeof recipeData.ingredients === "string") {
      try {
        recipeData.ingredients = JSON.parse(recipeData.ingredients);
      } catch (e) {
        console.warn('⚠️ Failed to parse ingredients as JSON, using as array:', e.message);
        recipeData.ingredients = [recipeData.ingredients];
      }
    }
    // Đảm bảo ingredients là array
    if (!Array.isArray(recipeData.ingredients)) {
      console.warn('⚠️ Ingredients is not an array, setting to empty array');
      recipeData.ingredients = [];
    }
    
    if (typeof recipeData.steps === "string") {
      try {
        recipeData.steps = JSON.parse(recipeData.steps);
      } catch (e) {
        console.warn('⚠️ Failed to parse steps as JSON, using as array:', e.message);
        recipeData.steps = [recipeData.steps];
      }
    }
    // Đảm bảo steps là array
    if (!Array.isArray(recipeData.steps)) {
      console.warn('⚠️ Steps is not an array, setting to empty array');
      recipeData.steps = [];
    }
    
    // Validate ingredients và steps không được rỗng
    if (recipeData.ingredients.length === 0) {
      return res.status(400).json({ message: "Nguyên liệu là bắt buộc và phải có ít nhất 1 phần tử" });
    }
    if (recipeData.steps.length === 0) {
      return res.status(400).json({ message: "Các bước thực hiện là bắt buộc và phải có ít nhất 1 phần tử" });
    }

    // Xử lý servings
    if (recipeData.servings) {
      recipeData.servings = parseInt(recipeData.servings) || 1;
    } else {
      recipeData.servings = 1;
    }

    // Map difficulty từ tiếng Anh sang tiếng Việt nếu cần
    // Model sẽ tự động map, nhưng đảm bảo ở đây cũng
    const difficultyMap = {
      'easy': 'Dễ',
      'medium': 'Trung bình',
      'hard': 'Khó'
    };
    if (recipeData.difficulty && difficultyMap[recipeData.difficulty]) {
      recipeData.difficulty = difficultyMap[recipeData.difficulty];
    }

    // Set status: creator/admin = approved, user = pending
    if (!recipeData.status) {
      recipeData.status = isAdminOrCreator(req.user) 
        ? 'approved' 
        : 'pending';
    }

    // Validate required fields
    if (!recipeData.title || recipeData.title.trim() === '') {
      return res.status(400).json({ message: "Tiêu đề công thức là bắt buộc" });
    }

    // ⚠️ KHÔNG validate video ở đây - video sẽ được upload riêng và cập nhật sau
    // Recipe được tạo trước, video sẽ được gắn sau qua PATCH /api/recipes/:id/media
    // Set mediaType mặc định là 'video' (sẽ được cập nhật khi có videoUrl)
    if (!recipeData.mediaType) {
      recipeData.mediaType = 'video';
    }

    console.log('📤 Recipe data to save:', {
      title: recipeData.title,
      category: recipeData.category,
      categoryName: recipeData.categoryName,
      cookTimeMinutes: recipeData.cookTimeMinutes,
      servings: recipeData.servings,
      difficulty: recipeData.difficulty,
      ingredientsCount: recipeData.ingredients?.length || 0,
      stepsCount: recipeData.steps?.length || 0,
      hasImage: !!recipeData.imageUrl,
      hasVideo: !!recipeData.videoUrl,
      status: recipeData.status,
      author: recipeData.author,
      mediaType: recipeData.mediaType,
    });

    // ✅ Lưu công thức
    console.log('💾 Attempting to save recipe to database...');
    console.log('   Title:', recipeData.title);
    console.log('   Media Type:', recipeData.mediaType);
    console.log('   Video URL:', recipeData.videoUrl ? 'EXISTS' : 'MISSING');
    console.log('   Image URL:', recipeData.imageUrl ? 'EXISTS' : 'MISSING');
    console.log('   Status:', recipeData.status);
    console.log('   Author:', recipeData.author);
    console.log('   Full recipeData keys:', Object.keys(recipeData));
    
    let newRecipe;
    try {
      // Đảm bảo các field required có giá trị
      if (!recipeData.title || recipeData.title.trim() === '') {
        throw new Error('Title is required');
      }
      
      // Đảm bảo author có giá trị
      if (!recipeData.author) {
        throw new Error('Author is required');
      }
      
      // ⚠️ KHÔNG validate video/image ở đây - video sẽ được upload riêng và cập nhật sau
      // Recipe được tạo trước, video sẽ được gắn sau qua PATCH /api/recipes/:id/media
      
      console.log('💾 Calling Recipe.create() with data:');
      console.log('   Title:', recipeData.title);
      console.log('   Author:', recipeData.author);
      console.log('   Status:', recipeData.status);
      console.log('   Video URL:', recipeData.videoUrl ? 'EXISTS' : 'MISSING');
      console.log('   Image URL:', recipeData.imageUrl ? 'EXISTS' : 'MISSING');
      console.log('   Ingredients count:', recipeData.ingredients?.length || 0);
      console.log('   Steps count:', recipeData.steps?.length || 0);
      
      // Tạo recipe mới
      newRecipe = new Recipe(recipeData);
      
      // Validate trước khi save
      const validationError = newRecipe.validateSync();
      if (validationError) {
        console.error('❌ VALIDATION ERROR BEFORE SAVE:', validationError);
        throw validationError;
      }
      
      // Save vào database
      await newRecipe.save();
      
      console.log('✅ Recipe saved to database successfully!');
      console.log('   Recipe ID:', newRecipe._id.toString());
      console.log('   Status:', newRecipe.status);
      console.log('   Media Type:', newRecipe.mediaType);
      console.log('   Video URL:', newRecipe.videoUrl || 'N/A');
      console.log('   Thumbnail:', newRecipe.videoThumbnail || 'N/A');
      
      // Populate sau khi save
      await newRecipe.populate("author", "name email avatarUrl");
      if (newRecipe.category) {
        await newRecipe.populate("category", "name");
      }
      
      // Verify recipe đã được lưu
      const verifyRecipe = await Recipe.findById(newRecipe._id);
      if (!verifyRecipe) {
        throw new Error('Recipe was not saved to database!');
      }
      console.log('✅ Verified: Recipe exists in database with ID:', verifyRecipe._id.toString());
      console.log('✅ Recipe details in DB:', {
        _id: verifyRecipe._id.toString(),
        title: verifyRecipe.title,
        status: verifyRecipe.status,
        author: verifyRecipe.author?.toString() || verifyRecipe.author,
        createdAt: verifyRecipe.createdAt,
        hasVideo: !!verifyRecipe.videoUrl,
        hasImage: !!verifyRecipe.imageUrl,
        ingredientsCount: verifyRecipe.ingredients?.length || 0,
        stepsCount: verifyRecipe.steps?.length || 0,
      });
      
    } catch (saveError) {
      console.error('❌ ERROR SAVING TO DATABASE:', saveError);
      console.error('   Error name:', saveError.name);
      console.error('   Error message:', saveError.message);
      console.error('   Error code:', saveError.code);
      console.error('   Error stack:', saveError.stack);
      if (saveError.errors) {
        console.error('   Validation errors:', Object.keys(saveError.errors));
        Object.keys(saveError.errors).forEach(key => {
          console.error(`     ${key}:`, saveError.errors[key].message);
        });
      }
      // Re-throw để catch bên ngoài xử lý và trả về error cho client
      throw saveError;
    }

    // Tạo thông báo cho user khi tạo công thức thành công
    // Nếu status = 'pending' → thông báo "Chờ duyệt" (công thức KHÔNG hiển thị cho đến khi admin duyệt)
    // Nếu status = 'approved' (admin/creator) → thông báo "Thành công"
    if (newRecipe.status === 'pending') {
      await Notification.create({
        user: req.user._id,
        type: "recipe_approved", // Sử dụng type này để hiển thị trong hoạt động
        title: "Công thức đang chờ duyệt",
        message: `Công thức "${newRecipe.title}" của bạn đã được tạo thành công và đang chờ admin duyệt. Công thức sẽ chỉ hiển thị sau khi được admin duyệt.`,
        relatedId: newRecipe._id,
        relatedType: "Recipe",
        isRead: false,
      });
      console.log(`✅ Đã tạo thông báo "Chờ duyệt" cho user ${req.user._id}`);
      
      // Emit notification event via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${req.user._id}`).emit('newNotification');
        console.log(`📤 Emitted newNotification event to user:${req.user._id}`);
      }
    } else if (newRecipe.status === 'approved') {
      await Notification.create({
        user: req.user._id,
        type: "recipe_approved",
        title: "Công thức đã được duyệt",
        message: `Công thức "${newRecipe.title}" của bạn đã được tạo và hiển thị trên ứng dụng.`,
        relatedId: newRecipe._id,
        relatedType: "Recipe",
        isRead: false,
      });
      console.log(`✅ Đã tạo thông báo "Thành công" cho user ${req.user._id}`);
      
      // Emit notification event via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${req.user._id}`).emit('newNotification');
        console.log(`📤 Emitted newNotification event to user:${req.user._id}`);
      }
    }

    res.status(201).json({
      message: newRecipe.status === 'pending' 
        ? "Tạo công thức thành công. Công thức đang chờ admin duyệt." 
        : "Tạo công thức thành công",
      recipe: newRecipe,
      recipeId: newRecipe._id, // Trả về recipeId để frontend upload video
    });
  } catch (error) {
    console.error("❌ Lỗi khi tạo công thức:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Request body:", req.body);
    console.error("❌ Request file exists:", !!req.file);
    if (req.file) {
      console.error("❌ Request file details:", {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        path: req.file.path,
        secure_url: req.file.secure_url,
        url: req.file.url,
        public_id: req.file.public_id,
      });
    }
    
    // Xử lý lỗi validation
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message).join(', ');
      return res.status(400).json({ 
        message: "Dữ liệu không hợp lệ", 
        error: validationErrors 
      });
    }
    
    // Xử lý lỗi Multer (file upload)
    if (error.name === 'MulterError') {
      console.error("❌ Multer error:", error.code, error.message);
      return res.status(400).json({ 
        message: "Lỗi upload file", 
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      message: "Lỗi tạo công thức", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// 🧠 CẬP NHẬT MEDIA (VIDEO) CHO RECIPE
// Endpoint: PATCH /api/recipes/:id/media
// Body: { videoUrl: string, videoThumbnail?: string, videoDuration?: number, videoSize?: number, videoFormat?: string, videoQualities?: array }
export const updateRecipeMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { videoUrl, videoThumbnail, videoDuration, videoSize, videoFormat, videoQualities } = req.body;

    // Kiểm tra recipe tồn tại
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    // Kiểm tra quyền: chỉ author hoặc admin mới sửa được
    if (!req.user) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const authorId = recipe.author?._id || recipe.author || recipe.createdBy?._id || recipe.createdBy;
    const userId = req.user._id?.toString() || req.user._id;
    const isAuthor = authorId?.toString() === userId?.toString();
    const isAdminUser = isAdmin(req.user);

    if (!isAuthor && !isAdminUser) {
      return res.status(403).json({ 
        message: "Bạn không có quyền cập nhật video cho công thức này" 
      });
    }

    // Validate videoUrl
    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
      return res.status(400).json({ message: "Video URL là bắt buộc" });
    }

    // Validate Cloudinary URL
    if (!videoUrl.startsWith('https://res.cloudinary.com') && !videoUrl.startsWith('http://res.cloudinary.com')) {
      return res.status(400).json({ 
        message: "Video URL phải là Cloudinary URL hợp lệ" 
      });
    }

    console.log('📹 Updating recipe media:', {
      recipeId: id,
      videoUrl: videoUrl.substring(0, 50) + '...',
      hasThumbnail: !!videoThumbnail,
      duration: videoDuration,
      size: videoSize,
      format: videoFormat,
    });

    // Extract public_id từ videoUrl
    let publicId = null;
    try {
      const urlParts = videoUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex >= 0 && uploadIndex < urlParts.length - 1) {
        const afterUpload = urlParts.slice(uploadIndex + 1);
        const pathParts = afterUpload.filter((part, index) => {
          if (index === 0 && part.startsWith('v') && /^\d+$/.test(part.substring(1))) {
            return false; // Bỏ qua version
          }
          return true;
        });
        publicId = pathParts.join('/').replace(/\.(mp4|mov)$/i, '');
      }
    } catch (extractError) {
      console.warn('⚠️ Không thể extract public_id từ URL:', extractError.message);
    }

    // Cập nhật recipe với video data
    const updateData = {
      mediaType: 'video',
      videoUrl: videoUrl.trim(),
    };

    // Thêm thumbnail nếu có
    if (videoThumbnail) {
      updateData.videoThumbnail = videoThumbnail;
    } else if (publicId) {
      // Tạo thumbnail từ Cloudinary nếu chưa có
      try {
        const { cloudinary } = await import('../config/cloudinary.js');
        updateData.videoThumbnail = cloudinary.url(publicId, {
          resource_type: 'video',
          format: 'jpg',
          transformation: [
            { width: 800, height: 800, crop: 'fill', quality: 'auto' },
            { start_offset: 0 }
          ]
        });
      } catch (thumbError) {
        console.warn('⚠️ Không thể tạo thumbnail URL:', thumbError.message);
      }
    }

    // Thêm metadata nếu có
    if (videoDuration !== undefined) updateData.videoDuration = parseInt(videoDuration) || 0;
    if (videoSize !== undefined) updateData.videoSize = parseInt(videoSize) || 0;
    if (videoFormat) updateData.videoFormat = videoFormat;
    if (videoQualities && Array.isArray(videoQualities)) {
      updateData.videoQualities = videoQualities;
    } else if (publicId) {
      // Tạo multiple qualities nếu chưa có
      try {
        const { cloudinary } = await import('../config/cloudinary.js');
        updateData.videoQualities = [
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
      } catch (qualitiesError) {
        console.warn('⚠️ Không thể tạo video qualities:', qualitiesError.message);
      }
    }

    // Lấy metadata từ Cloudinary nếu chưa có
    if (publicId && (!videoDuration || !videoSize || !videoFormat)) {
      try {
        const { cloudinary } = await import('../config/cloudinary.js');
        const resource = await cloudinary.api.resource(publicId, {
          resource_type: 'video'
        });
        
        if (resource) {
          if (!updateData.videoDuration) updateData.videoDuration = Math.round(resource.duration || 0);
          if (!updateData.videoSize) updateData.videoSize = resource.bytes || 0;
          if (!updateData.videoFormat) updateData.videoFormat = resource.format || 'mp4';
          
          // Lấy thumbnail từ eager nếu có
          if (!updateData.videoThumbnail && resource.eager && resource.eager.length > 0) {
            const thumbnailEager = resource.eager.find((e) => e.format === 'jpg' || e.format === 'png');
            if (thumbnailEager) {
              updateData.videoThumbnail = thumbnailEager.secure_url || thumbnailEager.url;
            }
          }
        }
      } catch (cloudinaryError) {
        console.warn('⚠️ Không thể lấy metadata từ Cloudinary:', cloudinaryError.message);
      }
    }

    // Cập nhật recipe
    Object.assign(recipe, updateData);
    await recipe.save();

    // Populate để trả về đầy đủ
    await recipe.populate("author", "name email avatarUrl");
    if (recipe.category) {
      await recipe.populate("category", "name");
    }

    console.log('✅ Recipe media updated successfully:', {
      recipeId: recipe._id,
      hasVideo: !!recipe.videoUrl,
      hasThumbnail: !!recipe.videoThumbnail,
    });

    res.status(200).json({
      message: "Cập nhật video thành công",
      recipe: recipe,
    });
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật video:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message).join(', ');
      return res.status(400).json({ 
        message: "Dữ liệu không hợp lệ", 
        error: validationErrors 
      });
    }
    
    res.status(500).json({ 
      message: "Lỗi cập nhật video", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// 🧠 DANH SÁCH CÔNG THỨC (lấy tất cả, hỗ trợ lọc)
export const listRecipes = async (req, res) => {
  try {
    const { category, status, page = 1, limit = 20, q, search, difficulty, minRating } = req.query;
    const query = {};

    // Tìm kiếm theo tên (title) - hỗ trợ cả 'q' và 'search'
    // Hỗ trợ tìm kiếm không dấu và tìm theo từng ký tự
    const searchQuery = q || search;
    if (searchQuery && searchQuery.trim()) {
      const normalizedQuery = normalizeVietnameseText(searchQuery.trim());
      if (normalizedQuery) {
        // Tạo regex pattern để tìm kiếm với hỗ trợ không dấu
        // Ví dụ: "P" sẽ tìm tất cả công thức có chữ P (có dấu hoặc không dấu)
        // "pho" sẽ tìm được "phở", "Phở", "pho", etc.
        const regexPattern = normalizedQuery
          .split('')
          .map(char => {
            // Escape special regex characters
            const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Tạo pattern match cả có dấu và không dấu cho mỗi ký tự
            const variants = getVietnameseCharVariants(char);
            if (variants.length > 1) {
              return `[${variants.join('')}]`;
            }
            return escaped;
          })
          .join('');
        
        query.title = { 
          $regex: regexPattern, 
          $options: 'i' // Case-insensitive
        };
      }
    }

    // Lọc theo độ khó
    if (difficulty) {
      // Hỗ trợ cả tiếng Việt và tiếng Anh
      const difficultyMap = {
        'easy': 'Dễ',
        'medium': 'Trung bình',
        'hard': 'Khó',
        'Dễ': 'Dễ',
        'Trung bình': 'Trung bình',
        'Khó': 'Khó'
      };
      const mappedDifficulty = difficultyMap[difficulty] || difficulty;
      if (['Dễ', 'Trung bình', 'Khó'].includes(mappedDifficulty)) {
        query.difficulty = mappedDifficulty;
      }
    }

    // Lọc theo rating tối thiểu
    if (minRating) {
      const minRatingValue = parseFloat(minRating);
      if (!isNaN(minRatingValue) && minRatingValue >= 0 && minRatingValue <= 5) {
        query.averageRating = { $gte: minRatingValue };
      }
    }

    // Lọc theo category nếu có (có thể là ObjectId hoặc categoryName)
    if (category) {
      // Nếu category là ObjectId (24 ký tự hex), filter theo ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(category)) {
        query.category = category;
      } else {
        // Nếu category là string (tên category), filter theo categoryName
        query.categoryName = category;
      }
    }

    // Lọc theo status nếu có
    if (status && status !== 'all') {
      query.status = status;
    } else if (!status || status === 'all') {
      // Nếu không có status hoặc status = 'all'
      // Admin có thể xem tất cả (không filter)
      // User/Creator/Khách: CHỈ xem recipes đã approved HOẶC pending của chính mình
      if (!isAdmin(req.user)) {
        if (req.user && req.user._id) {
          // User đã đăng nhập: hiển thị approved + pending của chính mình
          query.$or = [
            { status: 'approved' },
            { status: 'pending', author: req.user._id }
          ];
        } else {
          // Khách chưa đăng nhập: chỉ hiển thị approved
          query.status = 'approved';
        }
      }
      // Admin: không filter status (xem tất cả)
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const recipes = await Recipe.find(query)
      .populate("author", "name email avatarUrl")
      .populate("createdBy", "name email avatarUrl")
      .populate("category", "name description imageUrl")
      .select("+averageRating +ratingCount +totalRating") // Đảm bảo include rating fields
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Đảm bảo categoryName được set cho tất cả recipes và thêm commentCount
    for (const recipe of recipes) {
      if (!recipe.categoryName && recipe.category) {
        if (typeof recipe.category === 'object' && recipe.category !== null) {
          recipe.categoryName = recipe.category.name;
        } else if (recipe.category) {
          // Nếu category là ObjectId, tìm category
          const category = await Category.findById(recipe.category);
          if (category) {
            recipe.categoryName = category.name;
          }
        }
      }
      
      // Đếm số lượng comments (bao gồm cả replies)
      const comments = await Comment.find({ recipe: recipe._id });
      let commentCount = comments.length;
      comments.forEach((comment) => {
        if (comment.replies && comment.replies.length > 0) {
          commentCount += comment.replies.length;
        }
      });
      recipe.commentCount = commentCount;
    }

    const total = await Recipe.countDocuments(query);

    res.status(200).json({
      message: "Lấy danh sách công thức thành công",
      recipes: recipes,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách công thức:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách công thức", error: error.message });
  }
};

// 🧠 LẤY CÔNG THỨC THEO CATEGORY
// Lấy công thức theo category (hỗ trợ cả category name và ObjectId)
export const getRecipesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Kiểm tra xem category có phải là ObjectId hợp lệ không
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
    
    let query = { status: 'approved' };
    
    if (isObjectId) {
      // Nếu là ObjectId, tìm theo category ObjectId
      query.category = category;
    } else {
      // Nếu là string (tên category), tìm theo categoryName
      query.categoryName = category;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const recipes = await Recipe.find(query)
      .populate("author", "name email avatarUrl")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Recipe.countDocuments(query);

    res.status(200).json({
      message: "Lấy công thức theo category thành công",
      recipes: recipes,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("❌ Lỗi lấy công thức theo category:", error);
    res.status(500).json({ message: "Lỗi lấy công thức theo category", error: error.message });
  }
};

// 🧠 LẤY CHI TIẾT CÔNG THỨC THEO ID
export const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate("author", "name email avatarUrl")
      .populate("createdBy", "name email avatarUrl")
      .populate("category", "name description imageUrl")
      .populate("likes", "name email avatarUrl")
      .lean(); // Use lean() để có thể modify object

    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    // Kiểm tra quyền xem: 
    // - Admin có thể xem tất cả
    // - User/Creator/Khách: CHỈ xem recipes đã approved (KHÔNG xem pending của chính mình)
    const userIsAdmin = isAdmin(req.user);

    // Nếu không phải admin, CHỈ cho xem recipes đã approved
    // KHÔNG cho xem pending của chính mình
    if (!userIsAdmin && recipe.status !== 'approved') {
      return res.status(403).json({ 
        message: "Công thức này chưa được duyệt. Vui lòng chờ admin duyệt." 
      });
    }

    // Đảm bảo categoryName được set
    if (!recipe.categoryName && recipe.category) {
      if (typeof recipe.category === 'object' && recipe.category !== null) {
        recipe.categoryName = recipe.category.name;
      } else if (recipe.category) {
        const category = await Category.findById(recipe.category);
        if (category) {
          recipe.categoryName = category.name;
        }
      }
    }

    console.log('✅ Recipe found:', {
      id: recipe._id,
      title: recipe.title,
      status: recipe.status,
      hasAuthor: !!recipe.author,
      hasCategory: !!recipe.category,
      categoryName: recipe.categoryName,
    });

    // Kiểm tra premium và purchase status
    let hasPurchased = false;
    let canViewFullContent = true;

    if (recipe.isPremium) {
      // Nếu là recipe của chính mình, có thể xem
      const authorId = recipe.author?._id || recipe.author || recipe.createdBy?._id || recipe.createdBy;
      if (req.user && req.user._id && authorId.toString() === req.user._id.toString()) {
        hasPurchased = true;
        canViewFullContent = true;
      } else if (req.user && req.user._id) {
        // Kiểm tra đã mua chưa
        const purchase = await PremiumPurchase.findOne({
          user: req.user._id,
          recipe: recipe._id,
        });
        hasPurchased = !!purchase;
        canViewFullContent = hasPurchased;
      } else {
        // Chưa đăng nhập
        canViewFullContent = false;
      }

      // Nếu không thể xem full content, ẩn ingredients và steps
      if (!canViewFullContent) {
        recipe.ingredients = [];
        recipe.steps = [];
        recipe.description = recipe.description 
          ? `${recipe.description.substring(0, 100)}... (Công thức Premium - Cần mua để xem đầy đủ)`
          : "Công thức Premium - Cần mua để xem đầy đủ";
      }
    }

    // Track view history nếu user đã đăng nhập
    if (req.user && req.user._id) {
      try {
        await RecipeViewHistory.findOneAndUpdate(
          { user: req.user._id, recipe: recipe._id },
          { 
            user: req.user._id, 
            recipe: recipe._id,
            viewedAt: new Date()
          },
          { upsert: true, new: true }
        );
      } catch (viewError) {
        console.error('⚠️ Error tracking view history:', viewError);
        // Không block response nếu track view history lỗi
      }
    }

    res.status(200).json({
      message: "Lấy công thức thành công",
      recipe: {
        ...recipe,
        hasPurchased,
        canViewFullContent,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy công thức:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// 🧠 CẬP NHẬT CÔNG THỨC
export const updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    // Kiểm tra quyền: chỉ author hoặc admin mới sửa được
    if (!req.user) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    // Creator và Admin có thể sửa công thức của mình
    // Admin có thể sửa tất cả
    // User thường chỉ có thể sửa khi recipe chưa được duyệt (status = 'pending')
    const authorId = recipe.author?._id || recipe.author || recipe.createdBy?._id || recipe.createdBy;
    if (!canEdit(req.user, authorId, recipe)) {
      return res.status(403).json({ 
        message: "Bạn không có quyền sửa công thức này. User thường chỉ có thể sửa khi công thức chưa được duyệt." 
      });
    }

    const updateData = { ...req.body };

    // Xử lý category nếu có
    // CHỈ update category nếu có giá trị hợp lệ, nếu không thì giữ nguyên category cũ
    if (updateData.category !== undefined) {
      // Nếu category là chuỗi rỗng hoặc không hợp lệ, KHÔNG update (giữ nguyên category cũ)
      if (typeof updateData.category === 'string' && updateData.category.trim() === '') {
        // Không update category, giữ nguyên category cũ
        delete updateData.category;
        delete updateData.categoryName;
        console.log('📝 Category rỗng, giữ nguyên category cũ:', recipe.category?.name || recipe.categoryName || 'Chưa phân loại');
      } else if (updateData.category) {
        try {
          const category = await Category.findById(updateData.category);
          if (category) {
            updateData.categoryName = category.name;
            console.log('✅ Cập nhật category:', category.name);
          } else {
            // Nếu category không tồn tại, không update (giữ nguyên category cũ)
            console.warn('⚠️ Category không tồn tại, giữ nguyên category cũ');
            delete updateData.category;
            delete updateData.categoryName;
          }
        } catch (error) {
          // Nếu category không hợp lệ (không phải ObjectId), không update (giữ nguyên category cũ)
          console.warn('⚠️ Invalid category ID, giữ nguyên category cũ:', updateData.category);
          delete updateData.category;
          delete updateData.categoryName;
        }
      }
    } else {
      // Nếu không có category trong request, giữ nguyên category cũ
      console.log('📝 Không có category trong request, giữ nguyên category cũ');
    }

    // Xử lý time
    if (updateData.time && !updateData.cookTimeMinutes) {
      updateData.cookTimeMinutes = updateData.time;
    }

    // Xử lý xóa ảnh nếu có yêu cầu
    if (updateData.deleteImage === 'true' || updateData.deleteImage === true) {
      console.log('🗑️ Xóa ảnh recipe:', recipe.imageUrl);
      // Xóa file ảnh cũ nếu có
      if (recipe.imageUrl) {
        try {
          const fs = await import('fs');
          const path = await import('path');
          // Lấy đường dẫn file từ URL
          let imagePath = null;
          if (recipe.imageUrl.includes('uploads/')) {
            const filename = recipe.imageUrl.split('uploads/').pop();
            imagePath = path.join(process.cwd(), 'uploads', filename);
          } else if (recipe.imageUrl.includes('/uploads/')) {
            const filename = recipe.imageUrl.split('/uploads/').pop();
            imagePath = path.join(process.cwd(), 'uploads', filename);
          }
          
          if (imagePath && fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('✅ Đã xóa file ảnh cũ:', imagePath);
          } else if (imagePath) {
            console.log('⚠️ Không tìm thấy file ảnh tại:', imagePath);
          }
        } catch (fileError) {
          console.warn('⚠️ Không thể xóa file ảnh cũ:', fileError.message);
        }
      }
      updateData.imageUrl = null;
    }
    // Xử lý upload video mới nếu có (ưu tiên hơn xóa) - CHỈ CÓ VIDEO
    else if (req.file) {
      const isVideo = req.file.mimetype && req.file.mimetype.startsWith('video/');
      
      if (isVideo) {
        console.log('🎥 Upload video mới:', {
          filename: req.file.filename,
          path: req.file.path,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype
        });

      // Xóa file ảnh cũ trước khi lưu ảnh mới
      if (recipe.imageUrl) {
        try {
          const fs = await import('fs');
          const path = await import('path');
          let imagePath = null;
          if (recipe.imageUrl.includes('uploads/')) {
            const filename = recipe.imageUrl.split('uploads/').pop();
            imagePath = path.join(process.cwd(), 'uploads', filename);
          } else if (recipe.imageUrl.includes('/uploads/')) {
            const filename = recipe.imageUrl.split('/uploads/').pop();
            imagePath = path.join(process.cwd(), 'uploads', filename);
          }
          
          if (imagePath && fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('✅ Đã xóa file ảnh cũ trước khi upload ảnh mới:', imagePath);
          }
        } catch (fileError) {
          console.warn('⚠️ Không thể xóa file ảnh cũ:', fileError.message);
        }
      }

        // Xử lý video upload từ Cloudinary
        updateData.mediaType = 'video';
        
        if (req.file.path && req.file.path.startsWith('http')) {
          // Cloudinary URL
          updateData.videoUrl = req.file.path;
          
          // Lấy metadata từ Cloudinary (cần gọi API để lấy đầy đủ)
          // Lấy public_id từ filename hoặc path
          let publicId = req.file.filename || req.file.public_id;
          if (publicId && publicId.includes('/')) {
            // Nếu có folder, lấy phần cuối
            publicId = publicId.split('/').pop();
          }
          
          if (publicId) {
            try {
              const { cloudinary } = await import('../config/cloudinary.js');
              // Lấy thông tin chi tiết từ Cloudinary
              const resource = await cloudinary.api.resource(publicId, {
                resource_type: 'video'
              });
              
              if (resource) {
                updateData.videoDuration = Math.round(resource.duration || 0);
                updateData.videoSize = resource.bytes || 0;
                updateData.videoFormat = resource.format || 'mp4';
                
                // Tạo thumbnail URL
                updateData.videoThumbnail = cloudinary.url(publicId, {
                  resource_type: 'video',
                  format: 'jpg',
                  transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }]
                });
                
                // Tạo multiple qualities URLs
                updateData.videoQualities = [
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
                
                console.log('✅ Video metadata từ Cloudinary:', {
                  duration: updateData.videoDuration,
                  size: updateData.videoSize,
                  format: updateData.videoFormat,
                  thumbnail: updateData.videoThumbnail
                });
              }
            } catch (cloudinaryError) {
              console.warn('⚠️ Không thể lấy metadata từ Cloudinary:', cloudinaryError.message);
              // Vẫn lưu videoUrl, nhưng không có metadata
            }
          }
          
          console.log('✅ Sử dụng URL Cloudinary:', updateData.videoUrl);
        } else {
          // Local file storage (fallback)
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          let filename = req.file.filename || req.file.path.split(/[/\\]/).pop();
          if (filename) {
            filename = filename.replace(/^uploads\//, '').replace(/^\/uploads\//, '');
            updateData.videoUrl = `${baseUrl}/uploads/${filename}`;
            updateData.mediaType = 'video';
            console.log('✅ Tạo URL video local:', updateData.videoUrl);
          } else {
            console.error('❌ Không thể xác định tên file video');
            return res.status(400).json({ message: "Không thể xử lý file video" });
          }
        }
      } else {
        // Xử lý ảnh (backward compatibility)
        updateData.mediaType = 'image';
        if (req.file.path && req.file.path.startsWith('http')) {
          updateData.imageUrl = req.file.path;
          console.log('✅ Sử dụng URL Cloudinary:', updateData.imageUrl);
        } else {
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          let filename = req.file.filename || req.file.path.split(/[/\\]/).pop();
          if (filename) {
            filename = filename.replace(/^uploads\//, '').replace(/^\/uploads\//, '');
            updateData.imageUrl = `${baseUrl}/uploads/${filename}`;
            console.log('✅ Tạo URL ảnh local:', updateData.imageUrl);
          } else {
            console.error('❌ Không thể xác định tên file ảnh');
            return res.status(400).json({ message: "Không thể xử lý file ảnh" });
          }
        }
      }
    }

    // Xử lý ingredients/steps nếu là string
    if (typeof updateData.ingredients === "string") {
      try {
        updateData.ingredients = JSON.parse(updateData.ingredients);
      } catch (e) {
        updateData.ingredients = [updateData.ingredients];
      }
    }
    if (typeof updateData.steps === "string") {
      try {
        updateData.steps = JSON.parse(updateData.steps);
      } catch (e) {
        updateData.steps = [updateData.steps];
      }
    }

    // Loại bỏ các field không cần thiết khỏi updateData
    delete updateData.deleteImage;
    delete updateData.time; // Đã chuyển thành cookTimeMinutes

    console.log('📝 Update data:', {
      hasImageUrl: !!updateData.imageUrl,
      imageUrl: updateData.imageUrl,
      category: updateData.category,
      title: updateData.title
    });

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("author", "name email avatarUrl")
      .populate("category", "name");

    if (!updatedRecipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức sau khi cập nhật" });
    }

    // Đảm bảo categoryName luôn được set đúng, ngay cả khi không update category
    if (!updatedRecipe.categoryName && updatedRecipe.category) {
      if (typeof updatedRecipe.category === 'object' && updatedRecipe.category !== null) {
        updatedRecipe.categoryName = updatedRecipe.category.name;
        // Lưu lại categoryName vào database
        await Recipe.findByIdAndUpdate(updatedRecipe._id, { categoryName: updatedRecipe.category.name });
      } else if (updatedRecipe.category) {
        const category = await Category.findById(updatedRecipe.category);
        if (category) {
          updatedRecipe.categoryName = category.name;
          // Lưu lại categoryName vào database
          await Recipe.findByIdAndUpdate(updatedRecipe._id, { categoryName: category.name });
        }
      }
    }

    console.log('✅ Cập nhật công thức thành công:', {
      recipeId: updatedRecipe._id,
      title: updatedRecipe.title,
      imageUrl: updatedRecipe.imageUrl,
      category: updatedRecipe.category?.name || updatedRecipe.categoryName || 'Chưa phân loại'
    });

    // Nếu admin chỉnh sửa công thức của user khác, tạo thông báo
    const userIsAdmin = isAdmin(req.user);
    const recipeAuthorId = updatedRecipe.author?._id || updatedRecipe.author || updatedRecipe.createdBy?._id || updatedRecipe.createdBy;
    const currentUserId = req.user?._id;
    const isOwner = currentUserId && recipeAuthorId && currentUserId.toString() === recipeAuthorId.toString();
    
    if (userIsAdmin && !isOwner && recipeAuthorId) {
      // Tạo danh sách các thay đổi
      const changes = [];
      if (updateData.title && updateData.title !== recipe.title) {
        changes.push(`Tiêu đề: "${recipe.title}" → "${updateData.title}"`);
      }
      if (updateData.description && updateData.description !== recipe.description) {
        changes.push('Mô tả đã được cập nhật');
      }
      if (updateData.category && updateData.category !== recipe.category?.toString()) {
        changes.push('Danh mục đã được thay đổi');
      }
      if (updateData.imageUrl || updateData.deleteImage === 'true' || updateData.deleteImage === true) {
        changes.push('Ảnh đã được thay đổi');
      }
      if (updateData.ingredients) {
        changes.push('Nguyên liệu đã được cập nhật');
      }
      if (updateData.steps) {
        changes.push('Các bước thực hiện đã được cập nhật');
      }
      
      const changesMessage = changes.length > 0 
        ? `\n\nCác thay đổi:\n${changes.map(c => `• ${c}`).join('\n')}`
        : '';

      await Notification.create({
        user: recipeAuthorId,
        type: "recipe_updated",
        title: "Admin đã chỉnh sửa công thức của bạn",
        message: `Công thức "${updatedRecipe.title}" của bạn đã được admin chỉnh sửa.${changesMessage}`,
        relatedId: updatedRecipe._id,
        relatedType: "Recipe",
        isRead: false,
      });
      
      // Emit notification event via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${recipeAuthorId}`).emit('newNotification');
        console.log(`📤 Emitted newNotification event to user:${recipeAuthorId}`);
      }
      
      console.log(`✅ Đã tạo thông báo cho user ${recipeAuthorId} về công thức được chỉnh sửa`);
    }

    res.status(200).json({
      message: "Cập nhật công thức thành công",
      recipe: updatedRecipe,
    });
  } catch (error) {
    console.error("❌ Lỗi cập nhật công thức:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Request body:", req.body);
    console.error("❌ Request file:", req.file ? {
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype
    } : 'no file');
    
    res.status(500).json({ 
      message: "Lỗi cập nhật công thức", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// 🧠 XÓA CÔNG THỨC
export const deleteRecipe = async (req, res) => {
  try {
    console.log('🗑️ Delete recipe request:', {
      recipeId: req.params.id,
      userId: req.user?._id,
      userRole: req.user?.role,
      body: req.body
    });

    const recipe = await Recipe.findById(req.params.id)
      .populate("author", "name email avatarUrl")
      .populate("createdBy", "name email avatarUrl");
    
    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    // Kiểm tra quyền: chỉ author hoặc admin mới xóa được
    // Creator và Admin có thể xóa công thức của mình
    // Admin có thể xóa tất cả
    // User thường chỉ có thể xóa khi recipe chưa được duyệt (status = 'pending')
    const authorId = recipe.author?._id || recipe.author || recipe.createdBy?._id || recipe.createdBy;
    const userId = req.user?._id;
    const userIsAdmin = isAdmin(req.user);
    const isOwner = userId && authorId && userId.toString() === authorId.toString();

    if (!canDelete(req.user, authorId, recipe)) {
      return res.status(403).json({ 
        message: "Bạn không có quyền xóa công thức này. User thường chỉ có thể xóa khi công thức chưa được duyệt.",
        debug: {
          isAdmin: userIsAdmin,
          canDelete: canDelete(req.user, authorId, recipe),
          userRole: req.user?.role,
          authorId: authorId?.toString(),
          userId: userId?.toString(),
          isOwner: isOwner,
          recipeStatus: recipe.status
        }
      });
    }

    const { reason } = req.body; // Lý do xóa từ admin (tùy chọn)
    console.log('📝 Delete reason:', reason);

    // Nếu admin xóa công thức của user khác, tạo thông báo
    if (userIsAdmin && !isOwner) {
      const recipeAuthor = recipe.author || recipe.createdBy;
      if (recipeAuthor) {
        const authorId = typeof recipeAuthor === 'object' && recipeAuthor._id 
          ? recipeAuthor._id 
          : (typeof recipeAuthor === 'object' ? recipeAuthor : recipeAuthor);
        
        await Notification.create({
          user: authorId,
          type: "recipe_removed",
          title: "Admin đã xóa công thức của bạn",
          message: `Công thức "${recipe.title}" của bạn đã bị admin xóa${reason ? `: ${reason}` : ''}.`,
          reason: reason || "",
          relatedId: recipe._id,
          relatedType: "Recipe",
          isRead: false,
        });
        
        // Emit notification event via Socket.IO
        const io = req.app.get('io');
        if (io) {
          io.to(`user:${authorId}`).emit('newNotification');
          console.log(`📤 Emitted newNotification event to user:${authorId}`);
        }
        
        console.log(`✅ Đã tạo thông báo cho user ${authorId} về công thức bị xóa`);
      }
    }

    await Recipe.findByIdAndDelete(req.params.id);
    console.log('✅ Recipe deleted successfully:', req.params.id);
    
    res.status(200).json({ 
      message: "Xóa công thức thành công",
      notificationSent: userIsAdmin && !isOwner
    });
  } catch (error) {
    console.error("❌ Lỗi xóa công thức:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ message: "Lỗi xóa công thức", error: error.message });
  }
};

// 🧠 DUYỆT CÔNG THỨC (Admin only)
export const approveRecipe = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Chỉ admin mới có quyền duyệt công thức" });
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    // Cập nhật status thành approved
    recipe.status = 'approved';
    await recipe.save();

    // Populate để lấy thông tin đầy đủ
    await recipe.populate("author", "name email avatarUrl");
    await recipe.populate("createdBy", "name email avatarUrl");
    await recipe.populate("category", "name");

    // Tạo thông báo "Thành công" cho người tạo công thức khi admin duyệt
    const recipeAuthor = recipe.author || recipe.createdBy;
    if (recipeAuthor && recipeAuthor._id) {
      await Notification.create({
        user: recipeAuthor._id,
        type: "recipe_approved",
        title: "Công thức đã được duyệt thành công",
        message: `Công thức "${recipe.title}" của bạn đã được admin duyệt và hiển thị trên ứng dụng.`,
        relatedId: recipe._id,
        relatedType: "Recipe",
        isRead: false,
      });
      
      // Emit notification event via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${recipeAuthor._id}`).emit('newNotification');
        console.log(`📤 Emitted newNotification event to user:${recipeAuthor._id}`);
      }
      
      console.log(`✅ Đã tạo thông báo "Thành công" cho user ${recipeAuthor._id} về công thức được duyệt`);
    }

    res.status(200).json({
      message: "Đã duyệt công thức thành công",
      recipe: recipe,
    });
  } catch (error) {
    console.error("❌ Lỗi duyệt công thức:", error);
    res.status(500).json({ message: "Lỗi duyệt công thức", error: error.message });
  }
};

// 🧠 TỪ CHỐI CÔNG THỨC (Admin only)
export const rejectRecipe = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Chỉ admin mới có quyền từ chối công thức" });
    }

    const { reason } = req.body; // Lý do từ chối (tùy chọn)

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Không tìm thấy công thức" });
    }

    // Cập nhật status thành rejected
    recipe.status = 'rejected';
    await recipe.save();

    // Populate để lấy thông tin đầy đủ
    await recipe.populate("author", "name email avatarUrl");
    await recipe.populate("createdBy", "name email avatarUrl");
    await recipe.populate("category", "name");

    // Tạo thông báo cho người tạo công thức
    const recipeAuthor = recipe.author || recipe.createdBy;
    if (recipeAuthor && recipeAuthor._id) {
      await Notification.create({
        user: recipeAuthor._id,
        type: "recipe_removed",
        title: "Công thức của bạn đã bị từ chối",
        message: `Công thức "${recipe.title}" của bạn đã bị admin từ chối${reason ? `: ${reason}` : ''}.`,
        reason: reason || "",
        relatedId: recipe._id,
        relatedType: "Recipe",
        isRead: false,
      });
      
      // Emit notification event via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${recipeAuthor._id}`).emit('newNotification');
        console.log(`📤 Emitted newNotification event to user:${recipeAuthor._id}`);
      }
      
      console.log(`✅ Đã tạo thông báo cho user ${recipeAuthor._id} về công thức bị từ chối`);
    }

    res.status(200).json({
      message: "Đã từ chối công thức",
      recipe: recipe,
    });
  } catch (error) {
    console.error("❌ Lỗi từ chối công thức:", error);
    res.status(500).json({ message: "Lỗi từ chối công thức", error: error.message });
  }
};

// 🧠 LẤY CÔNG THỨC ĐÃ XEM
export const getViewedRecipes = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Lấy lịch sử xem, sắp xếp theo thời gian xem gần nhất
    const viewHistory = await RecipeViewHistory.find({ user: req.user._id })
      .sort({ viewedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'recipe',
        match: { status: 'approved' }, // Chỉ lấy recipes đã approved
        populate: [
          { path: 'author', select: 'name email avatarUrl' },
          { path: 'category', select: 'name' }
        ]
      });

    // Lọc bỏ các recipe null (do match status)
    const validRecipes = viewHistory
      .map(item => item.recipe)
      .filter(recipe => recipe !== null);

    const total = await RecipeViewHistory.countDocuments({ user: req.user._id });

    res.status(200).json({
      message: "Lấy công thức đã xem thành công",
      recipes: validRecipes,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy công thức đã xem:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// 🧠 LẤY GỢI Ý DỰA TRÊN MÓN ĐÃ LƯU
export const getRecommendedRecipes = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Lấy danh sách công thức user đã lưu
    const savedRecipes = await Saved.find({ user: req.user._id })
      .populate('recipe', 'category categoryName')
      .lean();

    if (savedRecipes.length === 0) {
      // Nếu chưa lưu công thức nào, trả về công thức phổ biến
      const popularRecipes = await Recipe.find({ status: 'approved' })
        .populate("author", "name email avatarUrl")
        .populate("category", "name")
        .sort({ ratingCount: -1, averageRating: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Recipe.countDocuments({ status: 'approved' });

      return res.status(200).json({
        message: "Gợi ý công thức phổ biến",
        recipes: popularRecipes,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    }

    // Lấy các category từ công thức đã lưu
    const savedCategories = savedRecipes
      .map(item => {
        if (item.recipe && item.recipe.category) {
          return typeof item.recipe.category === 'object' 
            ? item.recipe.category._id 
            : item.recipe.category;
        }
        if (item.recipe && item.recipe.categoryName) {
          return item.recipe.categoryName;
        }
        return null;
      })
      .filter(Boolean);

    // Lấy các recipe ID đã lưu để loại trừ
    const savedRecipeIds = savedRecipes
      .map(item => item.recipe?._id || item.recipe)
      .filter(Boolean);

    // Tìm công thức cùng category hoặc categoryName
    let query = {
      status: 'approved',
      _id: { $nin: savedRecipeIds }, // Loại trừ công thức đã lưu
    };

    if (savedCategories.length > 0) {
      // Tìm theo category ObjectId hoặc categoryName
      const categoryIds = savedCategories.filter(cat => 
        typeof cat === 'object' || /^[0-9a-fA-F]{24}$/.test(cat)
      );
      const categoryNames = savedCategories.filter(cat => 
        typeof cat === 'string' && !/^[0-9a-fA-F]{24}$/.test(cat)
      );

      const categoryConditions = [];
      if (categoryIds.length > 0) {
        categoryConditions.push({ category: { $in: categoryIds } });
      }
      if (categoryNames.length > 0) {
        categoryConditions.push({ categoryName: { $in: categoryNames } });
      }

      if (categoryConditions.length > 0) {
        query.$or = categoryConditions;
      }
    }

    // Lấy công thức gợi ý
    const recommendedRecipes = await Recipe.find(query)
      .populate("author", "name email avatarUrl")
      .populate("category", "name")
      .sort({ ratingCount: -1, averageRating: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Recipe.countDocuments(query);

    res.status(200).json({
      message: "Gợi ý công thức dựa trên món đã lưu",
      recipes: recommendedRecipes,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy gợi ý công thức:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

