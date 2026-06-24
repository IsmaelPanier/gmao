$ErrorActionPreference = 'Stop'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  GMAO Pro — Installation Automatisée' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

# 1. Validation environnement
.\scripts\check.ps1

# 2. Installation des dépendances en parallèle (Monorepo)
Write-Host '[3/6] Installation des dépendances (NPM Workspaces)...' -ForegroundColor Yellow
# npm install at root will automatically handle frontend and backend workspaces in parallel
npm install

# 3. Docker Services
.\scripts\docker.ps1

# 4. Database Setup
.\scripts\db.ps1

# 5. Run Application
.\scripts\run.ps1
