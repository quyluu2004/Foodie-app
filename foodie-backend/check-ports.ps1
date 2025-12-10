# Script kiểm tra cổng và process
Write-Host "🔍 KIỂM TRA CỔNG VÀ PROCESS" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra cổng 8080
Write-Host "📊 Cổng 8080 (Backend API):" -ForegroundColor Yellow
$port8080 = netstat -ano | findstr :8080
if ($port8080) {
    Write-Host "✅ Cổng 8080 đang được sử dụng:" -ForegroundColor Green
    $port8080 | ForEach-Object {
        $parts = $_ -split '\s+'
        $pid = $parts[-1]
        try {
            $proc = Get-Process -Id $pid -ErrorAction Stop
            $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $pid").CommandLine
            Write-Host "  - PID: $pid" -ForegroundColor White
            Write-Host "  - Process: $($proc.ProcessName)" -ForegroundColor White
            Write-Host "  - Path: $($proc.Path)" -ForegroundColor White
            Write-Host "  - Command: $cmd" -ForegroundColor Gray
            Write-Host ""
        } catch {
            Write-Host "  - PID: $pid (Process not found)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ Cổng 8080 không được sử dụng" -ForegroundColor Red
}

Write-Host ""

# Kiểm tra các cổng khác
Write-Host "📊 Các cổng khác (Vite, Expo, etc.):" -ForegroundColor Yellow
$otherPorts = @(3000, 3001, 5173, 8081, 19000, 19001, 19002, 5000, 5001, 4000, 4001)
$foundPorts = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -in $otherPorts}

if ($foundPorts) {
    $foundPorts | ForEach-Object {
        try {
            $proc = Get-Process -Id $_.OwningProcess -ErrorAction Stop
            Write-Host "  - Port $($_.LocalPort): PID $($_.OwningProcess) - $($proc.ProcessName)" -ForegroundColor White
        } catch {
            Write-Host "  - Port $($_.LocalPort): PID $($_.OwningProcess) (Process not found)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ✅ Không có cổng nào khác đang được sử dụng" -ForegroundColor Green
}

Write-Host ""

# Kiểm tra các process node đang chạy
Write-Host "📊 Tất cả Node.js processes:" -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        try {
            $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
            Write-Host "  - PID: $($_.Id) | $cmd" -ForegroundColor White
        } catch {
            Write-Host "  - PID: $($_.Id) | (Cannot get command)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  ✅ Không có Node.js process nào đang chạy" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Hoàn tất kiểm tra!" -ForegroundColor Green

