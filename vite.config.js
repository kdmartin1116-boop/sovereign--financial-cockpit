import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: 'src', // React project root
  base: '/static/', // Base public path when served in production
  build: {
    outDir: '../dist', // Output to 'dist' in the project root
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        
      }
    }
  }
})
