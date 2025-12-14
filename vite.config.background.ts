import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  esbuild: {
    charset: 'ascii',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  publicDir: false,
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/background/index.ts'),
      name: 'BackgroundScript',
      fileName: () => 'assets/background.js',
      formats: ['iife'],
    },
  },
});
