import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import usersRouter from './modules/users/users.routes.js';
import messagesRouter from './modules/messages/messages.routes.js';
import statusRouter from './modules/status/status.routes.js';
import groupsRouter from './modules/groups/groups.routes.js';
import callsRouter from './modules/calls/calls.routes.js';
import { seedDemoUsers } from './utils/seed.js';
import { attachRealtime } from './modules/realtime/socket.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI;
const clientOrigin = process.env.CLIENT_URL?.trim();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isLocalOrigin = (origin) => {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return true;
    }

    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }

    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }

    const match = hostname.match(/^172\.(\d{1,2})\.\d{1,3}\.\d{1,3}$/);
    if (match) {
      const secondOctet = Number(match[1]);
      return secondOctet >= 16 && secondOctet <= 31;
    }

    return false;
  } catch {
    return false;
  }
};

const allowOrigin = (origin, callback) => {
  if (!origin) {
    return callback(null, true);
  }

  if (!clientOrigin || origin === clientOrigin || isLocalOrigin(origin)) {
    return callback(null, true);
  }

  return callback(new Error('Not allowed by CORS'));
};

export const corsOptions = { origin: allowOrigin };

export async function connectDB() {
  if (!mongoUri) {
    throw new Error('MONGO_URI is required');
  }

  if (mongoose.connection.readyState === 0) {
    let lastError = null;

    for (let attempt = 1; attempt <= 10; attempt += 1) {
      try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
        const seededCount = await seedDemoUsers();
        if (seededCount > 0) {
          console.log(`Seeded ${seededCount} demo users`);
        }
        return;
      } catch (error) {
        lastError = error;
        console.warn(`MongoDB connection attempt ${attempt} failed`);
        if (attempt < 10) {
          await sleep(2000);
        }
      }
    }

    throw lastError;
  }
}

export function createApp() {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));

  app.use('/api/users', usersRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/statuses', statusRouter);
  app.use('/api/groups', groupsRouter);
  app.use('/api/calls', callsRouter);
  app.get('/api/ping', (req, res) => res.json({ message: 'pong' }));

  return app;
}

export function attachSocket(httpServer) {
  return attachRealtime(httpServer, corsOptions);
}

export function createStandaloneServer() {
  const app = createApp();
  const server = http.createServer(app);
  attachRealtime(server, corsOptions);
  return { app, server };
}
