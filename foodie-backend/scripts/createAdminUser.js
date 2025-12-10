import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import { connectDB } from '../src/config/db.js';

dotenv.config({ path: './.env' });

const createAdminUser = async () => {
  try {
    // Kết nối database
    await connectDB(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'Admin@123';
    const password = '123456';
    const name = 'Admin User';

    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      console.log('⚠️  User đã tồn tại!');
      console.log('   Email:', existingUser.email);
      console.log('   Role:', existingUser.role);
      
      // Cập nhật role thành admin nếu chưa phải
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log('✅ Đã cập nhật role thành admin');
      }
      
      // Cập nhật password
      const salt = await bcrypt.genSalt(10);
      existingUser.passwordHash = await bcrypt.hash(password, salt);
      await existingUser.save();
      console.log('✅ Đã cập nhật mật khẩu');
      
      mongoose.connection.close();
      return;
    }

    // Tạo user mới
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const adminUser = await User.create({
      email: email.toLowerCase(),
      passwordHash: passwordHash,
      name: name,
      role: 'admin',
      // Không set gender, sẽ dùng default ""
    });

    console.log('✅ Đã tạo admin user thành công!');
    console.log('   Email:', adminUser.email);
    console.log('   Name:', adminUser.name);
    console.log('   Role:', adminUser.role);
    console.log('');
    console.log('📝 Thông tin đăng nhập:');
    console.log('   Email: Admin@123');
    console.log('   Password: 123456');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Lỗi khi tạo admin user:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

createAdminUser();

