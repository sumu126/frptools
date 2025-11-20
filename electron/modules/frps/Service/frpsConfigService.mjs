import Store from 'electron-store';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import UniversalProcessManager from '../../UniversalProcessManager/utils/UniversalProcessManager.mjs';

const storeManager = new Store();
const frpsConfigKey = 'frps_configs';

// 实例化进程管理器
const manager = new UniversalProcessManager();

// 存储配置ID与进程PID的映射
const frpsProcessMap = new Map();

// 存储配置ID与日志的映射
const frpsLogsMap = new Map();

// 监听UniversalProcessManager的事件
manager.on('process-output', (pid, logEntry) => {
  const configId = getConfigIdByPid(pid);
  if (configId) {
    // 存储日志
    let logs = frpsLogsMap.get(configId) || [];
    logs.push(logEntry);
    
    // 限制日志数量
    if (logs.length > 1000) {
      logs = logs.slice(-500);
    }
    
    frpsLogsMap.set(configId, logs);
    // 新增：将日志输出到控制台
    console.log(`FRPS配置 ${configId} ${logEntry.type}: ${logEntry.data}`);
  }
});

/**
 * 根据PID获取配置ID
 * @param {number} pid 进程PID
 * @returns {number|null} 配置ID
 */
function getConfigIdByPid(pid) {
  for (const [configId, processPid] of frpsProcessMap.entries()) {
    if (processPid === pid) {
      return configId;
    }
  }
  return null;
}

/**
 * 获取frps可执行文件的路径
 * @returns {string} frps可执行文件的绝对路径
 */
function getFrpsPath() {
  // 判断是否为开发环境
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // 开发环境下的路径
    return path.join(process.cwd(), 'frps', 'windows', 'frps.exe');
  } else {
    // 打包后的路径
    return path.join(process.resourcesPath, 'frps', 'windows', 'frps.exe');
  }
}

/**
 * 生成frps配置文件内容并保存到文件
 * @param {Object} config 配置对象
 * @param {number} configId 配置ID
 * @returns {string} frps配置文件路径
 */
function generateFrpsConfig(config, configId) {
  // 将配置内容转换为TOML格式
  const configContent = config.tomlContent;
  
  // 获取frps可执行文件路径和目录
  const frpsPath = getFrpsPath();
  const frpsDir = path.dirname(frpsPath);
  
  // 生成配置文件路径
  const configPath = path.join(frpsDir, `frps_${configId}.toml`);
  
  // 如果配置文件已存在，先删除
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
  
  // 将配置写入文件
  fs.writeFileSync(configPath, configContent, 'utf8');
  
  return configPath;
}

/**
 * FRPS服务器配置管理服务
 */
class FrpsConfigService {
  constructor() {
    this.configsKey = frpsConfigKey;
    this.setupProcessEventListeners();
  }

  /**
   * 获取所有FRPS配置
   * @returns {Array} FRPS配置列表
   */
  getAllConfigs() {
    return storeManager.get(this.configsKey, []);
  }

  /**
   * 根据ID获取FRPS配置
   * @param {number} id 配置ID
   * @returns {Object|null} FRPS配置
   */
  getConfigById(id) {
    const configs = this.getAllConfigs();
    return configs.find(config => config.id === id) || null;
  }

