// lightweight client registry
const clients = new Map(); // clientId => socket

export function registerClient(clientId, socket) {
  clients.set(clientId, socket);
  console.log(`🟢 Registered client: ${clientId}`);
}

export function getClientSocket(clientId) {
  return clients.get(clientId);
}

export function unregisterClientBySocket(socket) {
  for (const [clientId, s] of clients.entries()) {
    if (s === socket) {
      clients.delete(clientId);
      console.log(`🔴 Client disconnected: ${clientId}`);
      return clientId;
    }
  }
}
