# Script dọn dẹp processes dư thừa
Write-Host "🧹 Dọn dẹp processes..." -ForegroundColor Cyan
Write-Host ""

# Dừng tất cả nodemon
$nodemonProcs = Get-Process -Name nodemon -ErrorAction SilentlyContinue
if ($nodemonProcs) {
    $nodemonProcs | Stop-Process -Force
    Write-Host "✅ Đã dừng $($nodemonProcs.Count) nodemon process(es)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Không có nodemon process nào" -ForegroundColor Gray
}

# Dừng tất cả node processes liên quan đến backend
$stopped = 0
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
        if ($cmd -and ($cmd -like "*foodie-backend*" -or $cmd -like "*nodemon*" -or ($cmd -like "*npm*run*dev*" -and $cmd -like "*foodie-backend*"))) {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            $stopped++
            Write-Host "✅ Đã dừng process $($_.Id)" -ForegroundColor Green
        }
    } catch {
        # Ignore errors
    }
}

if ($stopped -eq 0) {
    Write-Host "ℹ️  Không có node process nào liên quan đến backend" -ForegroundColor Gray
}

# Dừng process trên port 8080
$port = netstat -ano | findstr :8080
if ($port) {
    $parts = $port -split '\s+'
    $pid = $parts[-1]
    try {
        taskkill /F /PID $pid 2>$null | Out-Null
        Write-Host "✅ Đã dừng process trên port 8080 (PID: $pid)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Không thể dừng process $pid" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  Không có process nào trên port 8080" -ForegroundColor Gray
}

Write-Host ""
Start-Sleep -Seconds 2
Write-Host "✅ Hoàn tất dọn dẹp!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Bây giờ bạn có thể chạy: npm run dev" -ForegroundColor Cyan

