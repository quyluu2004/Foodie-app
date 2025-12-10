import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../src/models/Category.js";
import { connectDB } from "../src/config/db.js";

dotenv.config();

// Mapping ảnh đại diện cho từng category từ Unsplash
// Sử dụng các query phù hợp với từng loại món ăn
const categoryImageMap = {
  "Món chính": "https://source.unsplash.com/800x600/?vietnamese-main-dish-food",
  "Món khai vị": "https://source.unsplash.com/800x600/?vietnamese-appetizer-food",
  "Món nước": "https://source.unsplash.com/800x600/?vietnamese-soup-noodle-pho",
  "Món chiên": "https://source.unsplash.com/800x600/?vietnamese-fried-food",
  "Món xào": "https://source.unsplash.com/800x600/?vietnamese-stir-fry-food",
  "Món nướng": "https://source.unsplash.com/800x600/?vietnamese-grilled-food-bbq",
  "Món hấp": "https://source.unsplash.com/800x600/?vietnamese-steamed-food",
  "Món chay": "https://source.unsplash.com/800x600/?vegetarian-vietnamese-food",
  "Món tráng miệng": "https://source.unsplash.com/800x600/?vietnamese-dessert-sweet",
  "Món ăn vặt": "https://source.unsplash.com/800x600/?vietnamese-street-food-snack",
};

// Tạo hash từ tên category để tạo URL ảnh khác nhau
function getCategoryImageUrl(categoryName) {
  // Nếu có trong map, dùng URL đó
  if (categoryImageMap[categoryName]) {
    // Tạo hash từ tên để thêm variation vào URL
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = ((hash << 5) - hash) + categoryName.charCodeAt(i);
      hash = hash & hash;
    }
    // Thêm hash vào query để tạo ảnh khác nhau
    const baseUrl = categoryImageMap[categoryName];
    return `${baseUrl}&sig=${Math.abs(hash)}`;
  }
  
  // Fallback: sử dụng query chung
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = ((hash << 5) - hash) + categoryName.charCodeAt(i);
    hash = hash & hash;
  }
  return `https://source.unsplash.com/800x600/?vietnamese-food&sig=${Math.abs(hash)}`;
}

const updateCategoryImages = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI không được tìm thấy trong .env");
      process.exit(1);
    }
    
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Đã kết nối database");

    // Lấy tất cả categories
    const categories = await Category.find();
    console.log(`📦 Tìm thấy ${categories.length} danh mục`);

    let updated = 0;
    let skipped = 0;

    for (const category of categories) {
      // Kiểm tra xem category đã có ảnh chưa
      if (category.imageUrl && category.imageUrl.trim() !== '') {
        console.log(`⏭️  Bỏ qua: "${category.name}" (đã có ảnh)`);
        skipped++;
        continue;
      }

      // Cập nhật ảnh cho category
      const imageUrl = getCategoryImageUrl(category.name);
      category.imageUrl = imageUrl;
      await category.save();
      
      console.log(`✅ Đã cập nhật ảnh cho: "${category.name}"`);
      console.log(`   URL: ${imageUrl}`);
      updated++;
    }

    console.log("\n📊 KẾT QUẢ:");
    console.log(`✅ Đã cập nhật: ${updated} danh mục`);
    console.log(`⏭️  Đã bỏ qua: ${skipped} danh mục (đã có ảnh)`);
    console.log(`📦 Tổng cộng: ${categories.length} danh mục`);

    await mongoose.connection.close();
    console.log("\n✅ Đã đóng kết nối database");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật ảnh category:", error);
    process.exit(1);
  }
};

// Chạy script
updateCategoryImages();

