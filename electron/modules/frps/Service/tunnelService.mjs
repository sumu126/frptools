import { storeManager } from '../../store/storeManager/storeManager.mjs';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

import UniversalProcessManager from '../../UniversalProcessManager/utils/UniversalProcessManager.mjs';
// 实例化进程管理器
const manager = new UniversalProcessManager();

// 存储隧道ID与进程PID的映射
const tunnelProcessMap = new Map();

// 存储隧道ID与日志的映射
const tunnelLogsMap = new Map();

/**
 * 根据PID获取隧道ID
 * @param {number} pid 进程PID
 * @returns {number|null} 隧道ID
 */
function getTunnelIdByPid(pid) {
  for (const [tunnelId, processPid] of tunnelProcessMap.entries()) {
    if (processPid === pid) {
      return tunnelId;
    }
  }
  return null;
}



/**
 * 获取frpc可执行文件的路径
 * @returns {string} frpc可执行文件的绝对路径
 */
function getFrpcPath() {
  // 判断是否为开发环境
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // 开发环境下的路径
    return path.join(process.cwd(), 'frps', 'windows', 'frpc.exe');
  } else {
    // 打包后的路径
    return path.join(process.resourcesPath, 'frps', 'windows', 'frpc.exe');
  }
}

/**
 * 生成frpc配置文件内容并保存到文件
 * @param {Object} tunnel 隧道对象
 * @param {number} tunnelId 隧道ID
 * @returns {string} frpc配置文件路径
 */
function generateFrpcConfig(tunnel, tunnelId) {
  const config = tunnel.tunnelJson;
  const configContent = `
serverAddr = "${config.yclocation}"
serverPort = ${config.ycprot}
${config.token ? `auth.token = "${config.token}"` : ''}

[[proxies]]
name = "${config.frp}"
type = "${config.frptype}"
localIP = "${config.location}"
localPort = ${config.prot}
remotePort = ${config.yckfprot}
`;
  
  // 获取frpc可执行文件路径和目录
  const frpcPath = getFrpcPath();
  const frpcDir = path.dirname(frpcPath);
  
  // 生成配置文件路径
  const configPath = path.join(frpcDir, `tunnel_${tunnelId}.toml`);
  
  // 如果配置文件已存在，先删除
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
  
  // 将配置写入文件
  fs.writeFileSync(configPath, configContent, 'utf8');
  
  return configPath;
}

class TunnelService {
  constructor() {
    this.tunnelsKey = 'tunnels';
    this.initializeDefaultTunnels();
    
    // 设置进程事件监听器
    this.setupProcessEventListeners();
  }
  
  /**
   * 设置进程事件监听器
   */
  setupProcessEventListeners() {
    // 监听进程输出事件
    manager.on('process-output', (pid, logEntry) => {
      console.log(`收到进程输出事件 - PID: ${pid}, 数据:`, logEntry.data);
      
      // 查找对应的隧道ID
      const tunnelId = getTunnelIdByPid(pid);
      console.log(`PID ${pid} 对应的隧道ID:`, tunnelId);
      
      if (tunnelId) {
        // 存储日志
        let logs = tunnelLogsMap.get(tunnelId) || [];
        logs.push(logEntry);
        
        // 限制日志数量
        if (logs.length > 1000) {
          logs = logs.slice(-500);
        }
        
        tunnelLogsMap.set(tunnelId, logs);
        
        console.log(`隧道 ${tunnelId} 输出已存储，当前日志数量:`, logs.length);
      } else {
        console.log(`PID ${pid} 未找到对应的隧道ID，当前运行的隧道映射:`, Array.from(tunnelProcessMap.entries()));
      }
    });

    // 监听进程错误事件
    manager.on('process-error', (pid, processInfo, error) => {
      const tunnelId = getTunnelIdByPid(pid);
      if (tunnelId) {
        console.error(`隧道 ${tunnelId} 错误:`, error);
        this.updateTunnelStatusOnError(tunnelId, error.message);
      }
    });
    
    // 监听进程退出事件
    manager.on('process-exited', (pid, processInfo) => {
      const tunnelId = getTunnelIdByPid(pid);
      if (tunnelId) {
        console.log(`隧道 ${tunnelId} 进程已退出，退出码:`, processInfo.exitCode);
        // 如果进程意外退出，更新状态
        if (processInfo.status === 'exited' && processInfo.exitCode !== 0) {
          this.updateTunnelStatusOnError(tunnelId, `进程意外退出，退出码: ${processInfo.exitCode}`);
          // 清理隧道日志
          this.clearTunnelLogs(tunnelId);
          console.log(`隧道 ${tunnelId} 的日志已清理（异常退出）`);
        } else if (processInfo.exitCode === 0) {
          // 正常退出，更新状态为stopped
          this.updateTunnelStatus(tunnelId, 'stopped');
          // 从映射中移除
          tunnelProcessMap.delete(tunnelId);
          // 清理隧道日志
          this.clearTunnelLogs(tunnelId);
          console.log(`隧道 ${tunnelId} 的日志已清理（正常退出）`);
        }
      }
    });
  }
  
