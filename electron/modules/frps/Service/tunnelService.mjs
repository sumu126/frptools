import { storeManager } from '../../store/storeManager/storeManager.mjs';

class TunnelService {
  constructor() {
    this.tunnelsKey = 'tunnels';
    this.initializeDefaultTunnels();
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
   * @returns {Object} 操作结果
   */
  startTunnel(id) {
    const tunnel = this.getTunnelById(id);
    if (!tunnel) {
      throw new Error(`隧道 ${id} 不存在`);
    }

    if (tunnel.status === 'running') {
      throw new Error(`隧道 ${id} 已在运行中`);
    }

    const tunnels = this.getAllTunnels();
    const index = tunnels.findIndex(t => t.id === id);
    tunnels[index].status = 'running';
    tunnels[index].lastStartedAt = new Date().toISOString();
    tunnels[index].updatedAt = new Date().toISOString();
    
    storeManager.set(this.tunnelsKey, tunnels);
    return { success: true, tunnel: tunnels[index] };
  }

  /**
   * 停止隧道
   * @param {number} id 隧道ID
   * @returns {Object} 操作结果
   */
  stopTunnel(id) {
    const tunnel = this.getTunnelById(id);
    if (!tunnel) {
      throw new Error(`隧道 ${id} 不存在`);
    }

    if (tunnel.status === 'stopped') {
      throw new Error(`隧道 ${id} 已停止`);
    }

    const tunnels = this.getAllTunnels();
    const index = tunnels.findIndex(t => t.id === id);
    tunnels[index].status = 'stopped';
    tunnels[index].lastStoppedAt = new Date().toISOString();
    tunnels[index].updatedAt = new Date().toISOString();
    
    storeManager.set(this.tunnelsKey, tunnels);
    return { success: true, tunnel: tunnels[index] };
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
}

// 单例模式
const tunnelService = new TunnelService();
export { tunnelService };