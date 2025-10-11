import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/pdfjs-dist/build/pdf.worker.mjs',
          dest: '.'
        }
      ]
    })
  ],
  server: {
    proxy: {
      '/scan-contract': 'http://127.0.0.1:8001',
      '/endorse-bill': 'http://127.0.0.1:8001',
      '/stamp_endorsement': 'http://127.0.0.1:8001',
      '/generate-tender-letter': 'http://127.0.0.1:8001',
      '/generate-ptp-letter': 'http://127.0.0.1:8001',
      '/get-bill-data': 'http://127.0.0.1:8001',
      '/scan-for-terms': 'http://127.0.0.1:8001',
      '/generate-remedy': 'http://127.0.0.1:8001'
    }
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: 'src/main.jsx',
      output: {
        entryFileNames: `main.js`,
        chunkFileNames: `chunks/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    },
    outDir: 'static/dist',
    emptyOutDir: true,
  },
});