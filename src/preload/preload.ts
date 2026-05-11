import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('okAPI', {
  openLogin: () => ipcRenderer.invoke('ok:open-login'),
  checkSession: () => ipcRenderer.invoke('ok:check-session'),
  resetSession: () => ipcRenderer.invoke('ok:reset-session'),
  publishTextPost: (payload: { text: string; debug: boolean; imagePath?: string }) =>
  ipcRenderer.invoke('ok:publish-text-post', payload),  
});