# Foodie Backend API

Backend API cho ứng dụng Foodie, xây dựng với Node.js, Express và MongoDB.

## 🚀 Cài đặt

```bash
npm install
```

## ⚙️ Cấu hình

Tạo file `.env` với các biến môi trường:

```env
MONGO_URI=mongodb://localhost:27017/foodie
JWT_SECRET=your-secret-key
PORT=8080
NODE_ENV=development
```

## 🏃 Chạy ứng dụng

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📡 API Endpoints

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/recipes` - Lấy danh sách công thức
- `POST /api/recipes` - Tạo công thức mới
- `GET /api/recipes/:id` - Lấy chi tiết công thức
- `POST /api/saved/:recipeId` - Lưu công thức
- `GET /api/saved/user/:userId` - Lấy công thức đã lưu

## 🗄️ Database

MongoDB với các collections chính:
- `users` - Người dùng
- `recipes` - Công thức
- `categories` - Danh mục
- `saveds` - Công thức đã lưu
- `posts` - Bài đăng
- `comments` - Bình luận

## 📝 Scripts

- `node scripts/createAdminUser.js` - Tạo user admin
- `node scripts/createCategories.js` - Tạo categories
- `node scripts/importRecipes.js [file.json]` - Import công thức
- `node scripts/addRecipeImages.js` - Thêm hình ảnh cho công thức

