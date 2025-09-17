const os = require("os");
const { startServer, stopServer, isRunning } = require("./bg-server/server");

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

  // Example: get local IP
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
