import { app } from 'electron';
import log from 'electron-log';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import { initializeAutoUpdater } from './modules/utils/autoUpdater/autoUpdater.mjs';
import { createMainWindow } from './modules/windowsManager/windowsService/windowsService.mjs';
import { initializeControllers } from './modules/utils/initializeControllersUtils/initializeControllersUtils.mjs';
import { setupTray } from './modules/tray/trayManager/trayManager.mjs';
import { quitApp } from './modules/utils/appUtils/appUtils.mjs';
import { spawn, execSync, exec } from 'child_process';
// 检测操作系统
const isWindows = process.platform === 'win32';

/**
 * 清理当前应用启动的FRP相关进程的函数
 * 这个函数会被用在正常退出和意外退出的情况下
 */
async function cleanupFrpProcesses() {
  console.log('正在清理当前应用启动的FRP相关进程...');
  
  try {
    // 导入隧道服务
    const { tunnelService } = await import('./modules/frps/Service/tunnelService.mjs');
    
    // 停止所有运行中的隧道（只停止当前应用启动的frpc进程）
    const tunnelStopResults = await tunnelService.stopAllTunnels();
    console.log(`已停止 ${tunnelStopResults.length} 个运行中的隧道`);
    
  } catch (error) {
    console.error('关闭隧道时发生错误:', error);
  }
  
  try {
    // 导入frps配置服务（使用默认导入）
    const frpsConfigService = (await import('./modules/frps/Service/frpsConfigService.mjs')).default;
    
    // 停止所有运行中的frps服务端（只停止当前应用启动的frps进程）
    const frpsStopResults = await frpsConfigService.stopAllConfigs();
    console.log(`已停止 ${frpsStopResults.length} 个运行中的frps服务端`);
    
  } catch (error) {
    console.error('关闭frps服务端时发生错误:', error);
  }
  
  // 等待一小段时间确保所有进程完全停止
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('FRP进程清理完成');
}

process.env.NODE_ENV = process.argv.includes('--dev') ? 'development' : 'production';
log.transports.file.level = 'info';
autoUpdater.logger = log;
app.commandLine.appendSwitch('lang', 'zh-CN');

const gotTheLock = app.requestSingleInstanceLock();
let mainPage;
let tray;

app.whenReady().then(async () =>{
  //防止程序多开
  if (!gotTheLock) {
      quitApp();
  }
  mainPage = createMainWindow();
  initializeControllers(mainPage);
  tray = setupTray(mainPage, quitApp);

  // 初始化自动更新器
  initializeAutoUpdater(mainPage, autoUpdater, log);
  
  // 验证和修复隧道和服务状态
  try {
    console.log('正在验证隧道和服务状态...');
    
    // 验证隧道状态
    const { tunnelService } = await import('./modules/frps/Service/tunnelService.mjs');
    const tunnels = tunnelService.getAllTunnels();
    let tunnelsFixed = 0;
    
    for (const tunnel of tunnels) {
      if (tunnel.status === 'running') {
        const isActuallyRunning = await tunnelService.isTunnelRunning(tunnel.id);
        if (!isActuallyRunning) {
          console.log(`隧道 ${tunnel.id} 标记为运行中，但进程不存在，更新状态为已停止`);
          tunnelService.updateTunnelStatus(tunnel.id, 'stopped');
          tunnelsFixed++;
        }
      }
    }
    
    // 验证FRPS服务状态
    const frpsConfigService = (await import('./modules/frps/Service/frpsConfigService.mjs')).default;
    const configs = frpsConfigService.getAllConfigs();
    let configsFixed = 0;
    
    for (const config of configs) {
      if (config.status === 'running') {
        const isActuallyRunning = await frpsConfigService.isConfigRunning(config.id);
        if (!isActuallyRunning) {
          console.log(`FRPS配置 ${config.id} 标记为运行中，但进程不存在，更新状态为已停止`);
          frpsConfigService.updateConfigStatus(config.id, 'stopped');
          configsFixed++;
        }
      }
    }
    
    console.log(`状态验证完成，修复了 ${tunnelsFixed} 个隧道和 ${configsFixed} 个FRPS配置的状态`);
  } catch (error) {
    console.error('验证隧道和服务状态时发生错误:', error);
  }
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
    await cleanupFrpProcesses();
  } catch (error) {
    console.error('清理FRP进程时发生错误:', error);
    
    // 只记录错误，不尝试强制终止所有FRP进程
    // 避免影响用户手动启动的或其他应用程序启动的FRP进程
  }
});

app.on('activate', () => {
  if (mainPage === null) {
    mainPage = createMainWindow();
  }
});

// 捕获未处理的异常，确保在崩溃前清理FRP进程
process.on('uncaughtException', async (error) => {
  console.error('发生未捕获的异常:', error);
  
  try {
    console.log('在崩溃前清理FRP进程...');
    await cleanupFrpProcesses();
  } catch (cleanupError) {
    console.error('清理进程时发生错误:', cleanupError);
  }
  
  // 允许进程正常退出
  process.exit(1);
});

// 捕获未处理的Promise拒绝
process.on('unhandledRejection', async (reason, promise) => {
  console.error('发生未处理的Promise拒绝:', reason);
  
  try {
    console.log('在Promise拒绝时清理FRP进程...');
    await cleanupFrpProcesses();
  } catch (cleanupError) {
    console.error('清理进程时发生错误:', cleanupError);
  }
});

// 捕获SIGTERM信号（通常由系统或进程管理器发送的终止信号）
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，正在清理进程...');
  
  try {
    await cleanupFrpProcesses();
  } catch (error) {
    console.error('SIGTERM信号处理时发生错误:', error);
  } finally {
    // 确保进程最终退出
    app.quit();
  }
});

// 捕获SIGINT信号（通常由Ctrl+C发送的中断信号）
process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，正在清理进程...');
  
  try {
    await cleanupFrpProcesses();
  } catch (error) {
    console.error('SIGINT信号处理时发生错误:', error);
  } finally {
    // 确保进程最终退出
    app.quit();
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