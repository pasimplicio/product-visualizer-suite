import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/stability': {
        target: 'https://api.stability.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stability/, ''),
      },
      '/api/wavespeed': {
        target: 'https://api.wavespeed.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wavespeed/, '/api/v3'),
        secure: false, // Bypass para certificado do proxy/firewall corporativo
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
