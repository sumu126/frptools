import { ipcMain } from 'electron';

/**
 * 初始化窗口控制器
 * @param {BrowserWindow} mainPage - 主窗口实例
 */
function windowsController(mainPage) {
    ipcMain.on('window-minimize', () => {
        mainPage.minimize();
    });

    ipcMain.on('window-maximize', () => {
        if (mainPage.isMaximized()) {
            mainPage.unmaximize();
        } else {
            mainPage.maximize();
        }
    });

    ipcMain.on('window-close', () => {
        mainPage.close();
    });
}

export { windowsController };