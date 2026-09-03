import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Change this string to your exact GitHub Repository Name!
const REPO_NAME = 'shonil-portfolio'; 

export default defineConfig({
  // Automatically uses the correct path format depending on if it's running locally or deployed
  base: process.env.NODE_ENV === 'production' ? `/${REPO_NAME}/` : '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  // FORCE VITE TO GRAB INDEPENDENT PUBLIC ASSETS AT BUILD TIME:
  publicDir: path.resolve(import.meta.dirname, 'public'),
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(import.meta.dirname, 'public/assets'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, '../publish'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: false,
  }
});
