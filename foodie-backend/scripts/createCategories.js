import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../src/models/Category.js";
import { connectDB } from "../src/config/db.js";

dotenv.config();

// Danh sách categories từ file JSON
const categories = [
  { name: "Món khai vị", description: "Các món ăn khai vị, món đầu bữa" },
  { name: "Món chay", description: "Các món ăn chay, không có thịt" },
  { name: "Món nước", description: "Các món canh, súp, phở, bún" },
  { name: "Món chiên", description: "Các món chiên, rán" },
  { name: "Món xào", description: "Các món xào" },
  { name: "Món nướng", description: "Các món nướng" },
  { name: "Món hấp", description: "Các món hấp" },
  { name: "Món tráng miệng", description: "Các món tráng miệng, bánh ngọt" },
  { name: "Món ăn vặt", description: "Các món ăn vặt, snack" },
  { name: "Món chính", description: "Các món chính trong bữa ăn" },
];

const createCategories = async () => {
  try {
    // Kết nối database
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI không được tìm thấy trong .env");
      process.exit(1);
    }
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Đã kết nối database\n");

    let created = 0;
    let existing = 0;

    for (const categoryData of categories) {
      try {
        // Kiểm tra category đã tồn tại chưa
        const existingCategory = await Category.findOne({ 
          name: categoryData.name 
        });
        
        if (existingCategory) {
          console.log(`⏭️  Đã tồn tại: "${categoryData.name}"`);
          existing++;
        } else {
          // Tạo category mới
          await Category.create(categoryData);
          console.log(`✅ Đã tạo: "${categoryData.name}"`);
          created++;
        }
      } catch (error) {
        console.error(`❌ Lỗi khi xử lý "${categoryData.name}":`, error.message);
      }
    }

    console.log("\n📊 KẾT QUẢ:");
    console.log(`✅ Đã tạo mới: ${created} danh mục`);
    console.log(`⏭️  Đã tồn tại: ${existing} danh mục`);
    console.log(`📦 Tổng cộng: ${categories.length} danh mục\n`);

    // Hiển thị tất cả categories
    const allCategories = await Category.find();
    console.log("📋 Danh sách tất cả categories trong database:");
    allCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name}`);
    });

    // Đóng kết nối database
    await mongoose.connection.close();
    console.log("\n✅ Đã đóng kết nối database");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi tạo categories:", error);
    process.exit(1);
  }
};

createCategories();

