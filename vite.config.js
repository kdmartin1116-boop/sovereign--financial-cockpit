
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
  build: {
    manifest: true,
    rollupOptions: {
      input: 'static/main.js',
    },
    outDir: 'static/dist',
    emptyOutDir: true,
  },
});
