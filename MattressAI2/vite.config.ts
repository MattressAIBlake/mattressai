import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    host: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
    ],
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-components': [
            './src/components/ui/Button',
            './src/components/ui/Card',
            './src/components/ui/Badge',
            './src/components/ui/Toast',
          ],
          'layout-components': [
            './src/components/layout/Sidebar',
            './src/components/layout/Header',
            './src/components/layout/Breadcrumbs',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: true,
  },
});