  /**
   * 添加新的FRPS配置
   * @param {Object} configData 配置数据
   * @returns {Object} 新创建的配置
   */
  addConfig(configData) {
    const configs = this.getAllConfigs();
    
    // 构建frps.toml配置内容
    const tomlContent = this.buildTomlContent(configData);
    
    const newConfig = {
      id: this.generateNextId(configs),
      name: configData.name,
      bindPort: configData.bindPort,
      authMethod: configData.authMethod,
      authToken: configData.authToken || '',
      tomlContent: tomlContent,
      status: 'stopped',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    configs.push(newConfig);
    storeManager.set(this.configsKey, configs);
    return newConfig;
  }

  /**
   * 更新FRPS配置
   * @param {number} id 配置ID
   * @param {Object} updateData 更新数据
   * @returns {Object|null} 更新后的配置
   */
  updateConfig(id, updateData) {
    const configs = this.getAllConfigs();
    const index = configs.findIndex(config => config.id === id);
    
    if (index === -1) return null;
    
    // 构建新的toml内容
    const tomlContent = this.buildTomlContent({
      ...configs[index],
      ...updateData
    });
    
    configs[index] = {
      ...configs[index],
      ...updateData,
      tomlContent: tomlContent,
      updatedAt: new Date().toISOString()
    };
    
    storeManager.set(this.configsKey, configs);
    return configs[index];
  }

  /**
   * 删除FRPS配置
   * @param {number} id 配置ID
   * @returns {boolean} 是否删除成功
   */
  deleteConfig(id) {
    const configs = this.getAllConfigs();
    const filteredConfigs = configs.filter(config => config.id !== id);
    
    if (filteredConfigs.length === configs.length) return false;
    
    storeManager.set(this.configsKey, filteredConfigs);
    return true;
  }

  /**
   * 获取frps可执行文件的路径
   * @returns {string} frps可执行文件的绝对路径
   */
  getFrpsPath() {
    // 判断是否为开发环境
    const isDev = !app.isPackaged;
    let frpsPath;
    
    if (isDev) {
      // 开发环境下的路径
      frpsPath = path.join(process.cwd(), 'frps', 'windows', 'frps.exe');
    } else {
      // 打包后的路径
      frpsPath = path.join(process.resourcesPath, 'frps', 'windows', 'frps.exe');
    }
    
    return frpsPath;
  }
  
  /**
   * 生成frps配置文件
   * @param {Object} config 配置对象
   * @returns {string} 配置文件路径
   */
  generateFrpsConfig(config) {
    const configContent = config.tomlContent;

      // 获取frpc可执行文件路径和目录
      const frpsPath = getFrpsPath();
      const frpsDir = path.dirname(frpsPath);
      
      // 生成配置文件路径
      const configPath = path.join(frpsDir, `frps_${config.id}.toml`);
    
      // 写入配置内容
      fs.writeFileSync(configPath, configContent, 'utf8');
    
    return configPath;
  }
  
  /**
   * 设置进程事件监听器
   */
  setupProcessEventListeners() {
    // 监听进程错误事件
    manager.on('process-error', (pid, processInfo, error) => {
      const configId = getConfigIdByPid(pid);
      if (configId) {
        console.error(`FRPS配置 ${configId} 错误:`, error);
        this.updateConfigStatusOnError(configId, error.message);
        // 删除临时配置文件
        this.deleteTemporaryConfigFile(configId);
      }
    });
    
    // 监听进程退出事件
    manager.on('process-exited', (pid, processInfo) => {
      const configId = getConfigIdByPid(pid);
      if (configId) {
        console.log(`FRPS配置 ${configId} 进程已退出，退出码:`, processInfo.exitCode);
        // 如果进程意外退出，更新状态
        if (processInfo.status === 'exited' && processInfo.exitCode !== 0) {
          this.updateConfigStatusOnError(configId, `进程意外退出，退出码: ${processInfo.exitCode}`);
        } else if (processInfo.exitCode === 0) {
          // 正常退出，更新状态为stopped
          this.updateConfigStatus(configId, 'stopped');
          // 从映射中移除
          frpsProcessMap.delete(configId);
        }
        // 删除临时配置文件
        this.deleteTemporaryConfigFile(configId);
        
        // 清理日志，避免内存占用
        this.clearConfigLogs(configId);
        console.log(`已清理FRPS配置 ${configId} 的日志数据`);
      }
    });
  }
  
  /**
   * FRPS配置错误时更新状态
   * @param {number} id 配置ID
   * @param {string} errorMessage 错误信息
   */
  updateConfigStatusOnError(id, errorMessage) {
    const config = this.getConfigById(id);
    if (config && config.status === 'running') {
      // 更新配置状态为错误
      const configs = this.getAllConfigs();
      const index = configs.findIndex(c => c.id === id);
      configs[index].status = 'error';
      configs[index].errorMessage = errorMessage;
      configs[index].updatedAt = new Date().toISOString();
      
      storeManager.set(this.configsKey, configs);
      
      // 从映射中移除
      frpsProcessMap.delete(id);
    }
  }
  
  /**
   * 更新FRPS配置状态
   * @param {number} id 配置ID
   * @param {string} status 新状态
   * @returns {Object|null} 更新后的配置
   */
  updateConfigStatus(id, status) {
    const configs = this.getAllConfigs();
    const index = configs.findIndex(config => config.id === id);
    
    if (index === -1) return null;
    
    configs[index].status = status;
    configs[index].updatedAt = new Date().toISOString();
    
    storeManager.set(this.configsKey, configs);
    return configs[index];
  }
  
  /**
   * 启动FRPS服务
   * @param {number} id 配置ID
   * @returns {Promise<Object>} 操作结果
   */
  async startConfig(id) {
    try {
      const config = this.getConfigById(id);
      if (!config) {
        throw new Error(`FRPS配置 ${id} 不存在`);
      }

      if (config.status === 'running') {
        throw new Error(`FRPS配置 ${id} 已在运行中`);
      }

      // 生成配置文件并获取路径
      const configPath = this.generateFrpsConfig(config);
      // 获取frps可执行文件路径
      const frpsPath = this.getFrpsPath();
      
      console.log(`启动FRPS服务 ${id}:`, {
        configPath,
        frpsPath,
        configName: config.name
      });
      
      // 启动frps进程，使用-c参数传入配置文件路径
      const result = await manager.startApplication(frpsPath, ['-c', configPath], {
        windowsHide: true
      });

      if (!result.success) {
        throw new Error(`启动frps失败: ${result.error}`);
      }
      
      console.log(`FRPS服务 ${id} 启动成功，PID: ${result.pid}`);
      
      // 存储配置ID与进程PID的映射
      frpsProcessMap.set(id, result.pid);
      
      // 初始化日志数组
      if (!frpsLogsMap.has(id)) {
        frpsLogsMap.set(id, []);
      }
      
      // 添加启动日志
      const logs = frpsLogsMap.get(id);
      logs.push({
        timestamp: new Date(),
        type: 'stdout',
        data: `FRPS服务 "${config.name}" 启动成功，PID: ${result.pid}`
      });
      
      // 更新配置状态
      const configs = this.getAllConfigs();
      const index = configs.findIndex(c => c.id === id);
      configs[index].status = 'running';
      configs[index].pid = result.pid;
      configs[index].lastStartedAt = new Date().toISOString();
      configs[index].updatedAt = new Date().toISOString();
      configs[index].configPath = configPath; // 保存配置文件路径
      
      storeManager.set(this.configsKey, configs);
      
      return { 
        success: true, 
        config: configs[index],
        pid: result.pid,
        configPath: configPath 
      };
    } catch (error) {
      console.error(`启动FRPS配置 ${id} 失败:`, error);
      
      // 添加错误日志
      const logs = frpsLogsMap.get(id) || [];
      logs.push({
        timestamp: new Date(),
        type: 'stderr',
        data: `启动失败: ${error.message}`
      });
      frpsLogsMap.set(id, logs);
      
      throw error;
    }
  }

  /**
   * 删除临时生成的frps配置文件
   * @param {number} id 配置ID
   */
  deleteTemporaryConfigFile(id) {
    try {
      const config = this.getConfigById(id);
      if (config && config.configPath) {
        // 检查配置文件是否存在
        if (fs.existsSync(config.configPath)) {
          fs.unlinkSync(config.configPath);
        }
        
        // 更新配置对象，移除configPath
        const configs = this.getAllConfigs();
        const index = configs.findIndex(c => c.id === id);
        if (index !== -1) {
          delete configs[index].configPath;
          storeManager.set(this.configsKey, configs);
        }
      }
    } catch (error) {
      console.error(`删除FRPS配置 ${id} 的临时配置文件失败:`, error);
    }
  }
  
  /**
   * 停止FRPS服务
   * @param {number} id 配置ID
   * @returns {Promise<Object>} 操作结果
   */
  async stopConfig(id) {
    try {
      const config = this.getConfigById(id);
      if (!config) {
        throw new Error(`FRPS配置 ${id} 不存在`);
      }

      if (config.status === 'stopped') {
        throw new Error(`FRPS配置 ${id} 已停止`);
      }

      // 获取进程PID
      const pid = frpsProcessMap.get(id) || config.pid;
      
      if (pid) {
        // 使用UniversalProcessManager停止进程
        const stopResult = await manager.stopApplication(pid);
        
        if (!stopResult.success) {
          console.warn(`停止frps进程失败 (PID: ${pid}):`, stopResult.error);
          // 尝试强制停止
          await manager.forceKillProcess(pid);
        }
        
        // 从映射中移除
        frpsProcessMap.delete(id);
      }

      // 更新配置状态
      const configs = this.getAllConfigs();
      const index = configs.findIndex(c => c.id === id);
      configs[index].status = 'stopped';
      delete configs[index].pid;
      configs[index].lastStoppedAt = new Date().toISOString();
      configs[index].updatedAt = new Date().toISOString();
      
      storeManager.set(this.configsKey, configs);
      
      // 删除临时配置文件
      this.deleteTemporaryConfigFile(id);
      
      // 清理日志，避免内存占用
      this.clearConfigLogs(id);
      console.log(`已清理FRPS配置 ${id} 的日志数据`);
      
      return { success: true, config: configs[index] };
    } catch (error) {
      console.error(`停止FRPS配置 ${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 构建frps.toml配置内容
   * @param {Object} configData 配置数据
   * @returns {string} TOML格式的配置内容
   */
  buildTomlContent(configData) {
    let toml = '# frps.toml\n';
    toml += `bindPort = ${configData.bindPort}\n`;
    
    if (configData.authMethod === 'token' && configData.authToken) {
      toml += `auth.token = "${configData.authToken}"\n`;
    }
    
    return toml;
  }

  /**
   * 生成下一个ID
   * @param {Array} configs 配置列表
   * @returns {number} 新ID
   */
  generateNextId(configs) {
    if (configs.length === 0) return 1;
    return Math.max(...configs.map(c => c.id)) + 1;
  }

  /**
   * 获取配置的TOML内容
   * @param {number} id 配置ID
   * @returns {string|null} TOML内容
   */
  getTomlContent(id) {
    const config = this.getConfigById(id);
    return config ? config.tomlContent : null;
  }

  /**
   * 获取FRPS配置日志
   * @param {number} id 配置ID
   * @returns {Array} 日志数组
   */
  getConfigLogs(id) {
    const logs = frpsLogsMap.get(id) || [];
    console.log(`获取FRPS配置 ${id} 日志，共 ${logs.length} 条:`, logs);
    return logs;
  }
  
  /**
   * 清除FRPS配置日志
   * @param {number} id 配置ID
   */
  clearConfigLogs(id) {
    frpsLogsMap.delete(id);
  }
  
  /**
   * 停止所有运行中的FRPS配置
   * @returns {Promise<Array>} 所有配置的停止结果
   */
  async stopAllConfigs() {
    const configs = this.getAllConfigs();
    const runningConfigs = configs.filter(config => config.status === 'running');
    
    const stopPromises = runningConfigs.map(config => {
      return this.stopConfig(config.id)
        .catch(error => {
          console.error(`停止FRPS配置 ${config.id} 失败:`, error);
          return { success: false, configId: config.id, error: error.message };
        });
    });
    
    return Promise.all(stopPromises);
  }
  
  /**
   * 检查FRPS配置是否正在运行
   * @param {number} id 配置ID
   * @returns {boolean} 是否正在运行
   */
  isConfigRunning(id) {
    const config = this.getConfigById(id);
    if (!config || config.status !== 'running') {
      return false;
    }
    
    const pid = frpsProcessMap.get(id) || config.pid;
    if (!pid) {
      return false;
    }
    
    // 检查进程是否仍在运行
    return manager.checkProcessExists(pid).catch(() => false);
  }
  
  /**
   * 重启FRPS服务
   * @param {number} id 配置ID
   * @returns {Promise<Object>} 操作结果
   */
  async restartConfig(id) {
    try {
      const config = this.getConfigById(id);
      if (!config) {
        throw new Error(`FRPS配置 ${id} 不存在`);
      }

      if (config.status === 'running') {
        // 如果正在运行，先停止
        await this.stopConfig(id);
      }

      // 再启动
      return this.startConfig(id);
    } catch (error) {
      console.error(`重启FRPS配置 ${id} 失败:`, error);
      throw error;
    }
  }
  
  /**
   * 获取FRPS配置状态
   * @param {number} id 配置ID
   * @returns {Object|null} 配置状态
   */
  getConfigStatus(id) {
    const config = this.getConfigById(id);
    if (!config) {
      return null;
    }
    
    return {
      id: config.id,
      status: config.status,
      pid: config.pid || frpsProcessMap.get(id) || null,
      lastStartedAt: config.lastStartedAt || null,
      lastStoppedAt: config.lastStoppedAt || null,
      errorMessage: config.errorMessage || null
    };
  }
  
  /**
   * 验证配置数据
   * @param {Object} configData 配置数据
   * @returns {Object} 验证结果
   */
  validateConfig(configData) {
    const errors = [];
    
    if (!configData.name || configData.name.trim() === '') {
      errors.push('配置名称不能为空');
    }
    
    if (!configData.bindPort || isNaN(configData.bindPort) || configData.bindPort < 1 || configData.bindPort > 65535) {
      errors.push('监听端口必须是1-65535之间的有效数字');
    }
    
    if (!configData.authMethod || !['none', 'token'].includes(configData.authMethod)) {
      errors.push('认证方式必须是none或token');
    }
    
    if (configData.authMethod === 'token' && (!configData.authToken || configData.authToken.trim() === '')) {
      errors.push('使用token认证时，认证令牌不能为空');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

export default new FrpsConfigService();