import { Tray, Menu, app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { configService } from '../../configManager/configService/configService.mjs';

// 在ES模块中获取__filename和__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * 初始化托盘管理器
 * @param {BrowserWindow} mainPage - 主窗口实例
 * @param {Function} quitApp - 退出应用程序的函数
 */
function setupTray(mainPage, quitApp) {
    // 确定图标路径，根据操作系统类型和是否打包来调整
    let iconPath;
    // 根据操作系统选择图标格式：Windows使用ico，Linux使用png
    const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon256.png';
    const fallbackIcon = process.platform === 'win32' ? 'icon256.png' : 'icon.ico';
    
    if (app.isPackaged) {
        // 生产环境：处理asar包和unpack的情况
        iconPath = path.join(process.resourcesPath, 'app.asar.unpacked', iconName);
        // 如果主图标不存在，尝试使用备选图标
        if (!fs.existsSync(iconPath)) {
            console.warn(`主图标 ${iconName} 不存在，尝试使用备选图标 ${fallbackIcon}`);
            iconPath = path.join(process.resourcesPath, 'app.asar.unpacked', fallbackIcon);
        }
    } else {
        // 开发环境：使用相对路径
        iconPath = path.join(__dirname, '..', '..', '..', '..', iconName);
        // 如果主图标不存在，尝试使用备选图标
        if (!fs.existsSync(iconPath)) {
            console.warn(`主图标 ${iconName} 不存在，尝试使用备选图标 ${fallbackIcon}`);
            iconPath = path.join(__dirname, '..', '..', '..', '..', fallbackIcon);
        }
    }
    
    let tray;
    try {
        tray = new Tray(iconPath);
    } catch (error) {
        console.error('创建托盘失败，尝试使用默认托盘:', error);
        // 如果图标加载失败，Electron会尝试使用默认托盘
        // 在某些情况下，即使没有图标路径，Electron也会创建一个基本托盘
        tray = new Tray(''); // 使用空字符串，让Electron决定默认行为
    }
    tray.setToolTip(configService.getAppName());

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '　显示　　',
            click: () => { mainPage.show(); }
        },
        {
            label: '　退出　　',
            click: () => { quitApp(); }
        }
    ]);
    
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        mainPage.isVisible() ? mainPage.hide() : mainPage.show();
        mainPage.setSkipTaskbar(!mainPage.isVisible());
    });

    return tray;
}

export { setupTray };