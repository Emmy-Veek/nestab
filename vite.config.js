import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-ext-files',
      closeBundle() {
        copyFileSync('src/background.js', 'dist/background.js');
        copyFileSync('manifest.json', 'dist/manifest.json');
        try {
          mkdirSync('dist/icons', { recursive: true });
          for (const s of ['16', '48', '128']) {
            const src = `public/icons/icon${s}.png`;
            if (existsSync(src)) copyFileSync(src, `dist/icons/icon${s}.png`);
          }
        } catch {}
      },
    },
  ],
  build: {
    rollupOptions: {
      input: { popup: resolve(import.meta.dirname, 'popup.html') },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: '[name][extname]',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: false,
  },
  base: './',
});