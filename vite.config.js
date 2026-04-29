import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp, attachSocket, connectDB } from './backend/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const useSeparateBackend = process.env.USE_SEPARATE_BACKEND === 'true';
const proxyTarget = (process.env.VITE_API_URL || 'http://server:5000').trim().replace(/\/+$/, '');

export default defineConfig(({ mode }) => ({
  root: path.resolve(__dirname, './frontend'),
  server: {
    host: '::',
    port: 8080,
    fs: {
      allow: [path.resolve(__dirname, './frontend')],
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', 'backend/**'],
    },
    ...(useSeparateBackend
      ? {
          proxy: {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              ws: true,
            },
            '/socket.io': {
              target: proxyTarget,
              changeOrigin: true,
              ws: true,
            },
          },
        }
      : {}),
  },
  build: {
    outDir: path.resolve(__dirname, './dist/frontend'),
    emptyOutDir: true,
  },
  plugins: [react(), ...(useSeparateBackend ? [] : [expressPlugin()])],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend'),
    },
  },
}));

function expressPlugin() {
  return {
    name: 'express-plugin',
    apply: 'serve',
    async configureServer(viteServer) {
      // Connect to MongoDB
      await connectDB();

      // Attach Express routes to Vite's middleware
      const app = createApp();
      viteServer.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api')) {
          return app(req, res, next);
        }

        return next();
      });

      // Attach Socket.IO to Vite's HTTP server after it starts listening
      if (viteServer.httpServer) {
        attachSocket(viteServer.httpServer);
      }
    },
  };
}
