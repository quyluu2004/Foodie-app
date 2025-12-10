import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from '../src/models/Recipe.js';
import { connectDB } from '../src/config/db.js';

dotenv.config();

// Script để kiểm tra URLs có lỗi httpps://
const checkImageUrls = async () => {
  try {
    // Kết nối database
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI không được tìm thấy trong .env');
      process.exit(1);
    }
    await connectDB(process.env.MONGO_URI);
    console.log('✅ Đã kết nối database');

    // Tìm tất cả recipes có imageUrl chứa httpps://
    const recipes = await Recipe.find({
      imageUrl: { $regex: /httpps:\/\//i }
    });

    console.log(`📦 Tìm thấy ${recipes.length} recipes có URL bị lỗi (httpps://)`);

    if (recipes.length > 0) {
      console.log('\n📋 Danh sách recipes có URL lỗi:');
      recipes.forEach((recipe, index) => {
        console.log(`\n[${index + 1}] ${recipe.title}`);
        console.log(`   URL: ${recipe.imageUrl.substring(0, 100)}...`);
      });
    } else {
      console.log('✅ Không có URL nào bị lỗi trong database');
    }

    // Đóng kết nối database
    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối database');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi kiểm tra image URLs:', error);
    process.exit(1);
  }
};

// Chạy script
checkImageUrls();

