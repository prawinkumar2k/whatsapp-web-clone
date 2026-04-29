import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'server/node-build.js'),
      name: 'Server',
      fileName: (format) => `server/node-build.mjs`,
    },
    rollupOptions: {
      external: ['express', 'socket.io', 'mongoose', 'dotenv', 'http'],
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client'),
    },
  },
});
