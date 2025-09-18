const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  // Fetch existing logs
  readLogs: () => ipcRenderer.invoke("read-logs"),
  // Subscribe to live logs
  onLog: (callback) => ipcRenderer.on("axios-log", (event, logLine) => callback(logLine)),

  
  // getPublicUrl: () => ipcRenderer.invoke('get-public-url'),
  // getLocalIp: () => ipcRenderer.invoke('get-local-ip'),
});
