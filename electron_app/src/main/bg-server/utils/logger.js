const fs = require("fs");
const path = require("path");
const { BrowserWindow } = require("electron");

let publicIP = "::1"; // default fallback

async function fetchPublicIP() {
  try {
    const res = await fetch("https://api.ipify.org"); 
    const ip = await res.text(); 
    publicIP = ip.trim();
  } catch (err) {
    console.log("Error fetching IP");
  }
}

// Get today's log file
function getLogFilePath() {
  const logsDir = path.join(__dirname, "../../logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return path.join(logsDir, `${date}.log`);
}

// Format date in CLF format
function formatDateCLF(date = new Date()) {
  return date.toISOString()
    .replace("T", ":")
    .replace(/\..+/, " +0000");
}

// Format log line 
function formatCommonLog({ method, url, httpVersion, status, contentLength }) {
  const remoteAddr = publicIP || "::1";
  const remoteUser = "-";
  const date = formatDateCLF();
  return `${remoteAddr} - ${remoteUser} [${date}] "${method.toUpperCase()} ${url} HTTP/${httpVersion}" ${status} ${contentLength}`;
}

// Write log line to daily log file + send live to UI
function logCommon(entry) {
  const line = formatCommonLog(entry);
  const filePath = getLogFilePath();
  fs.appendFileSync(filePath, line + "\n", "utf8");
 
  //send NEW logs to renderer 
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send("activity-log", line);
  }

  return line;
}

module.exports = { logCommon, fetchPublicIP };


// const logFile = path.join(__dirname, "../../../logs/axios.log");
// fs.mkdirSync(path.dirname(logFile), { recursive: true });

// function logToFile(message) {
//   const timestamp = new Date().toISOString();
//   const logLine = `[${timestamp}] ${message}\n`;

//   // Write to file
//   fs.appendFileSync(logFile, logLine);

//   // Send log to renderer if a window exists
//   const win = BrowserWindow.getAllWindows()[0];
//   if (win) {
//     win.webContents.send("axios-log", logLine);
//   }
// }

// module.exports = { logToFile, logFile };

