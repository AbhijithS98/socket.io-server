// lightweight client registry
const clients = new Map(); // clientId => socket

export function registerClient(apiKey, socket) {
  clients.set(apiKey, socket);
  console.log(`🟢 Registered client ${apiKey}`);
}

export function getClientSocket(apiKey) {
  return clients.get(apiKey);
}

export function unregisterClientBySocket(socket) {
  for (const [apiKey, s] of clients.entries()) {
    if (s === socket) {
      clients.delete(apiKey);
      console.log(`🔴 Client ${apiKey} disconnected`);
      return apiKey;
    }
  }
}
