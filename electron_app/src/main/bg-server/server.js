const path = require('path');
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });
const createExpressApp = require("./expressApp");
const { connectSocket, disconnectSocket } = require("./socketClient");
const handleJob = require("./jobHandler");
const { fetchPublicIP } = require("./utils/logger")

let serverInstance = null;
const clientId = "clientA";

function startServer() {
  if (serverInstance) return clientId;

  const app = createExpressApp();
  const PORT = process.env.PORT || 3050;

  serverInstance = app.listen(PORT, async () => {
    console.log(`Local Express running at http://localhost:${PORT}`);

    // fetch machine's public IP at startup
    await fetchPublicIP();
  });

  connectSocket(process.env.IO_SERVER_URL, clientId, handleJob);

  return clientId;
}

function stopServer() {
  if (serverInstance) {
    serverInstance.close(() => {
      console.log("-> Express server stopped.");
      serverInstance = null;
    });
  }
  disconnectSocket();
}

function isRunning() {
  return !!serverInstance;
}

module.exports = { startServer, stopServer, isRunning };
