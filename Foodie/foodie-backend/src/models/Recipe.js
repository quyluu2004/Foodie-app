import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    ingredients: { type: [String], default: [] },
    steps: { type: [String], default: [] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    categoryName: String, // Lưu tên category để dễ query
    imageUrl: String, // Giữ lại cho backward compatibility
    // Video fields
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    videoUrl: String, // Main video URL từ Cloudinary
    videoThumbnail: String, // Thumbnail URL từ Cloudinary
    videoQualities: [{
      quality: String, // "480p", "720p", "1080p"
      url: String
    }],
    videoDuration: Number, // Duration in seconds
    videoSize: Number, // File size in bytes
    videoFormat: String, // "mp4", "mov"
    cookTimeMinutes: Number,
    time: Number, // Alias cho cookTimeMinutes
    difficulty: { 
      type: String, 
      enum: ["Dễ", "Trung bình", "Khó", "easy", "medium", "hard"], 
      default: "Dễ"
    },
    servings: Number,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Alias cho author
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
    // Ratings: lưu tổng rating và số lượng đánh giá để tính trung bình
    totalRating: { type: Number, default: 0 }, // Tổng điểm rating
    ratingCount: { type: Number, default: 0 }, // Số lượng đánh giá
    averageRating: { type: Number, default: 0 } // Điểm trung bình (tự động tính)
  },
  { timestamps: true }
);

// Middleware để tự động sync categoryName với category trước khi save
recipeSchema.pre('save', async function(next) {
  // Sync categoryName với category
  if (this.category && !this.categoryName) {
    try {
      // Nếu category đã được populate, lấy name trực tiếp
      if (typeof this.category === 'object' && this.category !== null && this.category.name) {
        this.categoryName = this.category.name;
      } else {
        // Nếu chưa populate, query từ database
        const Category = mongoose.model('Category');
        const category = await Category.findById(this.category);
        if (category) {
          this.categoryName = category.name;
        }
      }
    } catch (error) {
      console.warn('⚠️ Không thể sync categoryName:', error.message);
      // Không throw error, chỉ log warning
    }
  } else if (!this.category) {
    // Nếu không có category, set categoryName = null
    this.categoryName = null;
  }

  // Đảm bảo author và createdBy luôn đồng bộ
  if (this.author && !this.createdBy) {
    this.createdBy = this.author;
  } else if (this.createdBy && !this.author) {
    this.author = this.createdBy;
  }

  // Tính averageRating
  if (this.ratingCount > 0) {
    this.averageRating = Math.round((this.totalRating / this.ratingCount) * 10) / 10; // Làm tròn 1 chữ số thập phân
  } else {
    this.averageRating = 0;
  }
  
  next();
});

// Index để tìm kiếm nhanh
recipeSchema.index({ category: 1 });
recipeSchema.index({ author: 1 });
recipeSchema.index({ status: 1 });
recipeSchema.index({ title: 'text' }); // Text index cho tìm kiếm theo tên
recipeSchema.index({ difficulty: 1 });
recipeSchema.index({ averageRating: -1 }); // Index cho rating (descending)

export default mongoose.model("Recipe", recipeSchema);
