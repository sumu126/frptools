import { ipcMain } from 'electron';
import { wallpaperService } from '../wallpaperService/wallpaperService.mjs';

/**
 * 初始化壁纸控制器
 * @param {BrowserWindow} mainPage - 主窗口实例
 */
function wallpaperController(mainPage) {
    // 设置壁纸
    ipcMain.handle('set-wallpaper', async (event, { type, path, opacity }) => {
        try {
            const result = await wallpaperService.setWallpaper(type, path, opacity, mainPage);
            return { success: true, result };
        } catch (error) {
            console.error('设置壁纸失败:', error);
            return { success: false, error: error.message };
        }
    });

    // 获取壁纸设置
    ipcMain.handle('get-wallpaper', async () => {
        try {
            const wallpaper = await wallpaperService.getWallpaper();
            return { success: true, wallpaper };
        } catch (error) {
            console.error('获取壁纸设置失败:', error);
            return { success: false, error: error.message };
        }
    });

    // 清除壁纸
    ipcMain.handle('clear-wallpaper', async () => {
        try {
            await wallpaperService.clearWallpaper(mainPage);
            return { success: true };
        } catch (error) {
            console.error('清除壁纸失败:', error);
            return { success: false, error: error.message };
        }
    });

    // 设置窗口透明度
    ipcMain.handle('set-window-opacity', async (event, opacity) => {
        try {
            // 不设置主窗口透明度，只保存到存储中
            // 主窗口透明度通过CSS变量控制，不影响壁纸显示
            await wallpaperService.setWindowOpacity(opacity);
            
            // 通知渲染进程更新透明度
            mainPage.webContents.send('update-opacity', { opacity });
            
            return { success: true };
        } catch (error) {
            console.error('设置窗口透明度失败:', error);
            return { success: false, error: error.message };
        }
    });

    // 获取窗口透明度
    ipcMain.handle('get-window-opacity', async () => {
        try {
            const opacity = await wallpaperService.getWindowOpacity();
            return { success: true, opacity };
        } catch (error) {
            console.error('获取窗口透明度失败:', error);
            return { success: false, error: error.message };
        }
    });

    // 选择文件
    ipcMain.handle('select-wallpaper-file', async () => {
        try {
            const result = await wallpaperService.selectFile();
            return { success: true, filePath: result };
        } catch (error) {
            console.error('选择文件失败:', error);
            return { success: false, error: error.message };
        }
    });

    // 选择图片文件
    ipcMain.handle('select-image-file', async () => {
        try {
            const result = await wallpaperService.selectImageFile();
            return { success: true, filePath: result };
        } catch (error) {
            console.error('选择图片文件失败:', error);
            return { success: false, error: error.message };
        }
    });

    // 选择视频文件
    ipcMain.handle('select-video-file', async () => {
        try {
            const result = await wallpaperService.selectVideoFile();
            return { success: true, filePath: result };
        } catch (error) {
            console.error('选择视频文件失败:', error);
            return { success: false, error: error.message };
        }
    });
}

export { wallpaperController };