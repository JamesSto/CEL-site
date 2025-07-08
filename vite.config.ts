import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/projects/common-english-lexicon/',
  server: {
    proxy: {
      '/projects/common-english-lexicon/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/projects\/common-english-lexicon\/api/, ''),
      },
    }
  }
})
