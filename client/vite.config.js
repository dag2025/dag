import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
     cssMinify: 'esbuild',
    rollupOptions: {
      external: [], // Don't externalize anything
      resolve: {
        dedupe: ['react', 'react-dom'] // Ensure single React instance
      }
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-bootstrap']
  }
});