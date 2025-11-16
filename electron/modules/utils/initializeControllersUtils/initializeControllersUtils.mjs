import { windowsController } from '../../windowsManager/windowsController/windowsController.mjs';
import { dialogController } from '../../dialog/dialogController/dialogController.mjs';
import { configController } from '../../configManager/configController/configController.mjs';
import { tunnelController } from '../../frps/Controller/tunnelController.mjs';

/**
 * 初始化所有控制器
 * @param {BrowserWindow} mainPage - 主窗口实例
 */
function initializeControllers(mainPage) {
    windowsController(mainPage);
    dialogController(mainPage);
    configController();
    tunnelController();
}
export { initializeControllers };