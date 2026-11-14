import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// base './' + HashRouter => works at any GitHub Pages sub-path (user.github.io/<repo>/) with no config.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  optimizeDeps: { exclude: ['@electric-sql/pglite', '@electric-sql/pglite-pgvector'] },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
  worker: { format: 'es' },
})
