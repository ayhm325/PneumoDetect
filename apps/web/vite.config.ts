import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const apiTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/uploads": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/static/heatmaps": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/socket.io": {
        target: apiTarget,
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
