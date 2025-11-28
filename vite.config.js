// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isGithub = mode === "github";   // si el build es para GitHub Pages

  return {
    plugins: [react()],
    base: isGithub ? "/kokorishop/" : "/",
    build: {
      outDir: isGithub ? "docs" : "dist",
    },
  };
});
