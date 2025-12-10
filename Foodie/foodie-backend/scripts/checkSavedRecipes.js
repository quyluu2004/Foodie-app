/**
 * Script để kiểm tra saved recipes trong database
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Saved from "../src/models/Saved.js";
import Recipe from "../src/models/Recipe.js";
import User from "../src/models/User.js";
import { connectDB } from "../src/config/db.js";

dotenv.config();

async function checkSavedRecipes() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Đã kết nối database\n");

    // Lấy tất cả users
    const users = await User.find({}).select('_id name email').limit(10);
    console.log(`📦 Tìm thấy ${users.length} users (hiển thị 10 đầu tiên)\n`);

    for (const user of users) {
      const savedCount = await Saved.countDocuments({ user: user._id });
      console.log(`👤 User: ${user.name || user.email} (${user._id})`);
      console.log(`   📌 Số công thức đã lưu: ${savedCount}`);

      if (savedCount > 0) {
        const savedList = await Saved.find({ user: user._id })
          .populate('recipe', 'title imageUrl')
          .limit(5);
        
        console.log(`   📋 Danh sách (5 đầu tiên):`);
        savedList.forEach((saved, index) => {
          if (saved.recipe) {
            console.log(`      ${index + 1}. "${saved.recipe.title}" (${saved.recipe._id})`);
            console.log(`         Image: ${saved.recipe.imageUrl || 'NO IMAGE'}`);
          } else {
            console.log(`      ${index + 1}. [Recipe đã bị xóa]`);
          }
        });
      }
      console.log('');
    }

    // Tổng số saved recipes
    const totalSaved = await Saved.countDocuments({});
    console.log(`📊 Tổng số saved recipes trong DB: ${totalSaved}`);

    // Kiểm tra saved recipes có recipe null
    const savedWithNullRecipe = await Saved.countDocuments({ recipe: null });
    console.log(`⚠️  Saved recipes có recipe null: ${savedWithNullRecipe}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

checkSavedRecipes();

