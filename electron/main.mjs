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

// 程序退出前关闭所有正在运行的frp隧道和frps服务端
app.on('before-quit', async (event) => {
  console.log('程序即将退出，正在关闭所有运行的frp隧道和frps服务端...');
  
  try {
    // 导入隧道服务
    const { tunnelService } = await import('./modules/frps/Service/tunnelService.mjs');
    
    // 停止所有运行中的隧道
    const tunnelStopResults = await tunnelService.stopAllTunnels();
    
    console.log(`已停止 ${tunnelStopResults.length} 个运行中的隧道`);
    
  } catch (error) {
    console.error('关闭隧道时发生错误:', error);
    // 即使关闭隧道失败，也继续退出程序
  }
  
  try {
    // 导入frps配置服务（使用默认导入）
    const frpsConfigService = (await import('./modules/frps/Service/frpsConfigService.mjs')).default;
    
    // 停止所有运行中的frps服务端
    const frpsStopResults = await frpsConfigService.stopAllConfigs();
    
    console.log(`已停止 ${frpsStopResults.length} 个运行中的frps服务端`);
    
  } catch (error) {
    console.error('关闭frps服务端时发生错误:', error);
    // 即使关闭frps服务端失败，也继续退出程序
  }
  
  // 等待一小段时间确保所有进程完全停止
  await new Promise(resolve => setTimeout(resolve, 1000));
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