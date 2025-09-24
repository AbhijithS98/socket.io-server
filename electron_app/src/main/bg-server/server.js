const path = require('path');
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });
const createExpressApp = require("./expressApp");
const { connectSocket, disconnectSocket } = require("./socketClient");
const handleJob = require("./jobHandler");
const { sendLogToRenderer } = require("./utils/logRenderer")

let serverInstance = null;

function startServer(apiKey) {
  if (serverInstance) return;

  const app = createExpressApp();
  const PORT = process.env.PORT || 3050;

  serverInstance = app.listen(PORT, async () => {
    console.log(`Local Express running at http://localhost:${PORT}`);
    sendLogToRenderer("Started background server")
  });

  connectSocket(process.env.IO_SERVER_URL, apiKey, handleJob);

  return;
}

function stopServer() {
  if (serverInstance) {
    serverInstance.close(() => {
      console.log("-> Express server stopped.");
      sendLogToRenderer("Background server stopped..!")
      serverInstance = null;
    });
  }
  disconnectSocket();
}

function isRunning() {
  return !!serverInstance;
}

module.exports = { startServer, stopServer, isRunning };
