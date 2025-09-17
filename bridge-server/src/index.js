import "./config/env.js";
import express from 'express';
import http from 'http';

import { connectRedis, redis } from './config/redisClient.js';
import { ensureGroups } from './helpers/streamHelpers.js';
import { initSocket } from './socket/index.js';
import { pollJobs, reclaimStuckJobs, stopJobsProcessor } from './streams/jobsProcessor.js';
import { createConsumerId } from './config/constants.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

let io; // will hold Socket.IO instance
let consumerId;
let reclaimInterval;

async function start() {
  await connectRedis();
  await ensureGroups();

  // Start Socket.IO
  io = await initSocket(server);

  // start consumer loop (non-blocking)
  consumerId = createConsumerId();
  pollJobs(consumerId);

  // run reclaim loop every 30s
  reclaimInterval = setInterval(() => reclaimStuckJobs(consumerId), 30_000);

  server.listen(PORT, () => console.log(`Listening on ${PORT} as ${consumerId}`));
}

// Graceful shutdown
async function shutdown(signal) {
  console.log(`${signal} received — shutting down gracefully...`);

  try {
    // 1. stop the jobs processor loop
    stopJobsProcessor();

    // 1. Stop reclaim loop
    if (reclaimInterval) {
      clearInterval(reclaimInterval);
      console.log('✅ Reclaim loop stopped');
    }

    // 2. Stop HTTP server
    await new Promise((resolve) => server.close(resolve));
    console.log('✅ HTTP server closed');

    // 3. Stop Socket.IO
    if (io) {
      await io.close();
      console.log('✅ Socket.IO server closed');
    }

    // 4. Disconnect Redis
    if (redis && redis.isOpen) {
      await redis.quit();
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
