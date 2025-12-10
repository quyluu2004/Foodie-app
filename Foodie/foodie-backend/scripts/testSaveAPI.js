/**
 * Script để test API lưu công thức và bài đăng
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Saved from "../src/models/Saved.js";
import Recipe from "../src/models/Recipe.js";
import Post from "../src/models/Post.js";
import User from "../src/models/User.js";
import { connectDB } from "../src/config/db.js";

dotenv.config();

async function testSaveAPI() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Đã kết nối database\n");

    // Lấy user đầu tiên
    const user = await User.findOne({});
    if (!user) {
      console.log("❌ Không tìm thấy user nào trong database");
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`👤 Test với user: ${user.name} (${user._id})\n`);

    // Lấy một recipe
    const recipe = await Recipe.findOne({ status: 'approved' });
    if (!recipe) {
      console.log("❌ Không tìm thấy recipe nào trong database");
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`📖 Test với recipe: ${recipe.title} (${recipe._id})\n`);

    // Test 1: Kiểm tra saved recipes hiện tại
    console.log("📊 Test 1: Kiểm tra saved recipes hiện tại");
    const currentSaved = await Saved.find({ user: user._id });
    console.log(`   Số saved recipes hiện tại: ${currentSaved.length}`);
    if (currentSaved.length > 0) {
      console.log(`   Saved recipes:`, currentSaved.map(s => s.recipe?.toString() || 'NULL'));
    }
    console.log('');

    // Test 2: Tạo saved record mới
    console.log("💾 Test 2: Tạo saved record mới");
    try {
      const newSaved = await Saved.create({
        user: user._id,
        recipe: recipe._id,
      });
      console.log(`   ✅ Đã tạo saved record: ${newSaved._id}`);
    } catch (error) {
      if (error.code === 11000) {
        console.log(`   ⚠️  Saved record đã tồn tại (duplicate key)`);
      } else {
        console.error(`   ❌ Lỗi tạo saved record:`, error.message);
      }
    }
    console.log('');

    // Test 3: Kiểm tra saved recipes sau khi tạo
    console.log("📊 Test 3: Kiểm tra saved recipes sau khi tạo");
    const afterSaved = await Saved.find({ user: user._id }).populate('recipe', 'title');
    console.log(`   Số saved recipes: ${afterSaved.length}`);
    afterSaved.forEach((saved, index) => {
      const recipeTitle = saved.recipe?.title || '[Recipe đã bị xóa]';
      console.log(`   ${index + 1}. ${recipeTitle} (${saved.recipe?._id || 'NULL'})`);
    });
    console.log('');

    // Test 4: Kiểm tra saved posts
    console.log("📊 Test 4: Kiểm tra saved posts");
    const SavedPost = (await import("../src/models/SavedPost.js")).default;
    const savedPosts = await SavedPost.find({ user: user._id }).populate('post', 'caption');
    console.log(`   Số saved posts: ${savedPosts.length}`);
    if (savedPosts.length > 0) {
      savedPosts.forEach((saved, index) => {
        const caption = saved.post?.caption?.substring(0, 30) || '[Post đã bị xóa]';
        console.log(`   ${index + 1}. ${caption} (${saved.post?._id || 'NULL'})`);
      });
    }
    console.log('');

    await mongoose.connection.close();
    console.log("✅ Đã đóng kết nối database");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

testSaveAPI();

