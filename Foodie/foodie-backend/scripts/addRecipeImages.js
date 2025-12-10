/**
 * Script để tự động thêm hình ảnh cho các công thức không có ảnh
 * Sử dụng placeholder images dựa trên category hoặc tên món ăn
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Recipe from "../src/models/Recipe.js";
import Category from "../src/models/Category.js";
import { connectDB } from "../src/config/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mapping category -> placeholder image URL
const categoryImageMap = {
  "món chính": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop",
  "món khai vị": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop",
  "món tráng miệng": "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop",
  "món nước": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop",
  "món ăn vặt": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
  "đồ uống": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=600&fit=crop",
  "bánh": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop",
  "canh": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop",
  "salad": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop",
};

// Mapping từ tên món ăn -> image URL (một số món phổ biến)
const recipeImageMap = {
  "phở": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop",
  "bánh mì": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop",
  "bún": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop",
  "cơm": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop",
  "gỏi": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop",
  "chả": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop",
  "bánh xèo": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
  "bánh cuốn": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
  "bánh flan": "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop",
  "canh": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop",
  "chè": "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop",
};

/**
 * Tìm image URL phù hợp cho recipe
 */
function findImageForRecipe(recipe) {
  // Nếu đã có imageUrl hợp lệ, không cần thay đổi
  if (recipe.imageUrl && recipe.imageUrl.trim() !== '' && recipe.imageUrl.startsWith('http')) {
    return null; // Không cần update
  }

  const title = (recipe.title || '').toLowerCase();
  const categoryName = (recipe.categoryName || '').toLowerCase();

  // 1. Tìm theo tên món ăn
  for (const [keyword, imageUrl] of Object.entries(recipeImageMap)) {
    if (title.includes(keyword)) {
      return imageUrl;
    }
  }

  // 2. Tìm theo category
  for (const [catName, imageUrl] of Object.entries(categoryImageMap)) {
    if (categoryName.includes(catName)) {
      return imageUrl;
    }
  }

  // 3. Default image cho món ăn Việt Nam
  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop";
}

/**
 * Main function
 */
async function addRecipeImages() {
  try {
    // Kết nối database
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI không được tìm thấy trong .env");
      process.exit(1);
    }
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Đã kết nối database");

    // Tìm tất cả recipes không có imageUrl hoặc imageUrl rỗng hoặc không hợp lệ
    const recipesWithoutImages = await Recipe.find({
      $or: [
        { imageUrl: { $exists: false } },
        { imageUrl: null },
        { imageUrl: '' },
        { imageUrl: { $regex: /^\s*$/ } }, // Chỉ có khoảng trắng
        { imageUrl: { $not: { $regex: /^https?:\/\// } } } // Không phải URL hợp lệ
      ]
    }).populate('category', 'name');

    console.log(`📦 Tìm thấy ${recipesWithoutImages.length} công thức không có hình ảnh hợp lệ`);

    if (recipesWithoutImages.length === 0) {
      console.log("✅ Tất cả công thức đã có hình ảnh!");
      await mongoose.connection.close();
      process.exit(0);
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Cập nhật từng recipe
    for (const recipe of recipesWithoutImages) {
      try {
        // Populate categoryName nếu chưa có
        if (!recipe.categoryName && recipe.category) {
          if (typeof recipe.category === 'object' && recipe.category.name) {
            recipe.categoryName = recipe.category.name;
          }
        }

        const imageUrl = findImageForRecipe(recipe);
        
        if (imageUrl) {
          recipe.imageUrl = imageUrl;
          await recipe.save();
          updated++;
          console.log(`✅ Đã thêm ảnh cho: "${recipe.title}"`);
        } else {
          skipped++;
          console.log(`⏭️  Đã có ảnh hợp lệ, bỏ qua: "${recipe.title}"`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Lỗi cập nhật "${recipe.title}":`, error.message);
      }
    }

    console.log("\n📊 KẾT QUẢ:");
    console.log(`✅ Đã cập nhật: ${updated} công thức`);
    console.log(`⏭️  Đã bỏ qua: ${skipped} công thức`);
    console.log(`❌ Lỗi: ${errors} công thức`);

    // Đóng kết nối database
    await mongoose.connection.close();
    console.log("\n✅ Đã đóng kết nối database");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

// Chạy script
addRecipeImages();

