Write-Host "开始启动 foodxg 环境..."
$ini = 'E:\develop\mysql-foodxg.ini'
$redis = 'E:\develop\redis\redis-server.exe'
$jar = 'E:\foodxg\sky-take-out\sky-take-out\sky-server\target\sky-server-1.0-SNAPSHOT.jar'

$mysqlUp = (Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 3307 } | Measure-Object).Count
if ($mysqlUp -eq 0) {
    Start-Process -FilePath 'F:\MySQL\mysql-9.7.4-winx64\bin\mysqld.exe' -ArgumentList "--defaults-file=$ini" -WindowStyle Hidden
    Write-Host "MySQL(3307) 已启动"
} else { Write-Host "MySQL(3307) 已在运行" }

$redisUp = (Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 6379 } | Measure-Object).Count
if ($redisUp -eq 0) {
    Start-Process -FilePath $redis -ArgumentList '--port','6379' -WindowStyle Hidden
    Write-Host "Redis(6379) 已启动"
} else { Write-Host "Redis(6379) 已在运行" }

Start-Sleep -Seconds 5

$appUp = (Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 8080 } | Measure-Object).Count
if ($appUp -eq 0) {
    $env:JAVA_HOME = 'E:\develop\jdk11'
    Start-Process -FilePath 'E:\develop\jdk11\bin\java.exe' -ArgumentList '-jar', $jar -WorkingDirectory 'E:\foodxg\sky-take-out\sky-take-out\sky-server' -WindowStyle Hidden -RedirectStandardOutput 'E:\foodxg\_setup\app.out.log' -RedirectStandardError 'E:\foodxg\_setup\app.err.log'
    Write-Host "后端启动中，约 10 秒后可访问 http://127.0.0.1:8080/doc.html"
} else { Write-Host "后端已在运行" }

Write-Host ""
Write-Host "管理后台：http://127.0.0.1:8080/admin-ui/index.html  （账号 admin / 123456）"
Write-Host "手机点餐：http://127.0.0.1:8080/h5/"
Write-Host "统一入口：http://127.0.0.1:8080/"
Write-Host "接口文档：http://127.0.0.1:8080/doc.html"
