import fs from "fs";
import { redis } from "./client.js";
import {
  RESPONSES_STREAM,
  RESPONSES_GROUP,
  RESPONSES_CONSUMER,
} from "../config/constants.js";

export const pendingRequests = new Map();

export async function pollResponses() {
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
            deserializedBody = Buffer.from(body, "base64");
            break;
          case "utf8":
          case "none":
            break;
          default:
            console.warn(`Unknown encoding: ${encoding}, treating as text`);
        }

        response.body = deserializedBody;

        if (contentType === "zip" || contentType === "gz") {
          fs.writeFileSync(`response_${requestId}.${contentType}`, response.body);
        } else if (contentType === "csv") {
          fs.writeFileSync(`response_${requestId}.csv`, response.body, "utf8");
        }

        if (pendingRequests.has(requestId)) {
          const { resolve } = pendingRequests.get(requestId);
          resolve(response);
          pendingRequests.delete(requestId);
        }

        await redis.xAck(RESPONSES_STREAM, RESPONSES_GROUP, message.id);
        console.log(`✅ Acked response for ${requestId}`);
      }
    }
  }
}
