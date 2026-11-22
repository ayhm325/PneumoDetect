import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const apiTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:4000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __VITE_API_URL__: JSON.stringify(process.env.VITE_API_URL || ""),
    __VITE_SOCKET_URL__: JSON.stringify(process.env.VITE_SOCKET_URL || ""),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("chart.js") || id.includes("react-chartjs-2")) return "vendor-charts";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("@tanstack/react-query")) return "vendor-query";
            if (id.includes("i18next") || id.includes("react-i18next")) return "vendor-i18n";
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
              return "vendor-react";
            }
          }
        },
      },
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
