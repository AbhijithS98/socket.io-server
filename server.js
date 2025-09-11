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
await redis.connect();

await redis.connect();
await redisPublisher.connect();

const JOBS_GROUP = "jobsGroup";
const JOBS_STREAM = "jobsStream";
const RESPONSES_GROUP = "responsesGroup";
const RESPONSES_STREAM = "responsesStream";
const CONSUMER = `io-${Math.floor(Math.random() * 10000)}`; 

// Ensure group exists
try {
  await redis.xGroupCreate(JOBS_STREAM, JOBS_GROUP, "0", { MKSTREAM: true });
  console.log(`Created group ${JOBS_GROUP}`);
} catch (err) {
  if (err.message.includes("BUSYGROUP")) {
    console.log(`Group ${JOBS_GROUP} already exists`);
  } else throw err;
}

try {
  await redis.xGroupCreate(RESPONSES_STREAM, RESPONSES_GROUP, "0", { MKSTREAM: true });
  console.log(`Created group ${RESPONSES_GROUP}`);
} catch (err) {
  if (err.message.includes("BUSYGROUP")) {
    console.log(`Group ${RESPONSES_GROUP} already exists`);
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
    console.log(`📤 Got response from client-${response.clientId}`);

    try{
      // Add response to Redis Stream
      await redis.xAdd(RESPONSES_STREAM, "*", {
        response: JSON.stringify(response),
      });
      console.log(`📤 Stored response from client-${response.clientId} in stream`);
    } catch (err) {
      console.error(`❌ Failed to add response for client ${response.clientId}:`, err);
    }
    
    // Acknowledge job after processing
    if (response.requestId && response.streamId) {
      await redis.xAck(JOBS_STREAM, JOBS_GROUP, response.streamId);
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


// Continuously read jobs from main platform
async function pollJobs() {
  while (true) {
    const jobs = await redis.xReadGroup(JOBS_GROUP, CONSUMER, [{ key: JOBS_STREAM, id: ">" }], {
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
          await redis.xAdd(RESPONSES_STREAM, "*", {
            response: JSON.stringify({ requestId, error: "Client not connected" }),
          });
          await redis.xAck(JOBS_STREAM, JOBS_GROUP, message.id);
          continue;
        }

        socket.emit("perform-job", { ...job, streamId: message.id });
        console.log(`Forwarded job ${requestId} to client ${client}`);
      }
    }
  }
}
pollJobs();


server.listen(PORT, () => {
  console.log(`Socket-io server listening on port ${PORT} as ${CONSUMER}`);
});