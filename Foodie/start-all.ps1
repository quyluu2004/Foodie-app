# Script khởi động tất cả services của Foodie
Write-Host "🚀 Khởi động tất cả services Foodie..." -ForegroundColor Cyan
Write-Host ""

# Kiểm tra thư mục
if (-not (Test-Path "foodie-backend")) {
    Write-Host "❌ Không tìm thấy thư mục foodie-backend!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "mobile")) {
    Write-Host "❌ Không tìm thấy thư mục mobile!" -ForegroundColor Red
    exit 1
}

# Terminal 1: Backend
Write-Host "📡 Đang khởi động Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\foodie-backend'; Write-Host '📡 Backend API' -ForegroundColor Cyan; .\start.ps1"

Start-Sleep -Seconds 3

# Terminal 2: Mobile
Write-Host "📱 Đang khởi động Mobile App..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\mobile'; Write-Host '📱 Mobile App' -ForegroundColor Cyan; npm start"

Start-Sleep -Seconds 2

# Hỏi có muốn chạy Admin không
Write-Host ""
$runAdmin = Read-Host "Bạn có muốn chạy Admin Dashboard? (y/n)"

if ($runAdmin -eq "y" -or $runAdmin -eq "Y") {
    if (Test-Path "foodie-admin") {
        Write-Host "💻 Đang khởi động Admin Dashboard..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\foodie-admin'; Write-Host '💻 Admin Dashboard' -ForegroundColor Cyan; npm run dev"
        Start-Sleep -Seconds 2
    } else {
        Write-Host "⚠️  Không tìm thấy thư mục foodie-admin" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Đã khởi động tất cả services!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Thông tin services:" -ForegroundColor Cyan
Write-Host "  📡 Backend API: http://localhost:8080" -ForegroundColor White
Write-Host "  📱 Mobile App: Expo DevTools sẽ mở tự động" -ForegroundColor White
if ($runAdmin -eq "y" -or $runAdmin -eq "Y") {
    Write-Host "  💻 Admin Dashboard: http://localhost:5173" -ForegroundColor White
}
Write-Host ""
Write-Host "💡 Mỗi service chạy trong terminal riêng" -ForegroundColor Yellow
Write-Host "💡 Nhấn Ctrl+C trong mỗi terminal để dừng service" -ForegroundColor Yellow

