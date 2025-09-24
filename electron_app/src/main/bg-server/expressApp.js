const express = require("express");
const { sendLogToRenderer } = require("./utils/logRenderer")

function createExpressApp() {
  const app = express();

  app.get("/", (req, res) => {
    res.send("Hello from Electron's express app!");
  });
  
  sendLogToRenderer("Starting background server ...")
  return app;
}

module.exports = createExpressApp;
