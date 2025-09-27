// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // ✅ en build usa /kokorishop/, en dev sirve en /
  base: command === 'build' ? '/kokorishop/' : '/',
  build: { outDir: 'docs' } // 👈 compila a /docs para GitHub Pages
}))
