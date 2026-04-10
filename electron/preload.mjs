import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronStore', {
  get: (key) => ipcRenderer.invoke('electron-store-get', key),
  set: (key, val) => ipcRenderer.invoke('electron-store-set', key, val),
  delete: (key) => ipcRenderer.invoke('electron-store-delete', key)
});