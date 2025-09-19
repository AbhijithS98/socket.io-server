const { BrowserWindow } = require("electron");

function sendLogToRenderer(message, channel = "activity-log") {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send(channel, message);
  }
}

module.exports = { sendLogToRenderer };
