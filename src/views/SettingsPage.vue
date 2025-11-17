<template>
  <div class="content-section">
    <h1>设置</h1>
    <div class="settings-panel">
      <!-- 主题设置 -->
      <div class="setting-item">
        <h3>主题设置</h3>
        <div class="setting-controls">
          <div class="control-group">
            <label>主题:</label>
            <select v-model="theme" @change="updateTheme">
              <option value="dark">深色</option>
              <option value="light">浅色</option>
              <option value="blue">蓝色</option>
              <option value="dynamic">动态呼吸灯</option>
              <option value="pink-gradient">粉色</option>
              <option value="purple">紫色</option>
              <option value="green">绿色</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- 通用设置 -->
      <div class="setting-item">
        <h3>通用设置</h3>
        <div class="setting-controls">
          <label>
            <input type="checkbox" v-model="autoStart"> 开机自启动
          </label>
        </div>
      </div>
      
      <!-- 壁纸设置 -->
      <div class="setting-item">
        <h3>壁纸设置</h3>
        <div class="setting-controls">
          <div class="control-group">
            <label>选择壁纸:</label>
            <div class="wallpaper-selector">
              <button class="btn btn-primary" @click="selectImageWallpaper">
                 选择图片壁纸
              </button>
              <button class="btn btn-primary" @click="selectVideoWallpaper">
                 选择MP4壁纸
              </button>
              <button v-if="wallpaperPath" class="btn btn-danger" @click="clearWallpaper">
                 清除壁纸
              </button>
            </div>
          </div>
          
          <div v-if="wallpaperPath" class="control-group">
            <label>当前壁纸:</label>
            <div class="current-wallpaper">
              <p><strong>文件:</strong> {{ getFileName(wallpaperPath) }}</p>
              <p><strong>类型:</strong> {{ isImageFile ? '图片' : '视频' }}</p>
            </div>
          </div>
          
          <div v-if="wallpaperPath" class="control-group">
            <label>实时预览:</label>
            <div class="wallpaper-preview-container">
              <div class="preview-frame">
                <!-- 静态图片预览 -->
                <img 
                  v-if="isImageFile" 
                  :src="wallpaperPath" 
                  alt="壁纸预览" 
                  class="preview-image"
                  @load="handlePreviewLoad"
                  @error="handlePreviewError"
                >
                <!-- 视频预览 -->
                <video
                  v-else-if="isVideoFile"
                  :src="wallpaperPath"
                  class="preview-video"
                  autoplay
                  loop
                  muted
                  @loadeddata="handlePreviewLoad"
                  @error="handlePreviewError"
                />
                <!-- 加载状态 -->
                <div v-if="previewLoading" class="preview-loading">
                  <div class="loading-spinner"></div>
                  <span>加载中...</span>
                </div>
                <!-- 错误状态 -->
                <div v-if="previewError" class="preview-error">
                  <span>⚠️ {{ previewError }}</span>
                </div>
              </div>
              <div class="preview-info">
                <p><strong>文件:</strong> {{ getFileName(wallpaperPath) }}</p>
                <p><strong>类型:</strong> {{ isImageFile ? '图片' : '视频' }}</p>
                <p><strong>尺寸:</strong> {{ previewDimensions || '获取中...' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 界面透明度设置 -->
      <div class="setting-item">
        <h3>界面透明度</h3>
        <div class="setting-controls">
          <div class="control-group">
            <label>应用透明度: {{ windowOpacity }}%</label>
            <div class="opacity-control">
              <input 
                type="range" 
                v-model="windowOpacity" 
                min="30" 
                max="100" 
                @input="handleWindowOpacityChange"
                class="opacity-slider"
              >
              <span class="opacity-value">{{ windowOpacity }}%</span>
            </div>
          </div>
        </div>
      </div>
      
    
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsPage',
  props: {
    currentTheme: {
      type: String,
      default: 'dark'
    }
  },
  data() {
    return {
      theme: this.currentTheme,
      autoStart: false,
      windowOpacity: 100,  // 改为百分比：0-100
      wallpaperPath: '',
      previewLoading: false,
      previewError: '',
      previewDimensions: ''
    }
  },
  computed: {
    isImageFile() {
      if (!this.wallpaperPath) return false;
      const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      const ext = this.wallpaperPath.toLowerCase().substring(this.wallpaperPath.lastIndexOf('.'));
      return imageExts.includes(ext);
    },
    isVideoFile() {
      if (!this.wallpaperPath) return false;
      const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
      const ext = this.wallpaperPath.toLowerCase().substring(this.wallpaperPath.lastIndexOf('.'));
      return videoExts.includes(ext);
    }
  },
  watch: {
    currentTheme(newTheme) {
      this.theme = newTheme;
    }
  },
  async mounted() {
    await this.loadWallpaperSettings();
    await this.loadWindowOpacity();
  },
  methods: {
    updateTheme() {
      this.$emit('update-theme', this.theme);
    },
    
    async loadWallpaperSettings() {
      try {
        if (window.electronAPI && window.electronAPI.getWallpaper) {
          const result = await window.electronAPI.getWallpaper();
          if (result.success) {
            const wallpaper = result.wallpaper;
            this.wallpaperPath = wallpaper.path || '';
          }
        }
      } catch (error) {
        console.error('加载壁纸设置失败:', error);
      }
    },
    
    async loadWindowOpacity() {
      try {
        if (window.electronAPI && window.electronAPI.getWindowOpacity) {
          const result = await window.electronAPI.getWindowOpacity();
          if (result.success) {
            // 后端返回的是0-1范围，转换为百分比显示
            this.windowOpacity = Math.round(result.opacity * 100);
          } else {
            // 如果获取失败，使用默认值
            this.windowOpacity = 100;
          }
        } else {
          // 如果API不可用，使用默认值
          this.windowOpacity = 100;
        }
      } catch (error) {
        console.error('加载窗口透明度失败:', error);
        this.windowOpacity = 100; // 出错时使用默认值
      }
    },
    
    async handleWindowOpacityChange() {
      try {
        if (window.electronAPI && window.electronAPI.setWindowOpacity) {
          // 前端是百分比，转换为0-1范围发送给后端
          const opacity = this.windowOpacity / 100;
          const result = await window.electronAPI.setWindowOpacity(opacity);
          if (result.success) {
            // 触发透明度更新事件，传递0-1范围的值
            window.dispatchEvent(new CustomEvent('update-opacity', { 
              detail: { opacity } 
            }));
          } else {
            throw new Error(result.error || '设置透明度失败');
          }
        }
      } catch (error) {
        console.error('设置窗口透明度失败:', error);
        this.$message.error('设置透明度失败: ' + error.message);
      }
    },
    
    async applyWallpaperSettings() {
      try {
        if (window.electronAPI && window.electronAPI.setWallpaper) {
          // 根据文件扩展名自动判断类型
          let wallpaperType = 'none';
          if (this.wallpaperPath) {
            const extension = this.wallpaperPath.split('.').pop().toLowerCase();
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
            const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
            
            if (imageExtensions.includes(extension)) {
              wallpaperType = 'static';
            } else if (videoExtensions.includes(extension)) {
              wallpaperType = 'dynamic';
            }
          }

          const result = await window.electronAPI.setWallpaper({
            type: wallpaperType,
            path: this.wallpaperPath,
            opacity: 1 // 壁纸固定为不透明
          });
          if (!result.success) {
            throw new Error(result.error || '设置壁纸失败');
          }
          
          // 立即触发壁纸更新事件以确保实时显示
          window.dispatchEvent(new CustomEvent('wallpaper-changed', { 
            detail: {
              type: wallpaperType,
              path: this.wallpaperPath,
              opacity: 1
            }
          }));
        }
      } catch (error) {
        console.error('应用壁纸设置失败:', error);
        this.$message.error('设置壁纸失败: ' + error.message);
      }
    },
    
    async selectWallpaper() {
      try {
        if (window.electronAPI && window.electronAPI.selectWallpaperFile) {
          const result = await window.electronAPI.selectWallpaperFile();
          if (result.success) {
            this.wallpaperPath = result.filePath;
            this.resetPreview(); // 重置预览状态
            
            // 自动应用壁纸设置
            await this.applyWallpaperSettings();
          } else {
            throw new Error(result.error || '选择文件失败');
          }
        }
      } catch (error) {
        console.error('选择壁纸失败:', error);
        this.$message.error('选择壁纸失败: ' + error.message);
      }
    },
    
    async selectImageWallpaper() {
      try {
        if (window.electronAPI && window.electronAPI.selectImageFile) {
          const result = await window.electronAPI.selectImageFile();
          if (result.success) {
            this.wallpaperPath = result.filePath;
            this.resetPreview(); // 重置预览状态
            
            // 自动应用壁纸设置
            await this.applyWallpaperSettings();
          } else {
            throw new Error(result.error || '选择图片文件失败');
          }
        } else {
          // 如果没有专门的图片选择API，使用通用文件选择但限制文件类型
          await this.selectWallpaperWithFilter('image');
        }
      } catch (error) {
        console.error('选择图片壁纸失败:', error);
        this.$message.error('选择图片壁纸失败: ' + error.message);
      }
    },
    
    async selectVideoWallpaper() {
      try {
        if (window.electronAPI && window.electronAPI.selectVideoFile) {
          const result = await window.electronAPI.selectVideoFile();
          if (result.success) {
            this.wallpaperPath = result.filePath;
            this.resetPreview(); // 重置预览状态
            
            // 自动应用壁纸设置
            await this.applyWallpaperSettings();
          } else {
            throw new Error(result.error || '选择视频文件失败');
          }
        } else {
          // 如果没有专门的视频选择API，使用通用文件选择但限制文件类型
          await this.selectWallpaperWithFilter('video');
        }
      } catch (error) {
        console.error('选择视频壁纸失败:', error);
        this.$message.error('选择视频壁纸失败: ' + error.message);
      }
    },
    
    async selectWallpaperWithFilter(type) {
      try {
        if (window.electronAPI && window.electronAPI.selectWallpaperFile) {
          const result = await window.electronAPI.selectWallpaperFile();
          if (result.success) {
            const filePath = result.filePath;
            const extension = filePath.split('.').pop().toLowerCase();
            
            // 验证文件类型
            if (type === 'image') {
              const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
              if (!imageExtensions.includes(extension)) {
                throw new Error('请选择有效的图片文件');
              }
            } else if (type === 'video') {
              const videoExtensions = ['mp4']; // 只允许MP4
              if (!videoExtensions.includes(extension)) {
                throw new Error('请选择MP4视频文件');
              }
            }
            
            this.wallpaperPath = filePath;
            this.resetPreview(); // 重置预览状态
            
            // 自动应用壁纸设置
            await this.applyWallpaperSettings();
          } else {
            throw new Error(result.error || '选择文件失败');
          }
        }
      } catch (error) {
        console.error('选择文件失败:', error);
        this.$message.error('选择文件失败: ' + error.message);
      }
    },
    
    getFileName(filePath) {
      if (!filePath) return '';
      return filePath.substring(filePath.lastIndexOf('\\') + 1);
    },
    
    async clearWallpaper() {
      try {
        if (window.electronAPI && window.electronAPI.clearWallpaper) {
          const result = await window.electronAPI.clearWallpaper();
          if (result.success) {
            this.wallpaperPath = '';
            this.previewError = '';
            this.previewDimensions = '';
            
            // 立即触发壁纸清除事件以确保实时显示
            window.dispatchEvent(new CustomEvent('wallpaper-changed', { 
              detail: {
                type: 'none',
                path: '',
                opacity: 1
              }
            }));
          } else {
            throw new Error(result.error || '清除壁纸失败');
          }
        }
      } catch (error) {
        console.error('清除壁纸失败:', error);
        this.$message.error('清除壁纸失败: ' + error.message);
      }
    },
    
    handlePreviewLoad(event) {
      this.previewLoading = false;
      this.previewError = '';
      const element = event.target;
      this.previewDimensions = `${element.naturalWidth || element.videoWidth} × ${element.naturalHeight || element.videoHeight}`;
    },
    
    handlePreviewError(event) {
      this.previewLoading = false;
      this.previewError = '文件加载失败，请检查文件是否存在或格式是否支持';
      console.error('预览加载失败:', event);
    },
    
    resetPreview() {
      this.previewLoading = true;
      this.previewError = '';
      this.previewDimensions = '';
    }
  }
}
</script>

<style scoped>
.content-section {
  padding: 30px;
  max-width: 800px;
  margin: 0 auto;
}

.content-section h1 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 2em;
}

