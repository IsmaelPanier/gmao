#!/bin/sh
# Ce script exécute le seed de la base de données.
# Il s'adapte à l'environnement de développement (en utilisant ts-node)
# ou de production (en utilisant le .js compilé).

set -e

cd "$(dirname "$0")" # Se place dans le répertoire prisma/

# Enlève le flag de seed pour permettre de relancer le script
rm -f /var/lib/gmao/.seed_done

echo "▶ Lancement du script de seed..."

if [ -f "seed.ts" ]; then
  # Environnement de développement : utilise ts-node
  echo "(Mode: développement, via ts-node)"
  npx ts-node seed.ts
else
  # Environnement de production : utilise le .js compilé
  echo "(Mode: production, via node)"
  node seed.js
fi

# Crée un flag pour ne pas relancer le seed automatiquement au prochain 'up'
touch /var/lib/gmao/.seed_done

echo "✓ Seed terminé."
