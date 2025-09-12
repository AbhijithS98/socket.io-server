import { redis } from "../config/redisClient.js";
import { JOBS_GROUP, JOBS_STREAM } from "../config/constants.js";
import { getClientSocket } from "../socket/clients.js";
import { addResponseToStream, ackJob } from "../helpers/streamHelpers.js";

export async function pollJobs(consumerId) {
  console.log("Starting pollJobs with consumer:", consumerId);

  while (true) {
    try {
      const jobs = await redis.xReadGroup(
        JOBS_GROUP,
        consumerId,
        [{ key: JOBS_STREAM, id: ">" }],
        { BLOCK: 5000, COUNT: 1 }
      );
      if (!jobs) continue;

      for (const stream of jobs) {
        for (const message of stream.messages) {
          const job = JSON.parse(message.message.job);
          console.log(`📥 [${consumerId}] Got job:`, job);

          const { client, requestId } = job;
          const socket = getClientSocket(client);

          if (!socket) {
            console.error(`❌ Client ${client} not connected`);
            await addResponseToStream({
              requestId,
              error: "Client not connected",
            });
            await ackJob(message.id);
            continue;
          }

          // forward to the connected client and attach streamId so they can ack
          socket.emit("perform-job", { ...job, streamId: message.id });
          console.log(`Forwarded job ${requestId} to client ${client}`);
        }
      }
    } catch (err) {
      console.error("pollJobs error:", err);
      // avoid hot-loop if Redis temporarily fails
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}
