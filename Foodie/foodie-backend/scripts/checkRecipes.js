import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Recipe from "../src/models/Recipe.js";
import { connectDB } from "../src/config/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hàm kiểm tra số lượng recipes
const checkRecipes = async (jsonFilePath) => {
  try {
    // Kết nối database
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI không được tìm thấy trong .env");
      process.exit(1);
    }
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Đã kết nối database\n");

    // Đọc file JSON
    const filePath = path.join(__dirname, "..", jsonFilePath);
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

    console.log(`📦 File JSON có ${recipesData.length} công thức\n`);

    // Đếm số lượng recipes trong database
    const totalInDB = await Recipe.countDocuments();
    console.log(`📊 Tổng số recipes trong database: ${totalInDB}\n`);

    // Kiểm tra từng recipe trong file JSON xem đã tồn tại chưa
    let existingCount = 0;
    let missingCount = 0;
    const existingTitles = [];
    const missingTitles = [];

    for (const recipeData of recipesData) {
      const existingRecipe = await Recipe.findOne({ title: recipeData.title });
      if (existingRecipe) {
        existingCount++;
        existingTitles.push(recipeData.title);
      } else {
        missingCount++;
        missingTitles.push(recipeData.title);
      }
    }

    console.log("📋 KẾT QUẢ KIỂM TRA:");
    console.log(`✅ Đã tồn tại trong DB: ${existingCount} công thức`);
    console.log(`❌ Chưa có trong DB: ${missingCount} công thức\n`);

    if (missingCount > 0) {
      console.log("📝 Danh sách các món chưa có trong DB (10 món đầu):");
      missingTitles.slice(0, 10).forEach((title, index) => {
        console.log(`   ${index + 1}. ${title}`);
      });
      if (missingTitles.length > 10) {
        console.log(`   ... và ${missingTitles.length - 10} món khác`);
      }
      console.log("");
    }

    if (existingCount > 0) {
      console.log("📝 Danh sách các món đã có trong DB (10 món đầu):");
      existingTitles.slice(0, 10).forEach((title, index) => {
        console.log(`   ${index + 1}. ${title}`);
      });
      if (existingTitles.length > 10) {
        console.log(`   ... và ${existingTitles.length - 10} món khác`);
      }
      console.log("");
    }

    // Đóng kết nối database
    await mongoose.connection.close();
    console.log("✅ Đã đóng kết nối database");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi kiểm tra recipes:", error);
    process.exit(1);
  }
};

// Chạy script
const jsonFilePath = process.argv[2] || "data/recipes-vietnam-200.json";
checkRecipes(jsonFilePath);

