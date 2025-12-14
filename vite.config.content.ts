import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    charset: 'ascii', // 使用 ascii 编码，将非 ASCII 字符转义为 Unicode
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
      entry: resolve(__dirname, 'src/content/index.tsx'),
      name: 'ContentScript',
      fileName: () => 'assets/content.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        extend: true,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'assets/content.css';
          return 'assets/[name].[ext]';
        },
      },
    },
  },
});
