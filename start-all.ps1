# Script khoi dong tat ca services cua Foodie
Write-Host "🚀 Starting all Foodie services..." -ForegroundColor Cyan
Write-Host ""

# Kiem tra thu muc
if (-not (Test-Path "foodie-backend")) {
    Write-Host "❌ foodie-backend directory not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "mobile")) {
    Write-Host "❌ mobile directory not found!" -ForegroundColor Red
    exit 1
}

# Terminal 1: Backend
Write-Host "📡 Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\foodie-backend'; Write-Host '📡 Backend API' -ForegroundColor Cyan; .\start.ps1"

Start-Sleep -Seconds 3

# Terminal 2: Mobile
Write-Host "📱 Starting Mobile App..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\mobile'; Write-Host '📱 Mobile App' -ForegroundColor Cyan; npm start"

Start-Sleep -Seconds 2

# Hoi co muon chay Admin khong
Write-Host ""
$runAdmin = Read-Host "Do you want to run Admin Dashboard? (y/n)"

if ($runAdmin -eq "y" -or $runAdmin -eq "Y") {
    if (Test-Path "foodie-admin") {
        Write-Host "💻 Starting Admin Dashboard..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\foodie-admin'; Write-Host '💻 Admin Dashboard' -ForegroundColor Cyan; npm run dev"
        Start-Sleep -Seconds 2
    } else {
        Write-Host "⚠️  foodie-admin directory not found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Services Info:" -ForegroundColor Cyan
Write-Host "  📡 Backend API: http://localhost:8080" -ForegroundColor White
Write-Host "  📱 Mobile App: Expo DevTools will open automatically" -ForegroundColor White
if ($runAdmin -eq "y" -or $runAdmin -eq "Y") {
    Write-Host "  💻 Admin Dashboard: http://localhost:5173" -ForegroundColor White
}
Write-Host ""
Write-Host "💡 Each service runs in its own terminal" -ForegroundColor Yellow
Write-Host "💡 Press Ctrl+C in each terminal to stop the service" -ForegroundColor Yellow
