const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  // getPublicUrl: () => ipcRenderer.invoke('get-public-url'),
  // getLocalIp: () => ipcRenderer.invoke('get-local-ip'),
});
