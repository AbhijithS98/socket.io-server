document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggle-server-btn");
  const statusBox = document.querySelector(".status-box");
  const statusText = document.getElementById("status-text");
  const apiKeySpan = document.getElementById("api-key");
  const logBox = document.getElementById("logBox");
  const setUpBtn = document.getElementById("setupBtn");

  let isRunning = false;

  // Listen for logs pushed from main
  window.api.onLog((logLine) => {
    logBox.textContent += logLine + "\n";
    logBox.scrollTop = logBox.scrollHeight; // auto-scroll to bottom
  });

  async function updateUI() {
    isRunning = await window.api.getServerStatus();
    if (isRunning) {
      statusBox.classList.add("status-running");
      statusText.textContent = "Running";
      toggleBtn.textContent = "Stop Server";
    } else {
      statusBox.classList.remove("status-running");
      statusText.textContent = "Stopped";
      toggleBtn.textContent = "Start Server";
    }
  }

  async function loadApiKey() {
    const apiKey = await window.api.getApiKey();
    if (apiKey) {
      apiKeySpan.textContent = apiKey;
    } else {
      apiKeySpan.textContent = "Not set";
    }
  }

  // Button click logic
  if (toggleBtn) {
    toggleBtn.addEventListener("click", async () => {
      if (isRunning) {
        await window.api.stopServer();
      } else {
        tunnelId = await window.api.startServer();
      }
      updateUI();
    });
  }

  // Button click logic
  if (setUpBtn) {
    setUpBtn.addEventListener("click", async () => {
      console.log("clieckkedd");
      await window.api.loadPage("setup.html");
    });
  }

  // async function fetchPublicIP() {
  //   try {
  //     const res = await fetch("https://api64.ipify.org?format=json");
  //     const data = await res.json();
  //     publicIp = data.ip;
  //     publicIpSpan.textContent = data.ip;
  //   } catch (err) {
  //     publicIpSpan.textContent = "Error fetching IP";
  //   }
  // }

  // async function getLocalIp() {
  //   let localIp = await window.api.getLocalIp();
  //   console.log("local IP : ",localIp);
  // }

  // Initialize UI
  updateUI();
  loadApiKey();
});
