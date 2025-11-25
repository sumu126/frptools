import { app } from 'electron';
import log from 'electron-log';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import { initializeAutoUpdater } from './modules/utils/autoUpdater/autoUpdater.mjs';
import { createMainWindow } from './modules/windowsManager/windowsService/windowsService.mjs';
import { initializeControllers } from './modules/utils/initializeControllersUtils/initializeControllersUtils.mjs';
import { setupTray } from './modules/tray/trayManager/trayManager.mjs';
import { quitApp } from './modules/utils/appUtils/appUtils.mjs';

process.env.NODE_ENV = process.argv.includes('--dev') ? 'development' : 'production';
log.transports.file.level = 'info';
autoUpdater.logger = log;
app.commandLine.appendSwitch('lang', 'zh-CN');

const gotTheLock = app.requestSingleInstanceLock();
let mainPage;
let tray;

app.whenReady().then(() =>{
  //防止程序多开
  if (!gotTheLock) {
      quitApp();
  }
  mainPage = createMainWindow();
  initializeControllers(mainPage);
  tray = setupTray(mainPage, quitApp);

  // 初始化自动更新器
  initializeAutoUpdater(mainPage, autoUpdater, log);

});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainPage === null) {
    mainPage = createMainWindow();
  }
});

// 禁用window.open打开窗口
// app.on('web-contents-created', (e, webContents) => {
//     // 禁用window.open打开窗口
//     webContents.setWindowOpenHandler((details) => {
//         console.log(details.url);
//         webContents.loadURL(details.url);
//         return { action: 'deny' }
//     });

//     // app.on('before-quit', (event) => {
//     //     deleteFolderAndContents();
//     // });

// });