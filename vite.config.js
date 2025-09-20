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
      '/scan-contract': 'http://127.0.0.1:8000',
      '/endorse-bill': 'http://127.0.0.1:8000',
      '/stamp_endorsement': 'http://127.0.0.1:8000',
      '/generate-tender-letter': 'http://127.0.0.1:8000',
      '/generate-ptp-letter': 'http://127.0.0.1:8000',
      '/get-bill-data': 'http://127.0.0.1:8000',
      '/scan-for-terms': 'http://127.0.0.1:8000',
      '/generate-remedy': 'http://127.0.0.1:8000'
    }
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: 'src/index.html',
      output: {
        entryFileNames: `main.js`,
        chunkFileNames: `chunks/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});