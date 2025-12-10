import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Recipe from "../models/Recipe.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import { connectDB } from "../config/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hàm import recipes từ file JSON
export const importRecipes = async (jsonFilePath, options = {}) => {
  const { force = false, update = false } = options;
  
  try {
    // Kết nối database
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI không được tìm thấy trong .env");
      process.exit(1);
    }
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Đã kết nối database");

    // Đọc file JSON
    const filePath = path.join(__dirname, "..", "..", jsonFilePath);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Không tìm thấy file: ${filePath}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const recipesData = JSON.parse(fileContent);

    if (!Array.isArray(recipesData)) {
      console.error("❌ File JSON phải là một mảng");
      process.exit(1);
    }

    console.log(`📦 Tìm thấy ${recipesData.length} công thức trong file`);
    
    // Nếu force = true, xóa tất cả recipes trước khi import
    if (force) {
      const deletedCount = await Recipe.deleteMany({});
      console.log(`🗑️  Đã xóa ${deletedCount.deletedCount} công thức cũ (force mode)`);
    }

    // Lấy hoặc tạo admin user để làm author mặc định
    let defaultUser = await User.findOne({ role: "admin" });
    if (!defaultUser) {
      defaultUser = await User.findOne();
    }
    if (!defaultUser) {
      console.error("❌ Không tìm thấy user nào trong database. Vui lòng tạo user trước.");
      process.exit(1);
    }

    // Lấy hoặc tạo categories
    const categoryMap = new Map();
    const categories = await Category.find();
    categories.forEach((cat) => {
      categoryMap.set(cat.name.toLowerCase(), cat._id);
    });

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Import từng recipe
    for (const recipeData of recipesData) {
      try {
        // Kiểm tra recipe đã tồn tại chưa (theo title)
        const existingRecipe = await Recipe.findOne({ title: recipeData.title });
        if (existingRecipe) {
          if (update) {
            // Update recipe đã tồn tại
            // Xử lý category
            let categoryId = null;
            const categoryName = (recipeData.categoryName || recipeData.category || "").trim();
            
            if (categoryName) {
              const categoryKey = categoryName.toLowerCase();
              if (categoryMap.has(categoryKey)) {
                categoryId = categoryMap.get(categoryKey);
              } else {
                const newCategory = await Category.create({
                  name: categoryName,
                  description: `Danh mục ${categoryName}`,
                });
                categoryMap.set(categoryKey, newCategory._id);
                categoryId = newCategory._id;
                console.log(`📁 Đã tạo category mới: ${categoryName}`);
              }
            }

            const recipeToUpdate = {
              description: recipeData.description || existingRecipe.description,
              ingredients: Array.isArray(recipeData.ingredients)
                ? recipeData.ingredients
                : recipeData.ingredients
                ? [recipeData.ingredients]
                : existingRecipe.ingredients,
              steps: Array.isArray(recipeData.steps)
                ? recipeData.steps
                : recipeData.steps
                ? [recipeData.steps]
                : existingRecipe.steps,
              category: categoryId || existingRecipe.category,
              categoryName: categoryName || existingRecipe.categoryName,
              imageUrl: recipeData.imageUrl || recipeData.image || existingRecipe.imageUrl,
              cookTimeMinutes: recipeData.cookTimeMinutes || recipeData.time || existingRecipe.cookTimeMinutes,
              time: recipeData.time || recipeData.cookTimeMinutes || existingRecipe.time,
              difficulty: recipeData.difficulty || existingRecipe.difficulty,
              servings: recipeData.servings || existingRecipe.servings,
            };

            await Recipe.findByIdAndUpdate(existingRecipe._id, recipeToUpdate);
            updated++;
            console.log(`🔄 Đã cập nhật: "${recipeData.title}"`);
          } else {
            console.log(`⏭️  Bỏ qua: "${recipeData.title}" (đã tồn tại)`);
            skipped++;
          }
          continue;
        }

        // Xử lý category - ưu tiên categoryName nếu có
        let categoryId = null;
        const categoryName = (recipeData.categoryName || recipeData.category || "").trim();
        
        if (categoryName) {
          const categoryKey = categoryName.toLowerCase();

          if (categoryMap.has(categoryKey)) {
            categoryId = categoryMap.get(categoryKey);
          } else {
            // Tạo category mới
            const newCategory = await Category.create({
              name: categoryName,
              description: `Danh mục ${categoryName}`,
            });
            categoryMap.set(categoryKey, newCategory._id);
            categoryId = newCategory._id;
            console.log(`📁 Đã tạo category mới: ${categoryName}`);
          }
        }

        // Chuẩn bị dữ liệu recipe
        const recipeToCreate = {
          title: recipeData.title || "Công thức không tên",
          description: recipeData.description || "",
          ingredients: Array.isArray(recipeData.ingredients)
            ? recipeData.ingredients
            : recipeData.ingredients
            ? [recipeData.ingredients]
            : [],
          steps: Array.isArray(recipeData.steps)
            ? recipeData.steps
            : recipeData.steps
            ? [recipeData.steps]
            : [],
          category: categoryId,
          categoryName: categoryName || recipeData.category || "",
          imageUrl: recipeData.imageUrl || recipeData.image || "",
          cookTimeMinutes: recipeData.cookTimeMinutes || recipeData.time || 0,
          time: recipeData.time || recipeData.cookTimeMinutes || 0,
          difficulty: recipeData.difficulty || "Dễ",
          servings: recipeData.servings || 1,
          author: defaultUser._id,
          createdBy: defaultUser._id,
          status: recipeData.status || "approved", // Import tự động approved
          createdAt: recipeData.createdAt ? new Date(recipeData.createdAt) : new Date(),
          updatedAt: recipeData.updatedAt ? new Date(recipeData.updatedAt) : new Date(),
        };

        // Tạo recipe
        await Recipe.create(recipeToCreate);
        imported++;
        console.log(`✅ Đã import: "${recipeData.title}"`);
      } catch (error) {
        errors++;
        console.error(`❌ Lỗi import "${recipeData.title}":`, error.message);
      }
    }

    console.log("\n📊 KẾT QUẢ IMPORT:");
    console.log(`✅ Đã import mới: ${imported} công thức`);
    if (update) {
      console.log(`🔄 Đã cập nhật: ${updated} công thức`);
    }
    console.log(`⏭️  Đã bỏ qua: ${skipped} công thức (trùng)`);
    console.log(`❌ Lỗi: ${errors} công thức`);
    console.log(`📦 Tổng cộng: ${recipesData.length} công thức trong file`);
    console.log(`📊 Tổng trong DB sau import: ${await Recipe.countDocuments()} công thức`);

    // Đóng kết nối database
    await mongoose.connection.close();
    console.log("\n✅ Đã đóng kết nối database");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi import recipes:", error);
    process.exit(1);
  }
};

// Chạy nếu được gọi trực tiếp
if (import.meta.url === `file://${process.argv[1]}`) {
  const jsonFilePath = process.argv[2] || "recipes.json";
  importRecipes(jsonFilePath);
}

