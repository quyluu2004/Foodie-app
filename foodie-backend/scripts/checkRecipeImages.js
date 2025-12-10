/**
 * Script để kiểm tra và sửa hình ảnh cho các công thức
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Recipe from "../src/models/Recipe.js";
import { connectDB } from "../src/config/db.js";

dotenv.config();

async function checkRecipeImages() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Đã kết nối database\n");

    // Lấy tất cả recipes
    const recipes = await Recipe.find({}).select('title imageUrl categoryName').limit(50);
    
    console.log(`📦 Tìm thấy ${recipes.length} công thức (hiển thị 50 đầu tiên)\n`);
    
    let hasImage = 0;
    let noImage = 0;
    let invalidUrl = 0;

    recipes.forEach((recipe, index) => {
      const hasImageUrl = recipe.imageUrl && recipe.imageUrl.trim() !== '';
      const isValidUrl = hasImageUrl && (recipe.imageUrl.startsWith('http://') || recipe.imageUrl.startsWith('https://'));
      
      if (isValidUrl) {
        hasImage++;
        console.log(`${index + 1}. ✅ "${recipe.title}" - ${recipe.imageUrl.substring(0, 60)}...`);
      } else if (hasImageUrl) {
        invalidUrl++;
        console.log(`${index + 1}. ⚠️  "${recipe.title}" - URL không hợp lệ: ${recipe.imageUrl}`);
      } else {
        noImage++;
        console.log(`${index + 1}. ❌ "${recipe.title}" - KHÔNG CÓ ẢNH`);
      }
    });

    console.log(`\n📊 THỐNG KÊ:`);
    console.log(`✅ Có ảnh hợp lệ: ${hasImage}`);
    console.log(`⚠️  URL không hợp lệ: ${invalidUrl}`);
    console.log(`❌ Không có ảnh: ${noImage}`);
    console.log(`📦 Tổng cộng: ${recipes.length}`);

    // Kiểm tra tổng số recipes
    const totalRecipes = await Recipe.countDocuments();
    console.log(`\n📊 Tổng số recipes trong DB: ${totalRecipes}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

checkRecipeImages();

