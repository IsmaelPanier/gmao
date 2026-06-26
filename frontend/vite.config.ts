import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

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
      '/api': {
        target: 'http://backend:4000',
        changeOrigin: true,
      },
      // Redirige les requêtes WebSocket (Socket.io) vers le service backend
      '/socket.io': {
        target: 'http://backend:4000',
        ws: true, // Active le proxy pour les WebSockets
        changeOrigin: true,
      },
    },
  },
});
