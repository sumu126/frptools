import { dialog } from 'electron';
import { mainPage } from '../../windowsManager/windowsService/windowsService.mjs';

/**
 * 显示消息框
 * @param {BrowserWindow} win - 窗口实例，'mainPage' 表示主窗口
 * @param {string} type - 消息框类型，例如 'info', 'warning', 'error'
 * @param {string[]} buttons - 按钮文本数组
 * @param {number} defaultId - 默认按钮索引
 * @param {number} cancelId - 取消按钮索引
 * @param {string} title - 消息框标题
 * @param {string} message - 消息框内容
 * @returns {Promise<number>} - 用户点击的按钮索引
 */
function showMessageBox(win, type, buttons, defaultId, cancelId, title, message){
    const result = dialog.showMessageBox(win === 'mainPage' ? mainPage : win, {
        type: type,
        buttons: buttons, 
        defaultId: defaultId, 
        cancelId: cancelId, 
        title: title,
        message: message,
    });
    return result;
}

export {
    showMessageBox
};