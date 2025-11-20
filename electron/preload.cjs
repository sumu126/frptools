// preload.js
const { contextBridge, ipcRenderer } = require('electron')


// 🔒 安全地暴露有限的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  quitApp: () => ipcRenderer.send('app-quit'),  // 向主进程发送退出请求
  winMinimize: () => ipcRenderer.send('window-minimize'),
  winMaximize: () => ipcRenderer.send('window-maximize'),
  winClose: () => ipcRenderer.send('window-close'),
  showMessageBox: (win, type, buttons, defaultId, cancelId, title, message) => 
    ipcRenderer.send('showMessageBox', win, type, buttons, defaultId, cancelId, title, message),
  getAppName: () => ipcRenderer.invoke('get-app-name'),  // 获取应用名称
  // 通用配置管理
  config: {
    get: (key) => ipcRenderer.invoke('config:get', key),
    set: (key, value) => ipcRenderer.invoke('config:set', key, value),
    getAll: () => ipcRenderer.invoke('config:getAll'),
    reset: () => ipcRenderer.invoke('config:reset')
  },
  // 隧道管理
    tunnel: {
      getAll: () => ipcRenderer.invoke('tunnel:getAll'),
      getById: (id) => ipcRenderer.invoke('tunnel:getById', id),
      add: (tunnelData) => ipcRenderer.invoke('tunnel:add', tunnelData),
      update: (id, updateData) => ipcRenderer.invoke('tunnel:update', id, updateData),
      delete: (id) => ipcRenderer.invoke('tunnel:delete', id),
      start: (id) => ipcRenderer.invoke('tunnel:start', id),
      stop: (id) => ipcRenderer.invoke('tunnel:stop', id),
      updateStatus: (id, status) => ipcRenderer.invoke('tunnel:updateStatus', id, status),
      clearAll: () => ipcRenderer.invoke('tunnel:clearAll'),
      export: () => ipcRenderer.invoke('tunnel:export'),
      import: (tunnelConfigs) => ipcRenderer.invoke('tunnel:import', tunnelConfigs),
      getJsonConfig: (id) => ipcRenderer.invoke('tunnel:getJsonConfig', id),
      getLogs: (id) => ipcRenderer.invoke('tunnel:getLogs', id),
      clearLogs: (id) => ipcRenderer.invoke('tunnel:clearLogs', id)
    },
  // FRPS配置管理
  frpsConfig: {
    getAll: () => ipcRenderer.invoke('frpsConfig:getAll'),
    getById: (id) => ipcRenderer.invoke('frpsConfig:getById', id),
    add: (configData) => ipcRenderer.invoke('frpsConfig:add', configData),
    update: (id, updateData) => ipcRenderer.invoke('frpsConfig:update', id, updateData),
    delete: (id) => ipcRenderer.invoke('frpsConfig:delete', id),
    validate: (configData) => ipcRenderer.invoke('frpsConfig:validate', configData),
    getTomlContent: (id) => ipcRenderer.invoke('frpsConfig:getTomlContent', id),
    start: (id) => ipcRenderer.invoke('frpsConfig:start', id),
    stop: (id) => ipcRenderer.invoke('frpsConfig:stop', id),
    restart: (id) => ipcRenderer.invoke('frpsConfig:restart', id),
    getStatus: (id) => ipcRenderer.invoke('frpsConfig:getStatus', id),
    getLogs: (id) => ipcRenderer.invoke('frpsConfig:getLogs', id),
    clearLogs: (id) => ipcRenderer.invoke('frpsConfig:clearLogs', id)
  },
  // 壁纸管理
  setWallpaper: (wallpaperData) => ipcRenderer.invoke('set-wallpaper', wallpaperData),
  getWallpaper: () => ipcRenderer.invoke('get-wallpaper'),
  clearWallpaper: () => ipcRenderer.invoke('clear-wallpaper'),
  selectWallpaperFile: () => ipcRenderer.invoke('select-wallpaper-file'),
  selectImageFile: () => ipcRenderer.invoke('select-image-file'),
  selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
  // 窗口透明度
  setWindowOpacity: (opacity) => ipcRenderer.invoke('set-window-opacity', opacity),
  getWindowOpacity: () => ipcRenderer.invoke('get-window-opacity')
})
