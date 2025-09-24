const os = require("os");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const { startServer, stopServer, isRunning } = require("./bg-server/server");

const configPath = path.join(app.getPath("userData"), "config.json");

function readConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading config:", err);
  }
  return {};
}

function writeConfig(data) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing config:", err);
  }
}

module.exports = function registerIpcHandlers(ipcMain, mainWindow) {
  // Start server
  ipcMain.handle("start-server", async (event,apiKey) => {
    const clientId = await startServer(apiKey);
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

  // Page navigation
  ipcMain.handle("load-page", (event, page) => {
    if (mainWindow) {
      mainWindow.loadFile(path.join(__dirname, `../renderer/${page}`));
    }
  });

  // Save API Key
  ipcMain.handle("save-api-key", (event, key) => {
    const cfg = readConfig();
    cfg.apiKey = key;
    writeConfig(cfg);
    return true;
  });

  // Get API Key
  ipcMain.handle("get-api-key", () => {
    const cfg = readConfig();
    return cfg.apiKey || null;
  });

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
