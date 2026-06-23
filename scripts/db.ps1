$ErrorActionPreference = 'Stop'

Write-Host '[5/6] Migration et Seed de la base de données...' -ForegroundColor Yellow

Push-Location backend

Write-Host '  -> Génération du client Prisma...' -ForegroundColor Cyan
npx prisma generate

Write-Host '  -> Synchronisation de la base de données (db push)...' -ForegroundColor Cyan
$nodeEnv = if ($env:NODE_ENV) { $env:NODE_ENV } else { "development" }
if ($nodeEnv -ne "development") {
    throw "db push --accept-data-loss est interdit hors développement (NODE_ENV=$nodeEnv). Utilisez les migrations Prisma en production."
}
npx prisma db push --accept-data-loss

if (-not (Test-Path ".seed_done")) {
    Write-Host '  -> Exécution du seed initial...' -ForegroundColor Cyan
    npx ts-node prisma/seed.ts
    New-Item -ItemType File -Name ".seed_done" -Force | Out-Null
    Write-Host '  -> Seed terminé et protégé contre la duplication.' -ForegroundColor Green
} else {
    Write-Host '  -> Seed déjà exécuté précédemment (ignoré).' -ForegroundColor DarkGray
}

Pop-Location
