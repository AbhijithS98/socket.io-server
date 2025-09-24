import dotenv from "dotenv";
import { createClient } from "redis";
import {
  RESPONSES_STREAM,
  RESPONSES_GROUP,
} from "../config/constants.js";

dotenv.config();

const redisURL = process.env.REDIS_URL;
console.log("redisURL:",redisURL);

export const redis = createClient({ url: redisURL });

await redis.connect();

try {
  await redis.xGroupCreate(RESPONSES_STREAM, RESPONSES_GROUP, "0", {
    MKSTREAM: true,
  });
  console.log(`Created ${RESPONSES_GROUP}`);
} catch (err) {
  if (err.message.includes("BUSYGROUP")) {
    console.log(`${RESPONSES_GROUP} already exists`);
  } else throw err;
}
