const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  onLog: (callback) => ipcRenderer.on("activity-log", (event, logLine) => callback(logLine)), // Subscribe to live logs
  loadPage: (page) => ipcRenderer.invoke("load-page", page), // Page navigation
  saveApiKey: (key) => ipcRenderer.invoke("save-api-key", key),
  getApiKey: () => ipcRenderer.invoke("get-api-key"),

  // readLogs: () => ipcRenderer.invoke("read-logs"), // Fetch existing logs
  // getPublicUrl: () => ipcRenderer.invoke('get-public-url'),
  // getLocalIp: () => ipcRenderer.invoke('get-local-ip'),
});
