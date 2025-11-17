import Store from 'electron-store';

// 定义默认设置
const defaultSettings = {
  onceNotification: false, // 只显示一次的通知是否已显示
};

// 初始化 store 实例
const store = new Store({ defaults: defaultSettings });

const storeManager = {
  /**
   * 获取某个设置项的值
   * @param {string} key - 设置项的键
   * @param {*} defaultValue - 默认值（可选）
   * @returns {*} - 返回对应的值
   */
  get(key, defaultValue = undefined) {
    return store.get(key, defaultValue);
  },

  /**
   * 设置某个设置项的值
   * @param {string} key - 设置项的键
   * @param {*} value - 要设置的值
   */
  set(key, value) {
    store.set(key, value);
  },

  /**
   * 删除某个设置项
   * @param {string} key - 设置项的键
   */
  delete(key) {
    store.delete(key);
  },

  /**
   * 重置某个设置项到默认值
   * @param {string} key - 设置项的键
   */
  reset(key) {
    if (defaultSettings.hasOwnProperty(key)) {
      store.set(key, defaultSettings[key]);
    } else {
      console.warn(`Key "${key}" 不在默认设置中，无法重置。`);
    }
  },

  /**
   * 重置所有设置项到默认值
   */
  resetAll() {
    store.clear();
    store.set(defaultSettings);
  },

  /**
   * 检查某个设置项是否存在
   * @param {string} key - 设置项的键
   * @returns {boolean} - 是否存在
   */
  has(key) {
    return store.has(key);
  },

  /**
   * 获取所有设置项
   * @returns {object} - 返回所有设置项的对象
   */
  getAll() {
    return store.store;
  },
};

export {
  storeManager
};