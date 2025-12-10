import mongoose from 'mongoose';
import Recipe from '../src/models/Recipe.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie';

async function checkRecentRecipes() {
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB thành công!\n');

    // Tìm 10 recipes mới nhất (bất kể status)
    const recentRecipes = await Recipe.find({})
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log(`📊 10 recipes mới nhất:\n`);

    if (recentRecipes.length === 0) {
      console.log('ℹ️  Không có recipes nào trong database.\n');
    } else {
      recentRecipes.forEach((recipe, index) => {
        console.log(`${index + 1}. ${recipe.title || '(Không có tiêu đề)'}`);
        console.log(`   ID: ${recipe._id}`);
        console.log(`   Status: ${recipe.status}`);
        console.log(`   Author: ${recipe.author?.name || recipe.author?.email || 'N/A'}`);
        console.log(`   Created: ${recipe.createdAt}`);
        console.log(`   Updated: ${recipe.updatedAt}`);
        console.log(`   Has Video: ${recipe.videoUrl ? '✅' : '❌'}`);
        console.log(`   Video URL: ${recipe.videoUrl ? recipe.videoUrl.substring(0, 50) + '...' : 'N/A'}`);
        console.log(`   Has Image: ${recipe.imageUrl ? '✅' : '❌'}`);
        console.log(`   Ingredients: ${recipe.ingredients?.length || 0}`);
        console.log(`   Steps: ${recipe.steps?.length || 0}`);
        console.log(`   Media Type: ${recipe.mediaType || 'N/A'}`);
        console.log('');
      });
    }

    // Tìm recipes được tạo trong 1 giờ qua
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const veryRecentRecipes = await Recipe.find({ 
      createdAt: { $gte: oneHourAgo } 
    })
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`\n📅 Recipes được tạo trong 1 giờ qua: ${veryRecentRecipes.length}`);
    if (veryRecentRecipes.length > 0) {
      console.log('\n📋 Danh sách recipes rất mới:\n');
      veryRecentRecipes.forEach((recipe, index) => {
        console.log(`${index + 1}. ${recipe.title || '(Không có tiêu đề)'}`);
        console.log(`   Status: ${recipe.status}`);
        console.log(`   ID: ${recipe._id}`);
        console.log(`   Author: ${recipe.author?.name || recipe.author?.email || 'N/A'}`);
        console.log(`   Created: ${recipe.createdAt}`);
        console.log(`   Has Video: ${recipe.videoUrl ? '✅' : '❌'}`);
        console.log(`   Has Image: ${recipe.imageUrl ? '✅' : '❌'}`);
        console.log('');
      });
    }

    // Thống kê tổng quan
    const totalRecipes = await Recipe.countDocuments();
    const approvedRecipes = await Recipe.countDocuments({ status: 'approved' });
    const pendingRecipes = await Recipe.countDocuments({ status: 'pending' });
    const rejectedRecipes = await Recipe.countDocuments({ status: 'rejected' });
    
    console.log('\n📊 Thống kê tổng quan:');
    console.log(`   Tổng số recipes: ${totalRecipes}`);
    console.log(`   Approved: ${approvedRecipes}`);
    console.log(`   Pending: ${pendingRecipes}`);
    console.log(`   Rejected: ${rejectedRecipes}`);
    
    // Kiểm tra recipes không có videoUrl
    const recipesWithoutVideo = await Recipe.countDocuments({ 
      videoUrl: { $exists: false } 
    });
    const recipesWithVideo = await Recipe.countDocuments({ 
      videoUrl: { $exists: true, $ne: null } 
    });
    
    console.log(`\n📹 Thống kê video:`);
    console.log(`   Recipes có video: ${recipesWithVideo}`);
    console.log(`   Recipes không có video: ${recipesWithoutVideo}`);

    await mongoose.disconnect();
    console.log('\n✅ Đã ngắt kết nối MongoDB.');
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

checkRecentRecipes();
