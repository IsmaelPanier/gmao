# ── Étape 1 : Construction ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copie des manifestes workspace (nécessaire pour npm ci)
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Installation de TOUTES les dépendances (dev inclus pour la compilation)
RUN npm ci --no-audit --no-fund

# Copie du code source backend
COPY backend/ ./backend/

# Génération du client Prisma + compilation TypeScript
RUN cd backend && npx prisma generate
RUN cd backend && npx tsc --project tsconfig.json

# ── Étape 2 : Image de production ─────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Dépendances (depuis le builder — inclut prisma CLI et le client généré)
COPY --from=builder /app/node_modules ./node_modules

# Code compilé et fichiers Prisma
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY backend/package.json ./backend/

# Script de démarrage
COPY docker/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app/backend

EXPOSE 4000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/server.js"]
