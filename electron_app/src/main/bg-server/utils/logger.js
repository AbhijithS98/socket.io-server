const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "../../../logs/axios.log");

// Ensure logs directory exists
fs.mkdirSync(path.dirname(logFile), { recursive: true });

function logToFile(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

module.exports = { logToFile, logFile };
