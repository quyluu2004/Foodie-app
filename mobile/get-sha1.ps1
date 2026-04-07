# Script để lấy SHA-1 certificate fingerprint cho Android
# Chạy script này trong PowerShell: .\get-sha1.ps1

Write-Host "🔍 Đang tìm SHA-1 certificate fingerprint..." -ForegroundColor Cyan

# Đường dẫn đến debug keystore mặc định
$debugKeystore = "$env:USERPROFILE\.android\debug.keystore"

if (Test-Path $debugKeystore) {
    Write-Host "✅ Tìm thấy debug keystore tại: $debugKeystore" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 SHA-1 Certificate Fingerprint:" -ForegroundColor Yellow
    Write-Host ""
    
    # Lấy SHA-1 fingerprint
    keytool -list -v -keystore $debugKeystore -alias androiddebugkey -storepass android -keypass android | Select-String "SHA1:"
    
    Write-Host ""
    Write-Host "💡 Copy giá trị SHA1: ở trên và dán vào Google Cloud Console" -ForegroundColor Cyan
} else {
    Write-Host "❌ Không tìm thấy debug keystore tại: $debugKeystore" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Có thể keystore chưa được tạo. Hãy thử:" -ForegroundColor Yellow
    Write-Host "   1. Chạy app Android một lần để Expo tạo keystore" -ForegroundColor White
    Write-Host "   2. Hoặc tạo keystore thủ công:" -ForegroundColor White
    Write-Host "      keytool -genkey -v -keystore $debugKeystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android" -ForegroundColor Gray
}

