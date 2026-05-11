import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('okAPI', {
  openLogin: () => ipcRenderer.invoke('ok:open-login'),
  checkSession: () => ipcRenderer.invoke('ok:check-session'),
  resetSession: () => ipcRenderer.invoke('ok:reset-session'),
});