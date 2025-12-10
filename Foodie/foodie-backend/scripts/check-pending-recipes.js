import mongoose from 'mongoose';
import Recipe from '../src/models/Recipe.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie';

async function checkPendingRecipes() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB thành công!\n');

    // Tìm tất cả recipes có status = 'pending'
    const pendingRecipes = await Recipe.find({ status: 'pending' })
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Tổng số recipes pending: ${pendingRecipes.length}\n`);

    if (pendingRecipes.length === 0) {
      console.log('ℹ️  Không có recipes nào có status = "pending" trong database.');
      console.log('   Có thể dữ liệu cũ đã bị lỗi khi save hoặc đã được approve.\n');
    } else {
      console.log('📋 Danh sách recipes pending:\n');
      pendingRecipes.forEach((recipe, index) => {
        console.log(`${index + 1}. ${recipe.title || '(Không có tiêu đề)'}`);
        console.log(`   ID: ${recipe._id}`);
        console.log(`   Author: ${recipe.author?.name || recipe.author?.email || 'N/A'}`);
        console.log(`   Created: ${recipe.createdAt}`);
        console.log(`   Has Video: ${recipe.videoUrl ? '✅' : '❌'}`);
        console.log(`   Has Image: ${recipe.imageUrl ? '✅' : '❌'}`);
        console.log(`   Ingredients: ${recipe.ingredients?.length || 0}`);
        console.log(`   Steps: ${recipe.steps?.length || 0}`);
        console.log('');
      });
    }

    // Tìm tất cả recipes được tạo trong 24h qua (bất kể status)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    const recentRecipes = await Recipe.find({ 
      createdAt: { $gte: oneDayAgo } 
    })
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`\n📅 Recipes được tạo trong 24h qua: ${recentRecipes.length}`);
    if (recentRecipes.length > 0) {
      console.log('\n📋 Danh sách recipes gần đây:\n');
      recentRecipes.forEach((recipe, index) => {
        console.log(`${index + 1}. ${recipe.title || '(Không có tiêu đề)'}`);
        console.log(`   Status: ${recipe.status}`);
        console.log(`   ID: ${recipe._id}`);
        console.log(`   Author: ${recipe.author?.name || recipe.author?.email || 'N/A'}`);
        console.log(`   Created: ${recipe.createdAt}`);
        console.log('');
      });
    }

    // Thống kê tổng quan
    const totalRecipes = await Recipe.countDocuments();
    const approvedRecipes = await Recipe.countDocuments({ status: 'approved' });
    const rejectedRecipes = await Recipe.countDocuments({ status: 'rejected' });
    
    console.log('\n📊 Thống kê tổng quan:');
    console.log(`   Tổng số recipes: ${totalRecipes}`);
    console.log(`   Approved: ${approvedRecipes}`);
    console.log(`   Pending: ${pendingRecipes.length}`);
    console.log(`   Rejected: ${rejectedRecipes}`);

    await mongoose.disconnect();
    console.log('\n✅ Đã ngắt kết nối MongoDB.');
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

checkPendingRecipes();

