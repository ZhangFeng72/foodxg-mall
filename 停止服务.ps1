Write-Host "停止 foodxg 环境（只停本项目的进程）..."
foreach ($p in 8080, 6379) {
    $conn = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $p }
    if ($conn) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host "已停止端口 $p" }
}
$mysqld = Get-CimInstance Win32_Process -Filter "Name='mysqld.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*mysql-data-foodxg*' }
foreach ($m in $mysqld) { Stop-Process -Id $m.ProcessId -Force -ErrorAction SilentlyContinue; Write-Host "已停止 3307 实例" }
Write-Host "完成。原有 MySQL95(3306) 服务未受影响。"
