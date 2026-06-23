$ErrorActionPreference = 'Stop'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  GMAO Pro SaaS — Installation Automatisée' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

function Test-Command {
    param([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

# 1. Vérification Node & Docker
Write-Host '[1/6] Vérification des prérequis...' -ForegroundColor Yellow
if (-not (Test-Command "node")) { throw "Node.js est requis." }
if (-not (Test-Command "docker")) { throw "Docker est requis." }

# 2. Variables d'environnement
Write-Host '[2/6] Configuration de l"environnement...' -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host '  -> .env créé à la racine' -ForegroundColor Green
}
if (-not (Test-Path "backend/.env")) {
    Copy-Item ".env" "backend/.env"
    Write-Host '  -> .env copié dans backend' -ForegroundColor Green
}

# 3. Dépendances
Write-Host '[3/6] Installation des dépendances NPM...' -ForegroundColor Yellow
npm install
Push-Location frontend
npm install
Pop-Location
Push-Location backend
npm install
Pop-Location

# 4. Docker (PostgreSQL + MinIO + Adminer)
Write-Host '[4/6] Lancement des services Docker...' -ForegroundColor Yellow
docker compose up -d
Write-Host '  -> Attente de 5 secondes pour l"initialisation de la DB...' -ForegroundColor Magenta
Start-Sleep -Seconds 5

# 5. Base de données
Write-Host '[5/6] Migration et Seed de la base de données...' -ForegroundColor Yellow
Push-Location backend
npx prisma generate
npx prisma migrate deploy
npx ts-node prisma/seed.ts
Pop-Location

# 6. Démarrage
Write-Host '[6/6] Démarrage de l"application...' -ForegroundColor Yellow
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  Setup terminé ! L"application démarre...' -ForegroundColor Green
Write-Host '  Frontend : http://localhost:5173' -ForegroundColor Cyan
Write-Host '  Backend  : http://localhost:4000' -ForegroundColor Cyan
Write-Host '  MinIO    : http://localhost:9001 (gmao_admin / gmao_secret_minio)' -ForegroundColor Cyan
Write-Host '  Adminer  : http://localhost:8080' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan

npm run dev
