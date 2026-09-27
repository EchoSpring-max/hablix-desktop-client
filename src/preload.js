const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hablixDesktop', Object.freeze({
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  closeSettings: () => ipcRenderer.send('settings:close')
}));
