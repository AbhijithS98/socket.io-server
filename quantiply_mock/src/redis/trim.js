import { redis } from "./client.js";
import { MAX_STREAM_LENGTH } from "../config/constants.js";

export async function trimStream(stream) {
  try {
    await redis.xTrim(stream, "MAXLEN", MAX_STREAM_LENGTH, { APPROXIMATED: true });
  } catch (err) {
    console.error(`❌ Error trimming stream ${stream}:`, err);
  }
}
