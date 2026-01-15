import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import rewriteAll from 'vite-plugin-rewrite-all';

export default defineConfig({
  plugins: [
    react(),
    rewriteAll()  // ADD THIS PLUGIN
  ],
  server: {
    port: 4000,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});