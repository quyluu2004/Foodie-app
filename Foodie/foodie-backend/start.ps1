# Script khởi động server với auto-cleanup
Write-Host "🚀 Khởi động Foodie Backend Server..." -ForegroundColor Cyan
Write-Host ""

# Kiểm tra xem có process nào đang dùng port 8080 không
$port8080 = netstat -ano | findstr :8080 | findstr LISTENING
if ($port8080) {
    Write-Host "⚠️  Phát hiện process đang dùng port 8080" -ForegroundColor Yellow
    Write-Host "🧹 Đang dọn dẹp..." -ForegroundColor Yellow
    
    # Chạy cleanup script nếu có
    if (Test-Path ".\cleanup.ps1") {
        .\cleanup.ps1
    } else {
        # Manual cleanup
        $parts = $port8080 -split '\s+'
        $pid = $parts[-1]
        taskkill /F /PID $pid 2>$null | Out-Null
        Write-Host "✅ Đã dừng process $pid" -ForegroundColor Green
    }
    
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "▶️  Đang khởi động server..." -ForegroundColor Cyan
Write-Host ""

# Khởi động server
npm run dev

