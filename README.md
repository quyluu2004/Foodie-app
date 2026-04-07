# Foodie App

Ứng dụng chia sẻ công thức nấu ăn và cộng đồng: người dùng xem/tạo công thức, bài đăng, bình luận, premium, thông báo realtime. Repo gồm **API Node.js**, **ứng dụng mobile (Expo)** và **bảng quản trị web**.

## Cấu trúc thư mục

| Thư mục | Mô tả |
|--------|--------|
| `foodie-backend/` | REST API + Socket.io (Express, MongoDB, JWT, Cloudinary, v.v.) |
| `mobile/` | Ứng dụng người dùng: Expo Router, React Native, hỗ trợ iOS / Android / Web |
| `foodie-admin/` | Trang quản trị: React + Vite, Tailwind, gọi cùng API backend |

Thư mục gốc có `package.json` tối giản (ví dụ TypeScript dùng chung); mỗi app cài dependency và chạy script trong **thư mục tương ứng**.

## Yêu cầu môi trường

- **Node.js** (khuyến nghị LTS)
- **MongoDB** (URI kết nối trong biến môi trường backend)
- (Tuỳ chọn) **Expo Go** hoặc **Xcode / Android Studio** để build native

## Backend (`foodie-backend`)

1. Vào thư mục và cài package:

   ```bash
   cd foodie-backend
   npm install
   ```

2. Tạo file **`foodie-backend/.env`** với các biến **bắt buộc**:

   - `MONGO_URI` — chuỗi kết nối MongoDB  
   - `JWT_SECRET` — chuỗi bí mật **ít nhất 32 ký tự** (ví dụ sinh bằng `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

   Biến **tuỳ chọn** (tính năng upload/AI): `JWT_REFRESH_SECRET`, `CLOUDINARY_*`, `GEMINI_API_KEY`, cấu hình email, v.v. theo nhu cầu.

3. Chạy dev (mặc định API thường lắng nghe **cổng 8080**):

   ```bash
   npm run dev
   ```

## Ứng dụng mobile (`mobile`)

API mặc định trong code: `http://localhost:8080/api`, có logic resolve IP khi chạy Expo trên thiết bị thật / emulator (xem `mobile/config/api.ts`).

```bash
cd mobile
npm install
npm run start
```

- `npm run web` — mở bản web (Expo)  
- `npm run android` / `npm run ios` — mở trên máy ảo / thiết bị  

Đảm bảo backend đang chạy và URL/API khớp môi trường của bạn.

## Admin quản trị (`foodie-admin`)

```bash
cd foodie-admin
npm install
npm run dev
```

Mặc định Vite phục vụ tại **http://localhost:5173**. Base URL API trong `foodie-admin/src/utils/api.js` là `http://localhost:8080/api` — chỉnh lại nếu backend chạy host/port khác.

## Luồng phát triển gợi ý

1. Khởi động **MongoDB** và **backend** (`foodie-backend`).  
2. Chạy **mobile** hoặc **foodie-admin** tùy màn hình cần test.  
3. Đăng nhập / tạo tài khoản theo luồng app (có thể có script `npm run create-admin` trong backend nếu cần user admin).

## Tài liệu bổ sung

- Cấu hình API chi tiết: `mobile/config/api.ts`, `mobile/contexts/api.ts`  
- Client admin: `foodie-admin/src/utils/api.js`  
- Entry server: `foodie-backend/src/server.js`

## License

Theo từng `package.json` trong từng package (thường private / ISC).
