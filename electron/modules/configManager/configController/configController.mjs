import { ipcMain } from 'electron';
import { configService } from '../configService/configService.mjs';

/**
 * 初始化配置控制器
 */
function configController() {
    // 处理获取应用名称的请求（使用invoke方式）
    ipcMain.handle('get-app-name', () => {
        return configService.getAppName();
    });

}

export { configController };
