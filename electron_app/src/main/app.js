const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { stopServer } = require('./bg-server/server');

// Import IPC handlers
const registerIpcHandlers = require("./ipcHandlers");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  registerIpcHandlers(ipcMain); // all IPC handlers registered here
});


// Clean shutdown
app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});