import { createClient } from 'redis';
import { logger } from './logger';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
});

redis.on('error', (err) => {
  logger.error(`Redis Client Error: ${err.message}`, { stack: err.stack })
})

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
    logger.info('Redis connected successfully');
  }
}

export { redis };
