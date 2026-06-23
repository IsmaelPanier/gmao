$ErrorActionPreference = 'Stop'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  GMAO Pro — Automated Setup Script' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

Write-Host '[0/6] Setting up environment variables...' -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host '  -> .env created' -ForegroundColor Green
}
if (-not (Test-Path "backend/.env")) {
    Copy-Item ".env" "backend/.env"
}

Write-Host '[1/6] Starting Docker services...' -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) { throw "Docker failed" }

Write-Host 'Waiting 5 seconds for DB to be ready...'
Start-Sleep -Seconds 5

Write-Host '[2/5] Installing npm dependencies...' -ForegroundColor Yellow
npm install

Write-Host '[3/5] Generating Prisma client...' -ForegroundColor Yellow
Push-Location backend

npx prisma generate

Write-Host '[4/5] Running database migrations and seed...' -ForegroundColor Yellow
npx prisma db push
npx ts-node prisma/seed.ts

Pop-Location

Write-Host '[5/5] Starting application...' -ForegroundColor Yellow
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  Setup complete! Starting GMAO Pro...' -ForegroundColor Green
Write-Host '  Frontend: http://localhost:5173' -ForegroundColor Cyan
Write-Host '  Backend:  http://localhost:4000' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan

npm run dev
