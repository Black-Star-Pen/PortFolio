import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // En développement : toutes les requêtes vers /api sont
    // redirigées vers le serveur Express (port 3001)
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});