.settings-panel {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.setting-item {
  padding: 25px;
  border-bottom: 1px solid #ecf0f1;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.2em;
}

.setting-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.setting-controls label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #34495e;
  cursor: pointer;
}

.setting-controls input[type="checkbox"] {
  width: auto;
}

.setting-controls input[type="range"] {
  width: 200px;
  margin: 0 10px;
}

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #2c3e50;
}

.control-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

/* 壁纸选择器样式 */
.wallpaper-selector {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.wallpaper-selector .btn {
  min-width: 160px;
  justify-content: center;
  font-size: 0.9em;
  padding: 10px 16px;
}

.wallpaper-selector .btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.wallpaper-selector .btn-primary:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.wallpaper-selector .btn-danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: white;
  border: none;
}

.wallpaper-selector .btn-danger:hover {
  background: linear-gradient(135deg, #ff5252 0%, #e53e3e 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

/* 当前壁纸信息样式 */
.current-wallpaper {
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.current-wallpaper p {
  margin: 4px 0;
  font-size: 0.9em;
  color: #495057;
}

.current-wallpaper strong {
  color: #2c3e50;
}

/* 文件选择器样式 */
.file-selector {
  display: flex;
  gap: 10px;
  align-items: center;
}

.file-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f8f9fa;
  color: #6c757d;
}

/* 透明度控制样式 */
.opacity-control {
  display: flex;
  align-items: center;
  gap: 15px;
}

.opacity-slider {
  flex: 1;
  max-width: 300px;
}

.opacity-value {
  min-width: 50px;
  text-align: center;
  font-weight: bold;
  color: #3498db;
}

/* 壁纸预览样式 */
.wallpaper-preview-container {
  margin-top: 15px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.preview-frame {
  position: relative;
  width: 100%;
  height: 200px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image,
.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.preview-error {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
  padding: 20px;
}

.preview-info {
  padding: 15px;
  background: white;
  border-top: 1px solid #e9ecef;
}

.preview-info p {
  margin: 5px 0;
  font-size: 13px;
  color: #495057;
}

.preview-info strong {
  color: #2c3e50;
  min-width: 60px;
  display: inline-block;
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>