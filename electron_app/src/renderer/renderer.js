const toggleBtn = document.getElementById("toggle-server-btn");
const statusBox = document.querySelector(".status-box");
const statusText = document.getElementById("status-text");
const publicUrlSpan = document.getElementById("public-url");
const logBox = document.getElementById("logBox");

let isRunning = false;
let tunnelId = '';

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
    if (tunnelId) {
      publicUrlSpan.textContent = tunnelId;
    }
    toggleBtn.textContent = "Stop Server";
  } else {
    statusBox.classList.remove("status-running");
    statusText.textContent = "Stopped";
    publicUrlSpan.textContent = "Not available";
    toggleBtn.textContent = "Start Server";
  }
}

// Button click logic
toggleBtn.addEventListener('click', async () => {
  if (isRunning) {
    await window.api.stopServer();
  } else {
    tunnelId = await window.api.startServer();
    publicUrlSpan.textContent = tunnelId || "Error starting socket";
  }
  updateUI();
});



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

