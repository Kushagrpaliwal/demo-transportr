import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      "/google-maps-api": {
        target: "https://maps.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/google-maps-api/, ""),
      },
      "/clicksend-api": {
        target: "https://rest.clicksend.com/v3",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/clicksend-api/, ""),
      },
    },
  },
});