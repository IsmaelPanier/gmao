$ErrorActionPreference = 'Stop'

Write-Host '[6/6] Démarrage de l"application...' -ForegroundColor Yellow

$ipInfo = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback|vEthernet|Pseudo|WSL' -and $_.IPAddress -notmatch '^169\.254\.' -and $_.IPAddress -notmatch '^127\.' } | Select-Object -First 1
$ip = if ($ipInfo) { $ipInfo.IPAddress } else { "localhost" }

Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  Setup terminé ! L"application démarre...' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host '  ACCES LOCAL (Sur ce PC) :' -ForegroundColor Yellow
Write-Host '  Frontend : http://localhost:5173' -ForegroundColor Cyan
Write-Host '  Backend  : http://localhost:4000' -ForegroundColor Cyan
Write-Host ''
Write-Host '  ACCES MOBILE (Sur le même réseau) :' -ForegroundColor Yellow
Write-Host "  Frontend : http://$ip:5173" -ForegroundColor Green
Write-Host "  Backend  : http://$ip:4000" -ForegroundColor Green
Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  MinIO    : http://localhost:9001 (gmao_admin / gmao_secret_minio)' -ForegroundColor DarkGray
Write-Host '  Adminer  : http://localhost:8080' -ForegroundColor DarkGray
Write-Host '============================================================' -ForegroundColor Cyan

# Lancement via concurrently défini dans package.json root
npm run dev
