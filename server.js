import dotenv from 'dotenv';
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import http from "http";
import { createClient } from "redis";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

// Redis setup
const redis = createClient();
const redisPublisher = createClient();

await redis.connect();
await redisPublisher.connect();

const GROUP = "jobsGroup";
const STREAM = "jobsStream";
const CONSUMER = `io-${Math.floor(Math.random() * 10000)}`; 

// Ensure group exists
try {
  await redis.xGroupCreate(STREAM, GROUP, "0", { MKSTREAM: true });
  console.log(`Created group ${GROUP}`);
} catch (err) {
  if (err.message.includes("BUSYGROUP")) {
    console.log(`Group ${GROUP} already exists`);
  } else throw err;
}


// Socket.IO setup
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 10e6 // 10MB limit
});

const clients = new Map();

// Handle Electron client connections
io.on("connection", (socket) => {
  console.log("✅ Electron client connected:", socket.id);


  // Client registers itself
  socket.on("register", (clientId) => {
    clients.set(clientId, socket);
    console.log(`🟢 Registered client: ${clientId}`);
  });



  // Client sends back a response
  socket.on("job-response",async (response) => {
    console.log(`📤 Got response from client- ${response.clientId}`);

    // Forward to main platform
    try{
      await redisPublisher.publish("responses",JSON.stringify(response));
      console.log(`📤 Forwarded response from client- ${response.clientId} to main platform`);
    } catch (err) {
      console.error(`❌ Failed to publish response for client ${response.clientId}:`, err);
      await redisPublisher.publish("responses", JSON.stringify({ requestId: response.requestId, error: err}));
    }
    
    // Acknowledge job after processing (important)
    if (response.requestId && response.streamId) {
      await redis.xAck(STREAM, GROUP, response.streamId);
      console.log(`✅ Acked job ${response.requestId}`);
    }
  });



  // Cleanup on disconnect
  socket.on("disconnect", () => {
    for (let [clientId, s] of clients.entries()) {
      if (s === socket) {
        clients.delete(clientId);
        console.log(`🔴 Client disconnected: ${clientId}`);
      }
    }
  });
});


// Continuously read jobs from main platform stream
async function pollJobs() {
  while (true) {
    const jobs = await redis.xReadGroup(GROUP, CONSUMER, [{ key: STREAM, id: ">" }], {
      BLOCK: 5000,
      COUNT: 1,
    });

    if (!jobs) continue;

    for (const stream of jobs) {
      for (const message of stream.messages) {
        const job = JSON.parse(message.message.job);
        console.log(`📥 [${CONSUMER}] Got job:`, job);

        const { client, requestId } = job;
        const socket = clients.get(client);

        if (!socket) {
          console.error(`❌ Client ${client} not connected`);
          await redisPublisher.publish("responses", JSON.stringify({ requestId, error: "Client not connected" }));
          await redis.xAck(STREAM, GROUP, message.id); // mark as done
          continue;
        }

        // Attach streamId so we can ack later
        socket.emit("perform-job", { ...job, streamId: message.id });
        console.log(`Forwarded job ${requestId} to client ${client}`);
      }
    }
  }
}
pollJobs();

// await redisSub.subscribe("jobs", (message) => {
//   const job = JSON.parse(message);
//   console.log("📥 Received job:", job);

//   const { client, requestId } = job;
//   const socket = clients.get(client);

//   if (!socket) {
//     console.error(`❌ No client connected with id: ${client}`);
//     // send failure back to main platform
//     redisPub.publish(
//       "responses",
//       JSON.stringify({ requestId, error: "Client not connected" })
//     );
//     return;
//   }

//   // Forward job to the correct Electron client
//   socket.emit("perform-job", job);
//   console.log(`Forwarded job ${requestId} to client ${client}`);
// });



server.listen(PORT, () => {
  console.log(`Socket-io server listening on port ${PORT} as ${CONSUMER}`);
});