  /**
   * 隧道错误时更新状态
   * @param {number} tunnelId 隧道ID
   * @param {string} errorMessage 错误信息
   */
  updateTunnelStatusOnError(tunnelId, errorMessage) {
    const tunnel = this.getTunnelById(tunnelId);
    if (tunnel && tunnel.status === 'running') {
      // 更新隧道状态为错误
      const tunnels = this.getAllTunnels();
      const index = tunnels.findIndex(t => t.id === tunnelId);
      tunnels[index].status = 'error';
      tunnels[index].errorMessage = errorMessage;
      tunnels[index].updatedAt = new Date().toISOString();
      
      storeManager.set(this.tunnelsKey, tunnels);
      
      // 从映射中移除
      tunnelProcessMap.delete(tunnelId);
      
      // 清理隧道日志
      this.clearTunnelLogs(tunnelId);
      console.log(`隧道 ${tunnelId} 状态更新为错误:`, errorMessage);
      console.log(`隧道 ${tunnelId} 的日志已清理（错误状态）`);
    }
  }

  /**
   * 初始化默认隧道数据
   */
  initializeDefaultTunnels() {
    if (!storeManager.has(this.tunnelsKey)) {
      storeManager.set(this.tunnelsKey, []);
    }
  }

  /**
   * 获取所有隧道
   * @returns {Array} 隧道列表
   */
  getAllTunnels() {
    return storeManager.get(this.tunnelsKey) || [];
  }

  /**
   * 根据ID获取隧道
   * @param {number} id 隧道ID
   * @returns {Object|null} 隧道对象
   */
  getTunnelById(id) {
    const tunnels = this.getAllTunnels();
    return tunnels.find(tunnel => tunnel.id === id) || null;
  }

  /**
   * 解析本地地址，提取纯IP和端口
   * @param {string} localAddress 本地地址，格式如 "tcp://127.0.0.1:8080" 或 "127.0.0.1:8080"
   * @returns {Object} 包含纯IP地址和端口号的对象
   */
  parseLocalAddress(localAddress) {
    // 移除协议前缀（如果有）
    let addressWithoutProtocol = localAddress;
    if (localAddress.includes('://')) {
      const parts = localAddress.split('://');
      addressWithoutProtocol = parts[1] || '';
    }
    
    // 分割IP和端口
    const addressParts = addressWithoutProtocol.split(':');
    const location = addressParts[0]; // 纯IP地址，不包含端口
    const prot = addressParts[1] || ''; // 纯端口号
    
    return {
      location: location,  // 纯IP地址，如 "127.0.0.1"
      prot: prot          // 纯端口号，如 "8080"
    };
  }

  /**
   * 构建本地地址字符串
   * @param {string} location 位置
   * @param {string} prot 端口
   * @param {string} protocol 协议
   * @returns {string} 完整的本地地址
   */
  buildLocalAddress(location, prot, protocol = 'tcp') {
    return `${protocol}://${location}`;
  }

