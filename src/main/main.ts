import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

import {
  checkOkSession,
  closeOkContext,
  getOkProfilePath,
  openOkLogin,
  resetOkSession,
} from './okService';

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
  ipcMain.handle('ok:open-login', async () => {
    return openOkLogin();
  });

  ipcMain.handle('ok:check-session', async () => {
    return checkOkSession();
  });

  ipcMain.handle('ok:reset-session', async () => {
    return resetOkSession();
  });

  ipcMain.handle(
    'ok:publish-text-post',
    async (
      _event,
      payload: {
        text: string;
        debug: boolean;
        imagePath?: string;
        publishToWall: boolean;
        publishToGroup: boolean;
        groupValue?: string;
      }
    ) => {
      return publishOkTextPost({
        text: payload.text,
        debug: payload.debug,
        imagePath: payload.imagePath,
        publishToWall: payload.publishToWall,
        publishToGroup: payload.publishToGroup,
        groupValue: payload.groupValue,
        okProfilePath: getOkProfilePath(),
      });
    }
  );

  createWindow();
});

app.on('window-all-closed', async () => {
  await closeOkContext();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});