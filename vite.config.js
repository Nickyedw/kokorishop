// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',          // ✅ raíz del dominio (Vercel)
  build: {
    outDir: 'docs',   // seguimos usando /docs como salida
  },
})
