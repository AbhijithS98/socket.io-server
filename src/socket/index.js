import { Server } from 'socket.io';
import { registerClient, unregisterClientBySocket } from './clients.js';
import { handleJobResponse } from './handlers.js';

export function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*' },
    maxHttpBufferSize: 10e6,
  });

  io.on('connection', (socket) => {
    console.log('✅ Electron client connected:', socket.id);

    socket.on('register', (clientId) => registerClient(clientId, socket));

    socket.on('job-response', async (response) => {
      console.log(`📤 Got response from client-${response.clientId}`);
      // delegate to handlers (doesn't need socket context for now)
      await handleJobResponse(response);
    });

    socket.on('disconnect', () => unregisterClientBySocket(socket));
  });

  return io;
}
