import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from '../src/models/Recipe.js';
import { connectDB } from '../src/config/db.js';

dotenv.config();

// Script để fix URLs bị lỗi httpps:// thành https://
const fixImageUrls = async () => {
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

    if (recipes.length === 0) {
      console.log('✅ Không có URL nào cần sửa');
      await mongoose.connection.close();
      process.exit(0);
    }

    let fixed = 0;
    let errors = 0;

    // Fix từng recipe
    for (const recipe of recipes) {
      try {
        if (recipe.imageUrl && recipe.imageUrl.includes('httpps://')) {
          const fixedUrl = recipe.imageUrl.replace(/httpps:\/\//gi, 'https://');
          
          await Recipe.updateOne(
            { _id: recipe._id },
            { $set: { imageUrl: fixedUrl } }
          );
          
          fixed++;
          console.log(`✅ Đã sửa: "${recipe.title}"`);
          console.log(`   Từ: ${recipe.imageUrl.substring(0, 80)}...`);
          console.log(`   Thành: ${fixedUrl.substring(0, 80)}...`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Lỗi khi sửa "${recipe.title}":`, error.message);
      }
    }

    console.log('\n📊 KẾT QUẢ:');
    console.log(`✅ Đã sửa: ${fixed} recipes`);
    console.log(`❌ Lỗi: ${errors} recipes`);

    // Đóng kết nối database
    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối database');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi fix image URLs:', error);
    process.exit(1);
  }
};

// Chạy script
fixImageUrls();

