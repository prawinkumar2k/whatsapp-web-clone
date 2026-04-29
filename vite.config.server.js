import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'backend/node-build.js'),
      name: 'Server',
      fileName: (format) => `backend/node-build.mjs`,
    },
    rollupOptions: {
      external: ['express', 'socket.io', 'mongoose', 'dotenv', 'http'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend'),
    },
  },
});
