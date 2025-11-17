const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

class WallpaperManager {
  constructor() {
    this.wallpaperSettings = {
      type: 'none', // 'none', 'static', 'dynamic'
      path: '',
      opacity: 1.0,
      enabled: false
    };
    this.wallpaperWindow = null;
    this.settingsPath = path.join(app.getPath('userData'), 'wallpaper-settings.json');
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf8');
      this.wallpaperSettings = { ...this.wallpaperSettings, ...JSON.parse(data) };
    } catch (error) {
      console.log('使用默认壁纸设置');
    }
  }

  async saveSettings() {
    try {
      await fs.writeFile(this.settingsPath, JSON.stringify(this.wallpaperSettings, null, 2));
    } catch (error) {
      console.error('保存壁纸设置失败:', error);
    }
  }

  async selectWallpaperFile() {
    const result = await dialog.showOpenDialog({
      title: '选择壁纸文件',
      filters: [
        { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: '视频文件', extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  }

  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    
    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    return 'unknown';
  }

  async setWallpaper(type, filePath = '', opacity = 1.0) {
    this.wallpaperSettings.type = type;
    this.wallpaperSettings.path = filePath;
    this.wallpaperSettings.opacity = opacity;
    this.wallpaperSettings.enabled = type !== 'none';

    if (type === 'none') {
      this.destroyWallpaperWindow();
    } else {
      await this.createOrUpdateWallpaperWindow();
    }

    await this.saveSettings();
    return { success: true };
  }

  async createOrUpdateWallpaperWindow() {
    if (this.wallpaperWindow) {
      this.wallpaperWindow.close();
      this.wallpaperWindow = null;
    }

    if (!this.wallpaperSettings.enabled || !this.wallpaperSettings.path) {
      return;
    }

    const fileType = this.getFileType(this.wallpaperSettings.path);
    
    this.wallpaperWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: false,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    // 创建壁纸内容
    const htmlContent = this.generateWallpaperHTML(fileType, this.wallpaperSettings.path, this.wallpaperSettings.opacity);
    
    await this.wallpaperWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    
    // 设置窗口为桌面壁纸层
    this.wallpaperWindow.setAlwaysOnTop(true, 'screen-saver');
    this.wallpaperWindow.show();
    this.wallpaperWindow.maximize();
    this.wallpaperWindow.setSkipTaskbar(true);
  }

  generateWallpaperHTML(fileType, filePath, opacity) {
    if (fileType === 'image') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
              background: #000;
            }
            .wallpaper {
              width: 100%;
              height: 100%;
              object-fit: cover;
              opacity: ${opacity};
            }
          </style>
        </head>
        <body>
          <img src="file://${filePath}" class="wallpaper" alt="Wallpaper">
        </body>
        </html>
      `;
    } else if (fileType === 'video') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
              background: #000;
            }
            .wallpaper {
              width: 100%;
              height: 100%;
              object-fit: cover;
              opacity: ${opacity};
            }
          </style>
        </head>
        <body>
          <video src="file://${filePath}" class="wallpaper" autoplay loop muted></video>
        </body>
        </html>
      `;
    }
    return '<html><body></body></html>';
  }

  destroyWallpaperWindow() {
    if (this.wallpaperWindow) {
      this.wallpaperWindow.close();
      this.wallpaperWindow = null;
    }
  }

  getSettings() {
    return { ...this.wallpaperSettings };
  }

  async setOpacity(opacity) {
    this.wallpaperSettings.opacity = Math.max(0.1, Math.min(1.0, opacity));
    
    if (this.wallpaperWindow) {
      await this.createOrUpdateWallpaperWindow();
    }
    
    await this.saveSettings();
    return { success: true, opacity: this.wallpaperSettings.opacity };
  }

  cleanup() {
    this.destroyWallpaperWindow();
  }
}

module.exports = WallpaperManager;