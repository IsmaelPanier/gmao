# ── Étape 1 : Build du frontend React/Vite ────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copie des manifestes workspace
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Installation des dépendances
RUN npm ci --no-audit --no-fund

# Copie du code source frontend
COPY frontend/ ./frontend/

# Build de production Vite
RUN npm run build --workspace=frontend

# ── Étape 2 : Nginx servant le frontend + proxy API ───────────────
FROM nginx:1.27-alpine AS production

# Copie des fichiers statiques compilés
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Configuration Nginx
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
