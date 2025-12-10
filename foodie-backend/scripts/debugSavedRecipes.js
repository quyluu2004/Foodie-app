import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Saved from '../src/models/Saved.js';
import Recipe from '../src/models/Recipe.js';
import User from '../src/models/User.js';
import { connectDB } from '../src/config/db.js';

dotenv.config();

async function debugSavedRecipes() {
  try {
    // Kết nối MongoDB
    await connectDB(process.env.MONGO_URI);
    console.log('✅ Đã kết nối MongoDB thành công!');
    console.log('✅ Đã kết nối database\n');

    // Lấy tất cả saved records
    const allSaved = await Saved.find({}).populate('user', 'name email').populate('recipe', 'title _id');
    
    console.log(`📦 Tổng số saved records trong DB: ${allSaved.length}\n`);

    if (allSaved.length === 0) {
      console.log('⚠️  Không có saved records nào trong database!');
      console.log('💡 Hãy thử lưu một công thức từ app để tạo saved record.');
      await mongoose.disconnect();
      return;
    }

    // Nhóm theo user
    const savedByUser = {};
    allSaved.forEach((saved) => {
      const userId = saved.user?._id?.toString() || 'unknown';
      const userName = saved.user?.name || 'Unknown User';
      
      if (!savedByUser[userId]) {
        savedByUser[userId] = {
          name: userName,
          saved: []
        };
      }
      
      savedByUser[userId].saved.push({
        savedId: saved._id,
        recipeId: saved.recipe?._id?.toString() || 'NULL',
        recipeTitle: saved.recipe?.title || '[Recipe đã bị xóa]',
        hasRecipe: !!saved.recipe,
        createdAt: saved.createdAt
      });
    });

    // Hiển thị kết quả
    console.log('📊 Saved Recipes theo User:\n');
    Object.keys(savedByUser).forEach((userId) => {
      const userData = savedByUser[userId];
      console.log(`👤 User: ${userData.name} (${userId})`);
      console.log(`   📌 Số công thức đã lưu: ${userData.saved.length}`);
      
      userData.saved.forEach((item, index) => {
        const status = item.hasRecipe ? '✅' : '❌';
        console.log(`   ${status} ${index + 1}. ${item.recipeTitle} (Recipe ID: ${item.recipeId})`);
        if (!item.hasRecipe) {
          console.log(`      ⚠️  Recipe đã bị xóa - savedId: ${item.savedId}`);
        }
      });
      console.log('');
    });

    // Kiểm tra recipes có tồn tại không
    console.log('\n🔍 Kiểm tra chi tiết recipes:\n');
    for (const saved of allSaved) {
      if (saved.recipe) {
        const recipe = await Recipe.findById(saved.recipe._id);
        if (!recipe) {
          console.log(`❌ Recipe ${saved.recipe._id} không tồn tại trong DB (orphaned saved record)`);
        } else {
          console.log(`✅ Recipe ${saved.recipe._id} tồn tại: "${recipe.title}"`);
        }
      } else {
        console.log(`❌ Saved record ${saved._id} có recipe = null`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Đã ngắt kết nối MongoDB');
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

debugSavedRecipes();

