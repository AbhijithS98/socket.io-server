const fs = require("fs");
const path = require("path");
const { BrowserWindow } = require("electron");

const logFile = path.join(__dirname, "../../../logs/axios.log");

// Ensure logs directory exists
fs.mkdirSync(path.dirname(logFile), { recursive: true });

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;

  // Write to file
  fs.appendFileSync(logFile, logLine);

  // Send log to renderer if a window exists
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send("axios-log", logLine);
  }
}

module.exports = { logToFile, logFile };
