import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('okAPI', {
  openLogin: (url?: string) => ipcRenderer.invoke('ok:open-login', url),

  checkSession: () => ipcRenderer.invoke('ok:check-session'),

  resetSession: () => ipcRenderer.invoke('ok:reset-session'),

  getGroupInfo: (groupValue: string) =>
    ipcRenderer.invoke('ok:get-group-info', groupValue),

  publishTextPost: (payload: {
    text: string;
    debug: boolean;
    imagePaths?: string[];
    publishToWall: boolean;
    publishToGroup: boolean;
    groupValue?: string;
  }) => ipcRenderer.invoke('ok:publish-text-post', payload),
});

contextBridge.exposeInMainWorld('vkAPI', {
  openLogin: () => ipcRenderer.invoke('vk:open-login'),
  checkSession: () => ipcRenderer.invoke('vk:check-session'),
  resetSession: () => ipcRenderer.invoke('vk:reset-session'),
});