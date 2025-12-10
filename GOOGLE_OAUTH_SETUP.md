# Hướng dẫn cấu hình Google OAuth cho Foodie App

## Vấn đề: Lỗi `redirect_uri_mismatch`

Lỗi này xảy ra khi redirect URI trong code không khớp với redirect URI đã cấu hình trong Google Cloud Console.

## Giải pháp:

### Bước 1: Kiểm tra Redirect URI hiện tại

App đang sử dụng các redirect URI sau:
- **Expo Proxy (mặc định)**: `https://auth.expo.io`
- **iOS**: `exp://localhost:8081` hoặc custom scheme
- **Android**: `exp://localhost:8081` hoặc custom scheme
- **Web**: `http://localhost:8081` hoặc production URL

### Bước 2: Thêm Redirect URI vào Google Cloud Console

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Đi tới **APIs & Services** > **Credentials**
4. Tìm OAuth 2.0 Client ID của bạn (có 3 client IDs cho iOS, Android, Web)
5. Click vào từng client ID và thêm các redirect URI sau:

#### Cho Web Client ID:
```
https://auth.expo.io
http://localhost:8081
http://localhost:19006
```

#### Cho iOS Client ID:
```
https://auth.expo.io
exp://localhost:8081
```

#### Cho Android Client ID:
```
https://auth.expo.io
exp://localhost:8081
```

### Bước 3: Kiểm tra Client IDs trong code

Đảm bảo các Client IDs trong code khớp với Google Cloud Console:

**File: `mobile/app/auth.tsx` và `mobile/app/register.tsx`**
```typescript
androidClientId: '238386495288-deuvq8vsub6e0t8e0pl44iknas36u2eq.apps.googleusercontent.com'
webClientId: '238386495288-deuvq8vsub6e0t8e0pl44iknas36u2eq.apps.googleusercontent.com'
iosClientId: '238386495288-hoqcbb2hb3g3ivgmtrt7t4jic21vi8qs.apps.googleusercontent.com'
```

### Bước 4: Nếu vẫn không hoạt động

Nếu vẫn gặp lỗi, thử các cách sau:

1. **Sử dụng redirect URI cụ thể hơn:**
   - Kiểm tra console log để xem redirect URI thực tế được sử dụng
   - Copy redirect URI đó và thêm vào Google Cloud Console

2. **Kiểm tra OAuth consent screen:**
   - Đảm bảo OAuth consent screen đã được cấu hình đúng
   - User type phải là "External" (cho production) hoặc "Internal" (cho testing)

3. **Kiểm tra scopes:**
   - Đảm bảo scopes `profile` và `email` đã được thêm vào OAuth consent screen

### Bước 5: Test lại

Sau khi cấu hình xong:
1. Restart app
2. Thử đăng nhập bằng Google lại
3. Kiểm tra console log để xem redirect URI được sử dụng

## Lưu ý quan trọng:

- **Development**: Sử dụng `https://auth.expo.io` (Expo proxy)
- **Production**: Cần cấu hình redirect URI phù hợp với production URL
- **iOS**: Cần thêm URL scheme vào `app.json`
- **Android**: Cần thêm intent filters vào `app.json`

## Troubleshooting:

Nếu vẫn gặp lỗi, kiểm tra:
1. Client IDs có đúng không?
2. Redirect URIs đã được thêm vào Google Cloud Console chưa?
3. OAuth consent screen đã được publish chưa?
4. App đang chạy ở môi trường nào (development/production)?

