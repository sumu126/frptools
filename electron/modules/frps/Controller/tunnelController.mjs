import { ipcMain } from 'electron';
import { tunnelService } from '../Service/tunnelService.mjs';

/**
 * 初始化隧道控制器
 */
function tunnelController() {
  // 获取所有隧道
  ipcMain.handle('tunnel:getAll', () => {
    try {
      return tunnelService.getAllTunnels();
    } catch (error) {
      console.error('获取隧道列表失败:', error);
      return { error: error.message };
    }
  });

  // 根据ID获取隧道
  ipcMain.handle('tunnel:getById', (event, id) => {
    try {
      return tunnelService.getTunnelById(id);
    } catch (error) {
      console.error('获取隧道失败:', error);
      return { error: error.message };
    }
  });

  // 添加隧道
  ipcMain.handle('tunnel:add', (event, tunnelData) => {
    try {
      return tunnelService.addTunnel(tunnelData);
    } catch (error) {
      console.error('添加隧道失败:', error);
      return { error: error.message };
    }
  });

  // 更新隧道
  ipcMain.handle('tunnel:update', (event, id, updateData) => {
    try {
      return tunnelService.updateTunnel(id, updateData);
    } catch (error) {
      console.error('更新隧道失败:', error);
      return { error: error.message };
    }
  });

  // 删除隧道
  ipcMain.handle('tunnel:delete', (event, id) => {
    try {
      return tunnelService.deleteTunnel(id);
    } catch (error) {
      console.error('删除隧道失败:', error);
      return { error: error.message };
    }
  });

  // 启动隧道
  ipcMain.handle('tunnel:start', (event, id) => {
    try {
      return tunnelService.startTunnel(id);
    } catch (error) {
      console.error('启动隧道失败:', error);
      return { error: error.message };
    }
  });

  // 停止隧道
  ipcMain.handle('tunnel:stop', (event, id) => {
    try {
      return tunnelService.stopTunnel(id);
    } catch (error) {
      console.error('停止隧道失败:', error);
      return { error: error.message };
    }
  });

  // 更新隧道状态
  ipcMain.handle('tunnel:updateStatus', (event, id, status) => {
    try {
      return tunnelService.updateTunnelStatus(id, status);
    } catch (error) {
      console.error('更新隧道状态失败:', error);
      return { error: error.message };
    }
  });

  // 清空所有隧道
  ipcMain.handle('tunnel:clearAll', () => {
    try {
      tunnelService.clearAllTunnels();
      return { success: true };
    } catch (error) {
      console.error('清空隧道失败:', error);
      return { error: error.message };
    }
  });

  // 导出隧道配置
  ipcMain.handle('tunnel:export', () => {
    try {
      return tunnelService.exportTunnels();
    } catch (error) {
      console.error('导出隧道配置失败:', error);
      return { error: error.message };
    }
  });

  // 导入隧道配置
  ipcMain.handle('tunnel:import', (event, tunnelConfigs) => {
    try {
      return tunnelService.importTunnels(tunnelConfigs);
    } catch (error) {
      console.error('导入隧道配置失败:', error);
      return { error: error.message };
    }
  });

  // 获取隧道JSON配置
  ipcMain.handle('tunnel:getJsonConfig', (event, id) => {
    try {
      return tunnelService.getTunnelJsonConfig(id);
    } catch (error) {
      console.error('获取隧道JSON配置失败:', error);
      return { error: error.message };
    }
  });

  // 获取隧道日志
  ipcMain.handle('tunnel:getLogs', (event, id) => {
    try {
      return tunnelService.getTunnelLogs(id);
    } catch (error) {
      console.error('获取隧道日志失败:', error);
      return { error: error.message };
    }
  });

  // 清除隧道日志
  ipcMain.handle('tunnel:clearLogs', (event, id) => {
    try {
      tunnelService.clearTunnelLogs(id);
      return { success: true };
    } catch (error) {
      console.error('清除隧道日志失败:', error);
      return { error: error.message };
    }
  });

  console.log('隧道控制器初始化完成');
}

export { tunnelController };