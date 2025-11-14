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
  getAppName: () => ipcRenderer.invoke('get-app-name')  // 获取应用名称
})
