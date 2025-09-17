import dotenv from "dotenv";
import fs from "fs";
import { createClient } from "redis";
import { nanoid } from "nanoid";
import { testJobs } from "./jobs.js";

dotenv.config();

const redisURL = process.env.REDIS_URL;
const redis = createClient({ url: redisURL });
await redis.connect();

const JOBS_STREAM = "jobsStream";
const RESPONSES_STREAM = "responsesStream";
const RESPONSES_GROUP = "responsesGroup";
const RESPONSES_CONSUMER = `main-${Math.floor(Math.random() * 10000)}`;

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

const pendingRequests = new Map();

// Poll for responses
async function pollResponses() {
  while (true) {
    const data = await redis.xReadGroup(
      RESPONSES_GROUP,
      RESPONSES_CONSUMER,
      [{ key: RESPONSES_STREAM, id: ">" }],
      { BLOCK: 5000, COUNT: 1 }
    );

    if (!data) continue;

    for (const stream of data) {
      for (const message of stream.messages) {
        const response = JSON.parse(message.message.response);

        const { requestId, encoding, body, contentType } = response;

        let deserializedBody = body;

        switch (encoding) {
          case "base64":
            deserializedBody = Buffer.from(body, "base64"); // Convert Base64 back to Buffer
            break;
          case "utf8":
            break; // Already a string, no conversion needed
          case "none":
            break; // JSON object, already parsed by JSON.parse
          default:
            console.warn(`Unknown encoding: ${encoding}, treating as text`);
        }

        // Replace the serialized body with deserialized data
        response.body = deserializedBody;

        // Handle file saving if needed
        if (contentType === "zip" || contentType === "gz") {
          fs.writeFileSync(`response_${requestId}.${contentType}`, response.body);
        } else if (contentType === "csv") {
          fs.writeFileSync(`response_${requestId}.csv`, response.body, "utf8");
        }

        if (pendingRequests.has(requestId)) {
          const { resolve } = pendingRequests.get(requestId);
          resolve(response); // fulfill the promise
          pendingRequests.delete(requestId);
        }

        // Ack the response
        await redis.xAck(RESPONSES_STREAM, RESPONSES_GROUP, message.id);
        console.log(`✅ Acked response for ${requestId}`);
      }
    }
  }
}
pollResponses();

// Send a job via Redis Stream
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

    // Store promise handler
    pendingRequests.set(requestId, { resolve, reject });

    // Write to Redis stream
    try {
      await redis.xAdd(JOBS_STREAM, "*", {
        job: JSON.stringify(job),
      });
      console.log("✅ Added job to stream:", requestId);
    } catch (err) {
      console.error("❌ Error adding job to Redis stream:", err.message);
      pendingRequests.delete(requestId);
      return reject(err);
    }

    // timeout to prevent hang forever
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        reject(new Error(`Timeout waiting for response (reqId: ${requestId})`));
        pendingRequests.delete(requestId);
      }
    }, 60000);
  });
}

// Example usage
(async () => {
  const job = testJobs[0];
  try {
    const response = await sendJob(
      job.client,
      job.endpoint,
      job.method,
      job.headers,
      job.payload
    );
    console.log(`🎉 Final Response:`, response);
  } catch (err) {
    console.error(`❌ Error:`, err.message);
  }
})();
