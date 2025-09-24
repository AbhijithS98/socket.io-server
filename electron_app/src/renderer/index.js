document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggle-server-btn");
  const statusBox = document.querySelector(".status-box");
  const statusText = document.getElementById("status-text");
  const apiKeySpan = document.getElementById("api-key");
  const logBox = document.getElementById("logBox");
  const setUpBtn = document.getElementById("setupBtn");
  

  let isRunning = false;
  let apiKey = "";

  function showToast(msg) {
    const toast = document.createElement("div");
    toast.textContent = msg;
    toast.style.position = "fixed";
    toast.style.top = "1px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "#ffc107";  // yellow
    toast.style.color = "#212529";       // dark text for readability
    toast.style.padding = "10px 15px";
    toast.style.borderRadius = "6px";
    toast.style.fontSize = "16px";
    toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    toast.style.zIndex = "1000";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";

    document.body.appendChild(toast);

    // Fade in
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 3000);

  }

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
      toggleBtn.classList.remove("btn-success");
      toggleBtn.classList.add("btn-primary");
      toggleBtn.textContent = "Stop Server";
    } else {
      statusBox.classList.remove("status-running");
      statusText.textContent = "Stopped";
      toggleBtn.classList.remove("btn-primary");
      toggleBtn.classList.add("btn-success");
      toggleBtn.textContent = "Start Server";
      
    }
  }

  async function loadApiKey() {
    apiKey = await window.api.getApiKey();
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
        if (apiKey) {
          await window.api.startServer(apiKey);
        } else {
          showToast("Please setup the API key before starting the server");
        }
      }
      updateUI();
    });
  }

  // Button click logic
  if (setUpBtn) {
    setUpBtn.addEventListener("click", async () => {
      if (!isRunning) {
        await window.api.loadPage("setup.html");
      } else {
        console.log("cannnot setup API key while the server is running!");
        showToast("Cannot setup API key while the server is running!");
      }
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
