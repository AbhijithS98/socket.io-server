const express = require("express");

function createExpressApp() {
  const app = express();

  app.get("/", (req, res) => {
    res.send("Hello from Electron's express app!");
  });

  return app;
}

module.exports = createExpressApp;
