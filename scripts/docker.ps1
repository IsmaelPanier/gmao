$ErrorActionPreference = 'Stop'

Write-Host '[4/6] Lancement des services Docker...' -ForegroundColor Yellow

# Démarrage des conteneurs
docker compose up -d

# Fonction d'attente intelligente pour PostgreSQL
function Wait-Postgres {
    Write-Host "  -> Attente de PostgreSQL..." -ForegroundColor Cyan

    for ($i = 0; $i -lt 30; $i++) {
        try {
            $check = docker exec gmao_postgres pg_isready -U gmao -d gmao_db 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  -> PostgreSQL est READY." -ForegroundColor Green
                return
            }
        } catch {
            # Silence d'erreur lors du check
        }
        Start-Sleep -Seconds 2
    }

    throw "PostgreSQL n'a pas démarré à temps (Timeout 60s)."
}

# Fonction d'attente intelligente pour MinIO
function Wait-MinIO {
    Write-Host "  -> Attente de MinIO..." -ForegroundColor Cyan

    for ($i = 0; $i -lt 30; $i++) {
        try {
            $check = docker exec gmao_minio curl -s http://localhost:9000/minio/health/live 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  -> MinIO est READY." -ForegroundColor Green
                return
            }
        } catch {
            # Silence
        }
        Start-Sleep -Seconds 2
    }

    throw "MinIO n'a pas démarré à temps (Timeout 60s)."
}

Wait-Postgres
Wait-MinIO
