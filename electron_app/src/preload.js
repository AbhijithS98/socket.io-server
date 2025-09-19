const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  onLog: (callback) => ipcRenderer.on("activity-log", (event, logLine) => callback(logLine)), // Subscribe to live logs

  // readLogs: () => ipcRenderer.invoke("read-logs"), // Fetch existing logs
  // getPublicUrl: () => ipcRenderer.invoke('get-public-url'),
  // getLocalIp: () => ipcRenderer.invoke('get-local-ip'),
});
