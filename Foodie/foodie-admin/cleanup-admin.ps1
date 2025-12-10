# Script dọn dẹp Admin Dashboard processes
Write-Host "🧹 Don dep Admin Dashboard processes..." -ForegroundColor Cyan
Write-Host ""

# Dừng tất cả Vite processes
$viteProcs = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    try {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
        $cmd -like "*vite*" -or ($cmd -like "*foodie-admin*" -and $cmd -like "*npm*run*dev*")
    } catch {
        $false
    }
}

if ($viteProcs) {
    $viteProcs | Stop-Process -Force
    Write-Host "✅ Đã dừng $($viteProcs.Count) Vite process(es)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Không có Vite process nào" -ForegroundColor Gray
}

# Dừng processes trên ports 5173, 5174, 5175
$ports = @(5173, 5174, 5175)
foreach ($port in $ports) {
    $portInfo = netstat -ano | findstr ":$port" | findstr LISTENING
    if ($portInfo) {
        $parts = $portInfo -split '\s+'
        $pid = $parts[-1]
        try {
            taskkill /F /PID $pid 2>$null | Out-Null
            Write-Host "✅ Đã dừng process trên port $port (PID: $pid)" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Không thể dừng process trên port $port" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Start-Sleep -Seconds 2
Write-Host "✅ Hoàn tất dọn dẹp!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Bây giờ bạn có thể chạy: npm run dev" -ForegroundColor Cyan

