import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Safely import lovable-tagger only if it exists
let componentTagger: ((mode: string) => unknown) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("lovable-tagger");
  componentTagger = mod.componentTagger ?? null;
} catch {
  // lovable-tagger not installed in this environment — that's fine
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // Proxy /api requests to the Express backend — avoids CORS issues in development
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger && componentTagger(mode),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
}));
