import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import http from 'http';

import { connectRedis, redis } from './config/redisClient.js';
import { ensureGroups } from './helpers/streamHelpers.js';
import { initSocket } from './socket/index.js';
import { pollJobs } from './streams/jobsProcessor.js';
import { createConsumerId } from './config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

let io; // will hold Socket.IO instance
let consumerId;

async function start() {
  await connectRedis();
  await ensureGroups();

  // Start Socket.IO
  io = initSocket(server);

  // start consumer loop (non-blocking)
  consumerId = createConsumerId();
  pollJobs(consumerId);

  server.listen(PORT, () => console.log(`Listening on ${PORT} as ${consumerId}`));
}

// Graceful shutdown
async function shutdown(signal) {
  console.log(`${signal} received — shutting down gracefully...`);

  try {
    // 1. Stop HTTP server
    await new Promise((resolve) => server.close(resolve));
    console.log('✅ HTTP server closed');

    // 2. Stop Socket.IO
    if (io) {
      await io.close();
      console.log('✅ Socket.IO server closed');
    }

    // 3. Disconnect Redis
    if (redis && redis.isOpen) {
      await redis.close();
      console.log('✅ Redis client closed');
    }
  } catch (err) {
    console.error('Error during shutdown:', err);
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
