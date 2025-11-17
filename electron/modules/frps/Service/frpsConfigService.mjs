import Store from 'electron-store';

const storeManager = new Store();
const frpsConfigKey = 'frps_configs';

/**
 * FRPS服务器配置管理服务
 */
class FrpsConfigService {
  constructor() {
    this.configsKey = frpsConfigKey;
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
   * 启动FRPS服务
   * @param {number} id 配置ID
   * @returns {Object} 操作结果
   */
  startConfig(id) {
    const config = this.getConfigById(id);
    if (!config) {
      throw new Error(`FRPS配置 ${id} 不存在`);
    }

    if (config.status === 'running') {
      throw new Error(`FRPS配置 ${id} 已在运行中`);
    }

    const configs = this.getAllConfigs();
    const index = configs.findIndex(c => c.id === id);
    configs[index].status = 'running';
    configs[index].lastStartedAt = new Date().toISOString();
    configs[index].updatedAt = new Date().toISOString();
    
    storeManager.set(this.configsKey, configs);
    return { success: true, config: configs[index] };
  }

  /**
   * 停止FRPS服务
   * @param {number} id 配置ID
   * @returns {Object} 操作结果
   */
  stopConfig(id) {
    const config = this.getConfigById(id);
    if (!config) {
      throw new Error(`FRPS配置 ${id} 不存在`);
    }

    if (config.status === 'stopped') {
      throw new Error(`FRPS配置 ${id} 已停止`);
    }

    const configs = this.getAllConfigs();
    const index = configs.findIndex(c => c.id === id);
    configs[index].status = 'stopped';
    configs[index].lastStoppedAt = new Date().toISOString();
    configs[index].updatedAt = new Date().toISOString();
    
    storeManager.set(this.configsKey, configs);
    return { success: true, config: configs[index] };
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