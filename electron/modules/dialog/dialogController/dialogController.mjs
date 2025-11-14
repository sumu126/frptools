import { showMessageBox } from '../utils/dialogUtils.mjs';
import { ipcMain } from 'electron';

/**
 * 初始化对话框控制器
 * @param {BrowserWindow} mainPage - 主窗口实例
 */
function dialogController(mainPage) {
    
    ipcMain.on('showMessageBox', (event, win, type, buttons, defaultId, cancelId, title, message) => {
        showMessageBox(win, type, buttons, defaultId, cancelId, title, message);
    })
}

export { dialogController };