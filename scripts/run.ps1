$ErrorActionPreference = 'Stop'

Write-Host '[6/6] Démarrage de l"application...' -ForegroundColor Yellow
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  Setup terminé ! L"application démarre...' -ForegroundColor Green
Write-Host '  Frontend : http://localhost:5173' -ForegroundColor Cyan
Write-Host '  Backend  : http://localhost:4000' -ForegroundColor Cyan
Write-Host '  MinIO    : http://localhost:9001 (gmao_admin / gmao_secret_minio)' -ForegroundColor Cyan
Write-Host '  Adminer  : http://localhost:8080' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan

# Lancement via concurrently défini dans package.json root
npm run dev