  /**
   * 添加新隧道
   * @param {Object} tunnelData 隧道数据
   * @returns {Object} 新创建的隧道
   */
  addTunnel(tunnelData) {
    const tunnels = this.getAllTunnels();
    
    // 解析本地地址
    const localAddressParsed = this.parseLocalAddress(tunnelData.localAddress);
    // 解析远程地址
    const remoteAddressParsed = this.parseRemoteAddress(tunnelData.remoteAddress);
    
    // 构建符合要求的JSON数据结构
    const tunnelJson = {
      frp: tunnelData.name,
      location: localAddressParsed.location,  // 纯IP地址
      prot: localAddressParsed.prot,           // 纯端口号
      yclocation: remoteAddressParsed.yclocation,  // 纯IP地址
      ycprot: remoteAddressParsed.ycprot,          // 纯端口号
      yckfprot: tunnelData.remotePort,
      frptype: tunnelData.protocol,
      token: tunnelData.authType !== 'none' ? (tunnelData.authKey || '') : ''
    };
    
    const newTunnel = {
      id: this.generateNextId(tunnels),
      ...tunnelData,
      tunnelJson: tunnelJson, // 存储JSON格式的数据
      status: 'stopped',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    tunnels.push(newTunnel);
    storeManager.set(this.tunnelsKey, tunnels);
    return newTunnel;
  }

  /**
   * 解析远程地址，提取纯IP和端口
   * @param {string} remoteAddress 远程地址
   * @returns {Object} 包含纯IP地址和端口号的对象
   */
  parseRemoteAddress(remoteAddress) {
    // 移除协议前缀（如果有）
    let addressWithoutProtocol = remoteAddress;
    if (remoteAddress.includes('://')) {
      const parts = remoteAddress.split('://');
      addressWithoutProtocol = parts[1] || '';
    }
    
    // 分割IP和端口
    const addressParts = addressWithoutProtocol.split(':');
    const yclocation = addressParts[0]; // 纯IP地址
    const ycprot = addressParts[1] || ''; // 纯端口号
    
    return {
      yclocation: yclocation,  // 纯IP地址
      ycprot: ycprot          // 纯端口号
    };
  }

  /**
   * 更新隧道
   * @param {number} id 隧道ID
   * @param {Object} updateData 更新数据
   * @returns {Object|null} 更新后的隧道
   */
  updateTunnel(id, updateData) {
    const tunnels = this.getAllTunnels();
    const index = tunnels.findIndex(tunnel => tunnel.id === id);
    
    if (index === -1) return null;
    
    // 解析本地地址
    const localAddressParsed = this.parseLocalAddress(updateData.localAddress || tunnels[index].localAddress);
    // 解析远程地址
    const remoteAddressParsed = this.parseRemoteAddress(updateData.remoteAddress || tunnels[index].remoteAddress);
    
    // 构建JSON数据结构
    const tunnelJson = {
      frp: updateData.name || tunnels[index].name,
      location: localAddressParsed.location,      // 纯IP地址
      prot: localAddressParsed.prot,               // 纯端口号
      yclocation: remoteAddressParsed.yclocation,  // 纯IP地址
      ycprot: remoteAddressParsed.ycprot,          // 纯端口号
      yckfprot: updateData.remotePort || tunnels[index].remotePort,
      frptype: updateData.protocol || tunnels[index].protocol,
      token: (updateData.authType || tunnels[index].authType) !== 'none' ? (updateData.authKey || tunnels[index].authKey || '') : ''
    };
    
    tunnels[index] = {
      ...tunnels[index],
      ...updateData,
      tunnelJson: tunnelJson,
      updatedAt: new Date().toISOString()
    };
    
    storeManager.set(this.tunnelsKey, tunnels);
    return tunnels[index];
  }

  /**
   * 删除隧道
   * @param {number} id 隧道ID
   * @returns {boolean} 是否删除成功
   */
  deleteTunnel(id) {
    const tunnels = this.getAllTunnels();
    const filteredTunnels = tunnels.filter(tunnel => tunnel.id !== id);
    
    if (filteredTunnels.length === tunnels.length) return false;
    
    storeManager.set(this.tunnelsKey, filteredTunnels);
    return true;
  }

  /**
   * 启动隧道
   * @param {number} id 隧道ID
   * @returns {Promise<Object>} 操作结果
   */
  async startTunnel(id) {
    try {
      const tunnel = this.getTunnelById(id);
      if (!tunnel) {
        throw new Error(`隧道 ${id} 不存在`);
      }

      if (tunnel.status === 'running') {
        throw new Error(`隧道 ${id} 已在运行中`);
      }

      // 生成配置文件并获取路径
      const configPath = generateFrpcConfig(tunnel, id);
      
      // 获取frpc可执行文件路径
      const frpcPath = getFrpcPath();
      
      console.log(`启动隧道 ${id}，配置文件: ${configPath}，frpc路径: ${frpcPath}`);
      
      // 启动frpc进程，使用-c参数传入配置文件路径
      const result = await manager.startApplication(frpcPath, ['-c', configPath], {
        windowsHide: true
      });

      // 在这里删除掉临时的frp启动配置文件会有问题，
      // 因为frpc进程可能还在使用这个配置文件
      // fs.unlinkSync(configPath);
      
      if (!result.success) {
        throw new Error(`启动frpc失败: ${result.error}`);
      }
      
      console.log(`隧道 ${id} 启动成功，PID: ${result.pid}`);
      
      // 存储隧道ID与进程PID的映射
      tunnelProcessMap.set(id, result.pid);
      console.log(`隧道ID ${id} 与 PID ${result.pid} 的映射已建立`);
      
      // 更新隧道状态
      const tunnels = this.getAllTunnels();
      const index = tunnels.findIndex(t => t.id === id);
      tunnels[index].status = 'running';
      tunnels[index].pid = result.pid;
      tunnels[index].lastStartedAt = new Date().toISOString();
      tunnels[index].updatedAt = new Date().toISOString();
      tunnels[index].configPath = configPath; // 保存配置文件路径
      
      storeManager.set(this.tunnelsKey, tunnels);
      
      return { 
        success: true, 
        tunnel: tunnels[index],
        pid: result.pid,
        configPath: configPath // 返回配置文件路径
      };
    } catch (error) {
      console.error(`启动隧道 ${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 停止隧道
   * @param {number} id 隧道ID
   * @returns {Promise<Object>} 操作结果
   */
  async stopTunnel(id) {
    try {
      const tunnel = this.getTunnelById(id);
      if (!tunnel) {
        throw new Error(`隧道 ${id} 不存在`);
      }

      if (tunnel.status === 'stopped') {
        throw new Error(`隧道 ${id} 已停止`);
      }

      // 获取进程PID
      const pid = tunnelProcessMap.get(id) || tunnel.pid;
      
      if (pid) {
        // 使用UniversalProcessManager停止进程
        const stopResult = await manager.stopApplication(pid);
        
        if (!stopResult.success) {
          console.warn(`停止frpc进程失败 (PID: ${pid}):`, stopResult.error);
          // 尝试强制停止
          await manager.forceKillProcess(pid);
        }
        
        // 从映射中移除
        tunnelProcessMap.delete(id);
      }

      // 清理隧道日志
      this.clearTunnelLogs(id);
      console.log(`隧道 ${id} 的日志已清理`);

      // 更新隧道状态
      const tunnels = this.getAllTunnels();
      const index = tunnels.findIndex(t => t.id === id);
      tunnels[index].status = 'stopped';
      delete tunnels[index].pid;
      tunnels[index].lastStoppedAt = new Date().toISOString();
      tunnels[index].updatedAt = new Date().toISOString();
      
      storeManager.set(this.tunnelsKey, tunnels);
      
      return { success: true, tunnel: tunnels[index] };
    } catch (error) {
      console.error(`停止隧道 ${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 更新隧道状态
   * @param {number} id 隧道ID
   * @param {string} status 新状态
   * @returns {Object|null} 更新后的隧道
   */
  updateTunnelStatus(id, status) {
    const tunnels = this.getAllTunnels();
    const index = tunnels.findIndex(tunnel => tunnel.id === id);
    
    if (index === -1) return null;
    
    tunnels[index].status = status;
    tunnels[index].updatedAt = new Date().toISOString();
    
    storeManager.set(this.tunnelsKey, tunnels);
    return tunnels[index];
  }

  /**
   * 生成下一个ID
   * @param {Array} tunnels 隧道列表
   * @returns {number} 新ID
   */
  generateNextId(tunnels) {
    if (tunnels.length === 0) return 1;
    return Math.max(...tunnels.map(t => t.id)) + 1;
  }

  /**
   * 清空所有隧道
   */
  clearAllTunnels() {
    storeManager.set(this.tunnelsKey, []);
  }

  /**
   * 导出隧道配置为JSON格式
   * @returns {string} JSON格式的隧道配置
   */
  exportTunnels() {
    const tunnels = this.getAllTunnels();
    const jsonConfigs = tunnels.map(tunnel => tunnel.tunnelJson);
    return JSON.stringify(jsonConfigs, null, 2);
  }

  /**
   * 导入隧道配置
   * @param {Array} tunnelConfigs 隧道配置数组
   * @returns {boolean} 是否导入成功
   */
  importTunnels(tunnelConfigs) {
    try {
      if (!Array.isArray(tunnelConfigs)) throw new Error('Invalid format');
      
      const newTunnels = tunnelConfigs.map((config, index) => {
        // 从JSON配置反向构建隧道数据
        const tunnelData = {
          name: config.frp,
          localAddress: config.location,
          remoteAddress: config.yclocation,
          remotePort: config.yckfprot,
          protocol: config.frptype,
          authType: config.token ? 'token' : 'none',
          authKey: config.token || ''
        };
        
        return {
          id: this.generateNextId(this.getAllTunnels()) + index,
          ...tunnelData,
          tunnelJson: config,
          status: 'stopped',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });
      
      const existingTunnels = this.getAllTunnels();
      storeManager.set(this.tunnelsKey, [...existingTunnels, ...newTunnels]);
      return true;
    } catch (error) {
      console.error('导入隧道配置失败:', error);
      return false;
    }
  }

  /**
   * 获取隧道的JSON配置
   * @param {number} id 隧道ID
   * @returns {Object|null} JSON配置对象
   */
  getTunnelJsonConfig(id) {
    const tunnel = this.getTunnelById(id);
    return tunnel ? tunnel.tunnelJson : null;
  }
  
  /**
   * 获取隧道日志
   * @param {number} id 隧道ID
   * @returns {Array} 日志数组
   */
  getTunnelLogs(id) {
    const logs = tunnelLogsMap.get(id) || [];
    console.log(`获取隧道 ${id} 的日志，数量: ${logs.length}`);
    console.log(`当前所有隧道日志映射:`, Array.from(tunnelLogsMap.entries()));
    return logs;
  }
  
  /**
   * 清除隧道日志
   * @param {number} id 隧道ID
   */
  clearTunnelLogs(id) {
    tunnelLogsMap.delete(id);
  }
  
  /**
   * 停止所有运行中的隧道
   * @returns {Promise<Array>} 所有隧道的停止结果
   */
  async stopAllTunnels() {
    const tunnels = this.getAllTunnels();
    const runningTunnels = tunnels.filter(tunnel => tunnel.status === 'running');
    
    const stopPromises = runningTunnels.map(tunnel => {
      return this.stopTunnel(tunnel.id)
        .catch(error => {
          console.error(`停止隧道 ${tunnel.id} 失败:`, error);
          return { success: false, tunnelId: tunnel.id, error: error.message };
        });
    });
    
    return Promise.all(stopPromises);
  }
  
  /**
   * 检查隧道是否正在运行
   * @param {number} id 隧道ID
   * @returns {boolean} 是否正在运行
   */
  isTunnelRunning(id) {
    const tunnel = this.getTunnelById(id);
    if (!tunnel || tunnel.status !== 'running') {
      return false;
    }
    
    const pid = tunnelProcessMap.get(id) || tunnel.pid;
    if (!pid) {
      return false;
    }
    
    // 检查进程是否仍在运行
    return manager.checkProcessExists(pid).catch(() => false);
  }
}

// 单例模式
const tunnelService = new TunnelService();
export { tunnelService };