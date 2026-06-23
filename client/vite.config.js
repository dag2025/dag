import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // 1. Add this import at the top

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 2. Add this alias to force-map react to your project's local folder
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom')
    }
  },
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
    chunkSizeWarningLimit: 1000,
  },
});