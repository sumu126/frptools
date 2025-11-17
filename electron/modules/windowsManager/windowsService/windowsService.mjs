import { app, BrowserWindow, dialog, Menu, Notification, session } from 'electron';
import path from 'node:path';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import { getQuitFlag } from '../../utils/appUtils/appUtils.mjs';
import { storeManager } from '../../store/storeManager/storeManager.mjs';
import { configService } from '../../configManager/configService/configService.mjs';



// 在ES模块中获取__filename和__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainPage;

/**
 * 创建主窗口
 * @returns {BrowserWindow} - 主窗口实例
 */
// 设置内容安全策略
function setupCSP() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          // 严格的内容安全策略，允许访问本地文件
          "default-src 'self' 'unsafe-inline' data: file:; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data: file: https:; " +
          "media-src 'self' data: file: https:; " +
          "connect-src 'self' https: wss:;"
        ]
      }
    })
  })
}

function createMainWindow() {
    // 设置 CSP
    setupCSP()
    
    // 确定图标路径，根据是否打包来调整
    let iconPath;
    if (app.isPackaged) {
        // 生产环境：获取应用资源目录路径
        const resourcesPath = path.join(process.resourcesPath, 'icon.ico');
        iconPath = resourcesPath;
    } else {
        // 开发环境：使用相对路径
        iconPath = path.join(__dirname, '..', '..', '..', '..', 'icon.ico');
    }

    mainPage = new BrowserWindow({
        width: 1000,
        height: 600,
        minWidth: 472,
        minHeight: 350,
        frame: false,
        show: false,
        icon: iconPath,
        webPreferences: {
            // 🔒 禁用 Node.js 集成（安全关键）
            nodeIntegration: false,
            // 🔒 启用上下文隔离（安全关键）
            contextIsolation: true,
            // 🔒 启用进程沙箱
            sandbox: true,
            // 🔒 允许访问本地文件（用于壁纸功能）
            webSecurity: false,
            // 🔒 预加载脚本（用于安全地暴露 API）
            preload: path.join(__dirname, '..', '..', '..', 'preload.cjs')
        }
    });
    console.log(path.join(__dirname, '..', '..', '..', 'preload.cjs'));

      // 🔒 安全增强：限制导航
//   mainPage.webContents.on('will-navigate', (event, navigationUrl) => {
//     const parsedUrl = new URL(navigationUrl)
    
//     // 只允许导航到本地文件或开发服务器
//     if (process.env.NODE_ENV === 'development') {
//       if (!navigationUrl.startsWith('http://localhost:5173')) {
//         event.preventDefault()
//       }
//     } else {
//       if (parsedUrl.protocol !== 'file:') {
//         event.preventDefault()
//       }
//     }
//   })

//   // 🔒 安全增强：限制新窗口创建
//   mainPage.webContents.setWindowOpenHandler(({ url }) => {
//     // 禁止创建新窗口，或者进行严格验证
//     return { action: 'deny' }
//   })

  mainPage.on('closed', () => {
    mainPage = null
  })


    // mainPage.setAspectRatio(1.4);

    // 在正确的事件中设置标题
    mainPage.on('ready-to-show', () => {
        const appName = configService.getAppName();
        mainPage.setTitle(appName); // 直接设置窗口标题
    });

    // 加载 Vue 开发服务器或生产构建文件
    if (process.env.NODE_ENV === 'development') {
        // 开发环境：建议使用 HTTPS 或确保本地开发服务器安全
        mainPage.loadURL('http://localhost:5173')
        // 开发环境：打开开发者工具
        // mainPage.webContents.openDevTools()
    } else {
        // 生产环境
        const indexHtmlPath = path.join(__dirname, '..', '..', '..', '..', 'dist', 'index.html');
        mainPage.loadFile(indexHtmlPath);
    }

    mainPage.removeMenu();
    // mainPage.webContents.openDevTools();

    mainPage.on('ready-to-show', () => {
        mainPage.show();
    });

    mainPage.on('maximize', () => {
        mainPage.webContents.send('window-is-maximized', true);
    });

    mainPage.on('unmaximize', () => {
        mainPage.webContents.send('window-is-maximized', false);
    });

    mainPage.on('close', (event) => {
        if (!getQuitFlag()) {
            event.preventDefault();
            mainPage.hide();
            mainPage.setSkipTaskbar(true);


            // 检查通知是否可用
            if (!storeManager.get('onceNotification') && Notification.isSupported()) {
                const notification = new Notification({
                    title: '已最小化到托盘',
                    body: '保持后台运行哦~',
                    icon: path.join(__dirname, '..', 'icon.ico'),
                });
                notification.show();
                storeManager.set('onceNotification', true);
            }
        }
    });

    return mainPage;
}

function mainPageShow(){
    mainPage.show();
}

function mainPageHide(){
    mainPage.hide();
}

function getMianPageVisible(){
    return mainPage.isVisible();
}



 // 监听显示右键菜单的请求
function showcontextmenu (position) {
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '保存图片',
            click: async () => {
                
                const result = await dialog.showOpenDialog(imgWindows, {
                    title: '选择保存路径',
                    properties: ['openDirectory']
                });
                // console.log(position.path);console.log(result.canceled?'NoPath':result.filePaths[0]); 
                // 使用 fs.copyFile 进行文件复制
                fs.copyFile( decodeURIComponent(position.path), decodeURIComponent(path.join(result.filePaths[0], '屏幕截图' + position.path.slice(position.path.lastIndexOf('_'))) ), (err) => {
                    if (err) {
                        dialog.showErrorBox('文件复制失败:', err.message);
                    }
                });
            }
        },
        {
            type: 'separator'
        },
        {
            label: '关闭',
            click:  () => {
                imgWindows.close();
            }
        }
    ]);

    // 在指定位置显示右键菜单
    contextMenu.popup({
        window: imgWindows,
        x: position.x,
        y: position.y
    });
}


export {
    createMainWindow,
    mainPageHide,
    mainPageShow,
    getMianPageVisible,
    showcontextmenu,
    mainPage
};