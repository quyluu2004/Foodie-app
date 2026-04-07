@echo off
REM Script để lấy SHA-1 certificate fingerprint cho Android
REM Chạy script này: get-sha1.bat

echo 🔍 Đang tìm SHA-1 certificate fingerprint...
echo.

REM Đường dẫn đến debug keystore mặc định
set DEBUG_KEYSTORE=%USERPROFILE%\.android\debug.keystore

if exist "%DEBUG_KEYSTORE%" (
    echo ✅ Tìm thấy debug keystore
    echo.
    echo 📋 SHA-1 Certificate Fingerprint:
    echo.
    
    REM Lấy SHA-1 fingerprint
    keytool -list -v -keystore "%DEBUG_KEYSTORE%" -alias androiddebugkey -storepass android -keypass android | findstr "SHA1:"
    
    echo.
    echo 💡 Copy giá trị SHA1: ở trên và dán vào Google Cloud Console
) else (
    echo ❌ Không tìm thấy debug keystore tại: %DEBUG_KEYSTORE%
    echo.
    echo 📝 Có thể keystore chưa được tạo. Hãy thử:
    echo    1. Chạy app Android một lần để Expo tạo keystore
    echo    2. Hoặc tạo keystore thủ công bằng lệnh keytool
)

pause

