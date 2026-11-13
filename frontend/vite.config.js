import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.json']
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
  esbuild: {
    jsx: 'automatic',
    include: /\.[jt]sx?$/,
    exclude: [],
    loader: 'jsx',
  },
  optimizeDeps: {
    esbuild: {
      jsx: 'automatic',
      include: ['**/*.js', '**/*.jsx'],
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
      },
    },
  },
})