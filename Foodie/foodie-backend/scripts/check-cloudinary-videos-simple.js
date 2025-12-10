// Script đơn giản để kiểm tra video trên Cloudinary
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('🔍 Cloudinary Configuration:');
console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET');
console.log('   API Key:', process.env.CLOUDINARY_API_KEY ? '***SET***' : 'NOT SET');
console.log('   API Secret:', process.env.CLOUDINARY_API_SECRET ? '***SET***' : 'NOT SET');
console.log('');

async function checkVideos() {
  try {
    console.log('📹 Checking videos in Cloudinary...');
    console.log('   Folder: foodie/videos');
    console.log('');

    // List resources trong folder foodie/videos
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'video',
      prefix: 'foodie/videos',
      max_results: 50
    });

    console.log(`✅ Found ${result.resources?.length || 0} video(s) in Cloudinary`);
    console.log('');

    if (result.resources && result.resources.length > 0) {
      console.log('📋 Video List:');
      console.log('─'.repeat(100));
      
      result.resources.forEach((video, index) => {
        console.log(`\n${index + 1}. ${video.public_id}`);
        console.log(`   URL: ${video.secure_url}`);
        console.log(`   Format: ${video.format}`);
        console.log(`   Duration: ${video.duration ? Math.round(video.duration) + 's' : 'N/A'}`);
        console.log(`   Size: ${video.bytes ? (video.bytes / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}`);
        console.log(`   Created: ${video.created_at}`);
        console.log(`   Width: ${video.width || 'N/A'} x Height: ${video.height || 'N/A'}`);
      });
      
      console.log('\n' + '─'.repeat(100));
      console.log('\n💡 Để xem video trên Cloudinary Dashboard:');
      console.log('   1. Truy cập: https://console.cloudinary.com/');
      console.log('   2. Đăng nhập với tài khoản Cloudinary');
      console.log('   3. Vào Media Library > Folders > foodie > videos');
      console.log('   4. Click vào video để xem và play');
    } else {
      console.log('⚠️  No videos found in Cloudinary');
      console.log('');
      console.log('💡 Có thể:');
      console.log('   - Video chưa được upload lên Cloudinary');
      console.log('   - Video được lưu ở folder khác');
      console.log('   - Backend chưa restart sau khi cập nhật .env');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('💡 Kiểm tra:');
    console.error('   1. Cloudinary credentials trong .env có đúng không?');
    console.error('   2. Internet connection có ổn không?');
  }
}

checkVideos();

