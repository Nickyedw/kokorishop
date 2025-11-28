// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isGithub = mode === "github";

  return {
    plugins: [react()],

    // Rutas relativas para que funcione tanto en raíz como en /kokorishop/
    base: "./",

    build: {
      // GitHub Pages: /docs
      // Vercel: /dist
      outDir: isGithub ? "docs" : "dist",
    },
  };
});
