#!/bin/sh
set -e

echo "──────────────────────────────────────────"
echo " GMAO Pro — Démarrage du backend"
echo "──────────────────────────────────────────"

cd /app/backend

# Synchronisation du schéma avec la base de données
echo "▶  Synchronisation du schéma Prisma..."
npx prisma db push --skip-generate

# Injection des données de démonstration (première exécution)
SEED_FLAG="/var/lib/gmao/.seed_done"
mkdir -p /var/lib/gmao
if [ "${SEED_DB:-false}" = "true" ] && [ ! -f "$SEED_FLAG" ]; then
  echo "▶  Injection des données de démonstration..."
  node prisma/seed.js && touch "$SEED_FLAG" && echo "✓  Seed terminé."
fi

echo "▶  Lancement du serveur Node.js..."
exec "$@"
