/**
 * Script để dọn dẹp saved recipes có recipe null (đã bị xóa)
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Saved from "../src/models/Saved.js";
import Recipe from "../src/models/Recipe.js";
import { connectDB } from "../src/config/db.js";

dotenv.config();

async function cleanupNullSavedRecipes() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Đã kết nối database\n");

    // Tìm tất cả saved và kiểm tra recipe có tồn tại không
    const allSaved = await Saved.find({}).populate('recipe');
    const nullSavedRecipes = allSaved.filter((saved) => !saved.recipe);
    
    console.log(`📦 Tìm thấy ${nullSavedRecipes.length} saved recipes có recipe null\n`);

    if (nullSavedRecipes.length === 0) {
      console.log("✅ Không có saved recipes nào cần dọn dẹp!");
      await mongoose.connection.close();
      process.exit(0);
    }

    // Hiển thị thông tin
    console.log("📋 Danh sách saved recipes cần xóa:");
    nullSavedRecipes.forEach((saved, index) => {
      console.log(`${index + 1}. Saved ID: ${saved._id}, User: ${saved.user}, Recipe: ${saved.recipe || 'NULL'}, Created: ${saved.createdAt}`);
    });

    // Xóa các saved recipes có recipe null
    const idsToDelete = nullSavedRecipes.map((saved) => saved._id);
    const result = await Saved.deleteMany({ _id: { $in: idsToDelete } });
    console.log(`\n🗑️  Đã xóa ${result.deletedCount} saved recipes có recipe null`);

    // Kiểm tra lại
    const remainingNull = await Saved.countDocuments({ recipe: null });
    console.log(`📊 Còn lại ${remainingNull} saved recipes có recipe null`);

    await mongoose.connection.close();
    console.log("\n✅ Đã đóng kết nối database");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

cleanupNullSavedRecipes();

