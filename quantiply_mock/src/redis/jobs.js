import { nanoid } from "nanoid";
import { redis } from "./client.js";
import { trimStream } from "./trim.js";
import { pendingRequests } from "./responses.js";
import { JOBS_STREAM } from "../config/constants.js";

export async function sendJob(
  client,
  endpoint,
  method = "GET",
  headers = {},
  payload = {}
) {
  return new Promise(async (resolve, reject) => {
    const requestId = nanoid();
    const job = { requestId, client, endpoint, method, headers, payload };

    pendingRequests.set(requestId, { resolve, reject });

    try {
      await redis.xAdd(JOBS_STREAM, "*", {
        job: JSON.stringify(job),
      });

      await trimStream(JOBS_STREAM);
      console.log("✅ Added job to stream:", requestId);
    } catch (err) {
      console.error("❌ Error adding job to Redis stream:", err.message);
      pendingRequests.delete(requestId);
      return reject(err);
    }

    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        reject(new Error(`Timeout waiting for response (reqId: ${requestId})`));
        pendingRequests.delete(requestId);
      }
    }, 30000);
  });
}
