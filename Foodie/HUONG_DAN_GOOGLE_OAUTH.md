# Hướng dẫn cấu hình Google OAuth - Bước từng bước

## Bước 1: Chọn Project
1. Trong Google Cloud Console, chọn project **"Foodie App"** (Project ID: foodie-app-478717)

## Bước 2: Đi tới OAuth Credentials
1. Từ menu bên trái, chọn **"APIs & Services"** (APIs và Dịch vụ)
2. Chọn **"Credentials"** (Thông tin xác thực)
3. Bạn sẽ thấy danh sách các OAuth 2.0 Client IDs

## Bước 3: Tìm và chỉnh sửa OAuth Client IDs
Bạn sẽ thấy 3 Client IDs (hoặc nhiều hơn):
- **Web client** (cho web)
- **iOS client** (cho iOS)
- **Android client** (cho Android)

### Cho Web Client ID (QUAN TRỌNG NHẤT):
**Đây là nơi bạn CẦN thêm redirect URI cho cả iOS, Android và Web!**

1. Click vào Client ID có tên chứa "Web" hoặc có Client ID: `238386495288-deuvq8vsub6e0t8e0pl44iknas36u2eq`
2. Scroll xuống phần **"Authorized redirect URIs"**
3. Click **"ADD URI"** và thêm các URI sau (mỗi URI một dòng):
   ```
   https://auth.expo.io
   http://localhost:8081
   http://localhost:19006
   ```
   **Lưu ý:** `https://auth.expo.io` là redirect URI chính cho Expo development, cần thiết cho cả iOS và Android!
4. Click **"SAVE"**

### Cho iOS Client ID:
**LƯU Ý QUAN TRỌNG:** iOS client KHÔNG có phần "Authorized redirect URIs" - điều này là bình thường!

1. Click vào Client ID có tên chứa "iOS" hoặc có Client ID: `238386495288-hoqcbb2hb3g3ivgmtrt7t4jic21vi8qs`
2. **Chỉ cần đảm bảo:**
   - **Bundle ID** đúng: `com.foodie.mobile` (đã có sẵn)
   - **Name**: "foodie iOS client" (hoặc tên bạn muốn)
3. Click **"SAVE"** (nếu có thay đổi)
4. **Redirect URI cho iOS sẽ được xử lý bởi Web client** (xem phần Web client bên dưới)

### Cho Android Client ID:
**LƯU Ý:** Android client có thể có hoặc không có phần "Authorized redirect URIs" tùy vào loại client.

1. Click vào Client ID có tên chứa "Android" hoặc có Client ID: `238386495288-deuvq8vsub6e0t8e0pl44iknas36u2eq`
2. **Nếu có phần "Authorized redirect URIs":**
   - Click **"ADD URI"** và thêm:
     ```
     https://auth.expo.io
     exp://localhost:8081
     ```
   - Click **"SAVE"**
3. **Nếu KHÔNG có phần "Authorized redirect URIs":**
   - Điều này là bình thường, redirect URI sẽ được xử lý bởi **Web client** (xem phần Web client ở trên)
   - Chỉ cần đảm bảo **Package name** đúng và click **"SAVE"**

## Bước 4: Kiểm tra OAuth Consent Screen
1. Vẫn trong **"APIs & Services"**, chọn **"OAuth consent screen"**
2. Đảm bảo:
   - **User type**: External (cho production) hoặc Internal (cho testing)
   - **Scopes**: Đã thêm `profile` và `email`
   - **Test users**: Nếu đang ở chế độ testing, thêm email của bạn vào danh sách test users

## Bước 5: Test lại
1. Đợi 1-2 phút để Google cập nhật cấu hình
2. Restart app mobile
3. Thử đăng nhập bằng Google lại

## Lưu ý quan trọng:
- Redirect URI phải khớp **chính xác** (kể cả `http://` vs `https://`)
- Không có khoảng trắng thừa ở đầu/cuối URI
- Mỗi URI phải trên một dòng riêng
- Nếu vẫn lỗi, kiểm tra console log trong app để xem redirect URI thực tế được sử dụng

## Nếu không tìm thấy Client IDs:
1. Trong **"Credentials"**, click **"+ CREATE CREDENTIALS"**
2. Chọn **"OAuth client ID"**
3. Chọn Application type:
   - **Web application** (cho web)
   - **iOS** (cho iOS)
   - **Android** (cho Android)
4. Điền thông tin và thêm redirect URIs như trên

