import { ipcMain } from 'electron';
import frpsConfigService from '../Service/frpsConfigService.mjs';

/**
 * 清理对象，确保可以序列化
 * @param {Object} obj - 需要清理的对象
 * @returns {Object} 清理后的对象
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  
  return sanitized;
}

/**
 * 初始化FRPS配置控制器
 * @param {BrowserWindow} mainPage - 主窗口实例
 */
function frpsConfigController(mainPage) {
  // 获取所有配置
  ipcMain.handle('frpsConfig:getAll', () => {
    try {
      const result = frpsConfigService.getAllConfigs();
      return sanitizeObject(result);
    } catch (error) {
      console.error('获取FRPS配置失败:', error);
      throw error;
    }
  });

  // 根据ID获取配置
  ipcMain.handle('frpsConfig:getById', (event, id) => {
    try {
      const result = frpsConfigService.getConfigById(id);
      return sanitizeObject(result);
    } catch (error) {
      console.error('获取FRPS配置失败:', error);
      throw error;
    }
  });

  // 添加配置
  ipcMain.handle('frpsConfig:add', (event, configData) => {
    try {
      const result = frpsConfigService.addConfig(configData);
      return sanitizeObject(result);
    } catch (error) {
      console.error('添加FRPS配置失败:', error);
      throw error;
    }
  });

  // 更新配置
  ipcMain.handle('frpsConfig:update', (event, id, updateData) => {
    try {
      const result = frpsConfigService.updateConfig(id, updateData);
      return sanitizeObject(result);
    } catch (error) {
      console.error('更新FRPS配置失败:', error);
      throw error;
    }
  });

  // 删除配置
  ipcMain.handle('frpsConfig:delete', (event, id) => {
    try {
      return frpsConfigService.deleteConfig(id);
    } catch (error) {
      console.error('删除FRPS配置失败:', error);
      throw error;
    }
  });

  // 验证配置
  ipcMain.handle('frpsConfig:validate', (event, configData) => {
    try {
      const result = frpsConfigService.validateConfig(configData);
      return sanitizeObject(result);
    } catch (error) {
      console.error('验证FRPS配置失败:', error);
      throw error;
    }
  });

  // 获取TOML内容
  ipcMain.handle('frpsConfig:getTomlContent', (event, id) => {
    try {
      const result = frpsConfigService.getTomlContent(id);
      return sanitizeObject(result);
    } catch (error) {
      console.error('获取TOML内容失败:', error);
      throw error;
    }
  });

  // 启动配置
  ipcMain.handle('frpsConfig:start', async (event, id) => {
    try {
      const result = await frpsConfigService.startConfig(id);
      return sanitizeObject(result);
    } catch (error) {
      console.error('启动FRPS配置失败:', error);
      throw error;
    }
  });

  // 停止配置
  ipcMain.handle('frpsConfig:stop', async (event, id) => {
    try {
      const result = await frpsConfigService.stopConfig(id);
      return sanitizeObject(result);
    } catch (error) {
      console.error('停止FRPS配置失败:', error);
      throw error;
    }
  });

  // 重启配置
  ipcMain.handle('frpsConfig:restart', async (event, id) => {
    try {
      const result = await frpsConfigService.restartConfig(id);
      return sanitizeObject(result);
    } catch (error) {
      console.error('重启FRPS配置失败:', error);
      throw error;
    }
  });

  // 获取状态
  ipcMain.handle('frpsConfig:getStatus', (event, id) => {
    try {
      const result = frpsConfigService.getConfigStatus(id);
      return sanitizeObject(result);
    } catch (error) {
      console.error('获取FRPS配置状态失败:', error);
      throw error;
    }
  });
}

export { frpsConfigController };