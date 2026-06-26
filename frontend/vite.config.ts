import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// URL du backend :
//  - En mode Docker (dev), VITE_BACKEND_URL est injecté par docker-compose.override.yml
//  - En mode local (sans Docker), le fallback pointe vers localhost:4000
const backendUrl = process.env.VITE_BACKEND_URL ?? "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // Écoute sur toutes les interfaces réseau (nécessaire pour Docker)
    port: 5173,
    proxy: {
      // Redirige les requêtes API vers le service backend
      "/api": {
        target: backendUrl,
        changeOrigin: true,
      },
      // Redirige les requêtes WebSocket (Socket.io) vers le service backend
      "/socket.io": {
        target: backendUrl,
        ws: true, // Active le proxy pour les WebSockets
        changeOrigin: true,
      },
    },
  },
});
