import { app, BrowserWindow, ipcMain } from 'electron';
import { publishVkTextPost } from './vkPostingService';
import * as path from 'path';

import {
  checkOkSession,
  closeOkContext,
  getOkGroupInfo,
  getOkProfilePath,
  openOkLogin,
  resetOkSession,
} from './okService';

import {
  checkVkSession,
  closeVkContext,
  openVkLogin,
  resetVkSession,
  getVkGroupInfo,
  getVkProfilePath,
} from './vkService';

import { publishOkTextPost } from './postingService';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
  ipcMain.handle('ok:open-login', async (_event, url?: string) => {
    return openOkLogin(url);
  });

  ipcMain.handle('ok:check-session', async () => {
    return checkOkSession();
  });

  ipcMain.handle('ok:reset-session', async () => {
    return resetOkSession();
  });

  ipcMain.handle('ok:get-group-info', async (_event, groupValue: string) => {
    return getOkGroupInfo(groupValue);
  });

  ipcMain.handle('vk:open-login', async (_event, url?: string) => {
    return openVkLogin(url);
  });

  ipcMain.handle('vk:check-session', async () => {
    return checkVkSession();
  });

  ipcMain.handle('vk:reset-session', async () => {
    return resetVkSession();
  });

  ipcMain.handle('vk:get-group-info', async (_event, groupValue: string) => {
    return getVkGroupInfo(groupValue);
  });

  ipcMain.handle(
    'ok:publish-text-post',
    async (
      _event,
      payload: {
        text: string;
        debug: boolean;
        imagePaths?: string[];
        publishToWall: boolean;
        publishToGroup: boolean;
        groupValue?: string;
      }
    ) => {
      return publishOkTextPost({
        text: payload.text,
        debug: payload.debug,
        imagePaths: payload.imagePaths,
        publishToWall: payload.publishToWall,
        publishToGroup: payload.publishToGroup,
        groupValue: payload.groupValue,
        okProfilePath: getOkProfilePath(),
      });
    }
  );

  ipcMain.handle(
    'vk:publish-text-post',
    async (
      _event,
      payload: {
        text: string;
        debug: boolean;
        imagePaths?: string[];
        publishToWall: boolean;
        publishToGroup: boolean;
        groupValue?: string;
      }
    ) => {
      return publishVkTextPost({
        text: payload.text,
        debug: payload.debug,
        imagePaths: payload.imagePaths,
        publishToWall: payload.publishToWall,
        publishToGroup: payload.publishToGroup,
        groupValue: payload.groupValue,
        vkProfilePath: getVkProfilePath(),
      });
    }
  );

  createWindow();
});

app.on('window-all-closed', async () => {
  await closeOkContext();
  await closeVkContext();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});