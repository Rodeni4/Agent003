import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('okAPI', {
  openLogin: (url?: string) => ipcRenderer.invoke('ok:open-login', url),
  checkSession: () => ipcRenderer.invoke('ok:check-session'),
  resetSession: () => ipcRenderer.invoke('ok:reset-session'),
  publishTextPost: (payload: {
    text: string;
    debug: boolean;
    imagePaths?: string[];
    publishToWall: boolean;
    publishToGroup: boolean;
    groupValue?: string;
  }) => ipcRenderer.invoke('ok:publish-text-post', payload),
});