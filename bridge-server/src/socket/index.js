import { Server } from 'socket.io';
import { registerClient, unregisterClientBySocket } from './clients.js';
import { handleJobResponse } from './handlers.js';
import { logger } from '../config/logger.js';

// Utility function to fetch public IP
async function getPublicIP() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    logger.debug(`Fetched public IP: ${data.ip}`);
    return data.ip;
  } catch (err) {
    logger.error(`Failed to fetch public IP: ${err.message}`, { stack: err.stack });
    return "::1"; // fallback;
  }
}

export async function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*' },
    maxHttpBufferSize: 10e6,
  });

  io.on('connection', (socket) => {
    logger.info(`Electron client connected with socket id: ${socket.id}`);

    socket.on('register', async (apiKey, callback) => {
      registerClient(apiKey, socket);
      const publicIP = await getPublicIP();
      
      // send back the IP using callback
      callback({ ip: publicIP });
    });

    socket.on('job-response', async (response) => {
      logger.info(`Got response from client: ${response.clientId}`);
      // delegate to handlers
      await handleJobResponse(response);
    });

    socket.on('disconnect', () => unregisterClientBySocket(socket));
  });

  return io;
}
