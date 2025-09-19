const os = require("os");
const fs = require("fs");
const { startServer, stopServer, isRunning } = require("./bg-server/server");
const { logFile } = require("./bg-server/utils/logger");


module.exports = function registerIpcHandlers(ipcMain) {
  // Start server
  ipcMain.handle("start-server", async () => {
    const clientId = await startServer();
    return clientId;
  });

  // Stop server
  ipcMain.handle("stop-server", () => {
    stopServer();
  });

  // Check status
  ipcMain.handle("get-server-status", () => {
    return isRunning();
  });

  // // Read logs from file
  // ipcMain.handle("read-logs", async () => {
  //   try {
  //     return fs.readFileSync(logFile, "utf8");
  //   } catch(err) {
  //     console.log("error in reading file:", err)
  //     return 'No logs yet.\n';
  //   }
  // });

  // Get local IP
  ipcMain.handle("get-local-ip", () => {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
    return null;
  });
};
