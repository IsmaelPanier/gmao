$ErrorActionPreference = 'Stop'

Write-Host '[1/6] Validation de l"environnement et des prérequis...' -ForegroundColor Yellow

function Test-Command {
    param([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

# 1. Check Node & NPM
if (-not (Test-Command "node")) { throw "Node.js est requis et non trouvé dans le PATH." }
if (-not (Test-Command "npm")) { throw "NPM est requis et non trouvé dans le PATH." }

$nodeVer = node -v
$npmVer = npm -v
Write-Host "  -> Node.js version : $nodeVer" -ForegroundColor Green
Write-Host "  -> NPM version : $npmVer" -ForegroundColor Green

# 2. Check Docker
if (-not (Test-Command "docker")) { throw "Docker est requis et non trouvé dans le PATH." }

try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Le démon Docker ne semble pas en cours d'exécution."
    }
    Write-Host "  -> Docker est bien lancé." -ForegroundColor Green
} catch {
    throw "Erreur de connexion à Docker. Vérifiez que Docker Desktop ou le démon Docker est lancé."
}

# 3. Environment variables
Write-Host '[2/6] Configuration des variables d"environnement...' -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host '  -> .env racine créé.' -ForegroundColor Green
} else {
    Write-Host '  -> .env racine existant.' -ForegroundColor DarkGray
}

if (-not (Test-Path "backend/.env")) {
    Copy-Item ".env" "backend/.env"
    Write-Host '  -> .env backend créé.' -ForegroundColor Green
} else {
    Write-Host '  -> .env backend existant.' -ForegroundColor DarkGray
}

Write-Host "Validation terminée avec succès." -ForegroundColor Green
