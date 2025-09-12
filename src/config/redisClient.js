import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

redis.on("error", (err) => console.error("Redis Client Error", err));

export async function connectRedis() {
  if (!redis.isOpen) await redis.connect();
}

export { redis };
