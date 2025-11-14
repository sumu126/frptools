import { Tray, Menu, app } from 'electron';
import path from 'node:path';
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
    // 确定图标路径，根据是否打包来调整
    let iconPath;
    if (app.isPackaged) {
        // 生产环境：处理asar包和unpack的情况
        // 尝试在app.asar.unpacked中查找（这是electron-builder asarUnpack配置后的路径）
        iconPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'icon.ico');
    } else {
        // 开发环境：使用相对路径
        iconPath = path.join(__dirname, '..', '..', '..', '..','icon.ico');
    }
    
    const tray = new Tray(iconPath);
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