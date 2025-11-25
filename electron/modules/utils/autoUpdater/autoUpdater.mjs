import { dialog } from 'electron';
import { updateToRestart } from '../appUtils/appUtils.mjs';
/**
 * 初始化自动更新器
 * @param {BrowserWindow} mainPage - 主窗口实例
 * @param {AutoUpdater} autoUpdater - 自动更新器实例
 * @param {Log} log - 日志实例
 */
function initializeAutoUpdater(mainPage, autoUpdater,log) {
    // 自动更新检查
    autoUpdater.checkForUpdatesAndNotify();
        autoUpdater.on('update-available', (info) => {
        log.info('Update available:', info);
        // mainPage.webContents.send('update_available');
    });

    autoUpdater.on('update-downloaded', async (info) => {
        log.info('Update downloaded:', info);
        // mainPage.webContents.send('update_downloaded');
        const result = await dialog.showMessageBox(mainPage, {
            type: 'question',
            buttons: ['确定', '取消'], 
            defaultId: 0, 
            cancelId: 1, 
            title: '确认更新',
            message: "更新已下载，是否立即重启应用以完成更新？（这可能需要一分钟）",
        });
        console.log(result.response);
        if (result.response === 0){
            console.log("updatetorestart");
            updateToRestart();
            autoUpdater.quitAndInstall();
        }
    });

    autoUpdater.on('error', (err) => {
        log.error('Update error:', err);
    }); 
}

export { initializeAutoUpdater };
