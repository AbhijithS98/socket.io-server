import { Server } from 'socket.io';
import { registerClient, unregisterClientBySocket } from './clients.js';
import { handleJobResponse } from './handlers.js';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

let io;
let pubClient;
let subClient;

export async function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*' },
    maxHttpBufferSize: 10e6,
  });

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  // create pub/sub clients for Socket.IO adapter
  pubClient = createClient({ url: redisUrl });
  subClient = pubClient.duplicate();

  pubClient.on('error', (err) => console.error('Socket Redis pubClient error', err));
  subClient.on('error', (err) => console.error('Socket Redis subClient error', err));

  await pubClient.connect();
  await subClient.connect();

  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', (socket) => {
    console.log('✅ Electron client connected:', socket.id);

    socket.on('register', (clientId) => registerClient(clientId, socket));

    socket.on('job-response', async (response) => {
      console.log(`📤 Got response from client-${response.clientId}`);
      // delegate to handlers
      await handleJobResponse(response);
    });

    socket.on('disconnect', () => unregisterClientBySocket(socket));
  });

  return io;
}

export async function closeSocketAdapter() {
  try {
    if (io) await io.close();
    if (pubClient && pubClient.isOpen) await pubClient.disconnect();
    if (subClient && subClient.isOpen) await subClient.disconnect();
  } catch (err) {
    console.error('Error closing socket adapter clients', err);
  }
}
