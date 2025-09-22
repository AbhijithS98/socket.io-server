import { logger } from "../config/logger";

const clients = new Map(); // clientId => socket

export function registerClient(apiKey, socket) {
  clients.set(apiKey, socket);
  logger.info(`Registered client ${apiKey}`);
}

export function getClientSocket(apiKey) {
  return clients.get(apiKey);
}

export function unregisterClientBySocket(socket) {
  for (const [apiKey, s] of clients.entries()) {
    if (s === socket) {
      clients.delete(apiKey);
      logger.info(`Client ${apiKey} disconnected`);
      return apiKey;
    }
  }
  logger.warn(`Attempted to unregister a socket that was not found`);
}
