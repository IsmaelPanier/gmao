$ErrorActionPreference = 'Stop'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  GMAO Pro — Installation des dépendances Windows' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

function Test-Command {
    param([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

# 1. Node.js
Write-Host '[1/3] Vérification de Node.js...' -ForegroundColor Yellow
if (-not (Test-Command "node")) {
    Write-Host '  -> Node.js est introuvable. Installation via winget...' -ForegroundColor Magenta
    winget install OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements
    
    Write-Host '  -> Node.js installé avec succès !' -ForegroundColor Green
    
    # Recharger les variables d'environnement dans la session actuelle
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
} else {
    $nodeVersion = node -v
    Write-Host "  -> Node.js est déjà installé ($nodeVersion)." -ForegroundColor Green
}

# 2. Docker
Write-Host '[2/3] Vérification de Docker...' -ForegroundColor Yellow
if (-not (Test-Command "docker")) {
    Write-Host '  -> Docker est introuvable. Installation de Docker Desktop via winget...' -ForegroundColor Magenta
    winget install Docker.DockerDesktop -e --silent --accept-source-agreements --accept-package-agreements
    
    Write-Host '  -> Docker installé avec succès !' -ForegroundColor Green
    Write-Host '  [!] ATTENTION : Docker nécessite souvent un redémarrage de Windows.' -ForegroundColor Red
    Write-Host '  [!] Assurez-vous que l"icône Docker (la baleine) tourne en bas à droite de votre écran avant de continuer.' -ForegroundColor Red
    
    # Recharger le PATH au cas où
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
} else {
    Write-Host "  -> Docker est déjà installé." -ForegroundColor Green
}

# 3. Exécution de setup.ps1
Write-Host '[3/3] Démarrage de l"environnement du projet (setup.ps1)...' -ForegroundColor Yellow

# On vérifie si Docker Engine est actif avant de lancer setup (sinon ça plantera)
try {
    docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host '  [!] Docker est installé, mais le moteur (Engine) ne tourne pas.' -ForegroundColor Red
        Write-Host '  [!] Veuillez lancer "Docker Desktop" via le menu Démarrer et attendre quil soit prêt, puis relancez ce script.' -ForegroundColor Red
        exit
    }
} catch {
    Write-Host '  [!] Impossible de vérifier le statut de Docker. Lancez Docker Desktop manuellement.' -ForegroundColor Red
    exit
}

if (Test-Path ".\setup.ps1") {
    Write-Host '  -> Lancement de setup.ps1...' -ForegroundColor Cyan
    & .\setup.ps1
} else {
    Write-Host "  [!] Erreur : Le fichier setup.ps1 est introuvable dans ce dossier !" -ForegroundColor Red
}
