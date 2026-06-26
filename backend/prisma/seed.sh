#!/bin/sh
# Ce script exécute le seed de la base de données.
# Utilise seed.js (pré-compilé) en priorité, ou ts-node en dernier recours.

set -e

# Se place dans le répertoire prisma/ (où se trouvent seed.ts et seed.js)
SEED_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SEED_DIR"

# Enlève le flag de seed pour permettre de relancer le script
rm -f /var/lib/gmao/.seed_done 2>/dev/null || true

echo "▶ Lancement du script de seed..."

if [ -f "seed.js" ]; then
  # Utilise le .js pré-compilé (disponible en dev et prod)
  echo "(Mode: node, seed.js compilé)"
  node seed.js
elif [ -f "seed.ts" ]; then
  # Dernier recours : ts-node avec chemin absolu
  echo "(Mode: ts-node, seed.ts)"
  npx ts-node --skip-project --compiler-options '{"module":"commonjs"}' "$SEED_DIR/seed.ts"
else
  echo "Aucun fichier seed trouvé (seed.js ou seed.ts)" >&2
  exit 1
fi

# Crée un flag pour ne pas relancer le seed automatiquement au prochain 'up' (prod)
mkdir -p /var/lib/gmao 2>/dev/null || true
touch /var/lib/gmao/.seed_done 2>/dev/null || true

echo "✓ Seed terminé."

