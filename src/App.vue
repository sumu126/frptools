<template>
    <!-- 壁纸显示 -->
    <WallpaperDisplay :wallpaper="wallpaper" />
    
    <!-- 使用标题栏组件 -->
    <TitleBar 
      :app-name="appName" 
      :icon-src="iconSrc"
      :theme="theme"
      @minimize="handleMinimize"
      @maximize="handleMaximize"
      @close="handleClose"
    />
    
    <!-- 路由视图 -->
    <div class="main-container">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
</template>

<script>
import TitleBar from './components/titleBar/titleBar.vue'
import WallpaperDisplay from './components/WallpaperDisplay.vue'
import iconSrc from './assets/icon.png'

export default {
  name: 'App',
  components: {
    TitleBar,
    WallpaperDisplay
  },
  data() {
    return {
      appName: '加载中...',
      iconSrc: iconSrc,
      theme: 'dark',
      wallpaper: {
        type: 'none',
        path: ''
      }
    }
  },
  async mounted() {
    // 初始化应用名称
    await this.loadAppName();

    // 监听应用名称更新事件
    window.addEventListener('update-app-name', this.handleAppNameUpdate)
    
    // 监听主题更新事件
    window.addEventListener('update-theme', this.handleThemeUpdate)
    
    // 监听透明度更新事件
    window.addEventListener('update-opacity', this.handleOpacityUpdate)
    
    // 监听壁纸更新事件
    window.addEventListener('wallpaper-changed', this.handleWallpaperChanged)
    
    // 初始化透明度
    await this.loadWindowOpacity();
    
    // 初始化壁纸
    await this.loadWallpaper();
  },
  beforeUnmount() {
    // 清理事件监听器
    window.removeEventListener('update-app-name', this.handleAppNameUpdate)
    window.removeEventListener('update-theme', this.handleThemeUpdate)
    window.removeEventListener('update-opacity', this.handleOpacityUpdate)
    window.removeEventListener('wallpaper-changed', this.handleWallpaperChanged)
  },
  methods: {
    /**
     * 动态加载应用名称
     */
    async loadAppName() {
      try {
        if (window.electronAPI && window.electronAPI.getAppName) {
          const name = await window.electronAPI.getAppName();
          this.appName = name || 'frptools';
        } else {
          // 如果无法从Electron API获取，则使用默认值
          this.appName = 'frptools';
        }
      } catch (error) {
        console.warn('获取应用名称失败，使用默认值:', error);
        this.appName = 'frptools';
      }
    },
    handleMinimize() {
      window.electronAPI.winMinimize();
    },
    handleMaximize() {
      // Electron 最大化/还原窗口
      window.electronAPI.winMaximize();
    },
    handleClose() {
      // Electron 关闭窗口
      window.electronAPI.winClose();
    },
    handleAppNameUpdate(event) {
      this.appName = event.detail.appName
    },
    handleThemeUpdate(event) {
      this.theme = event.detail.theme
    },
    handleOpacityUpdate(event) {
      this.updateWindowOpacity(event.detail.opacity)
    },
    handleWallpaperChanged(event) {
      this.wallpaper = {
        type: event.detail.type,
        path: event.detail.path
      }
    },
    async loadWindowOpacity() {
      try {
        if (window.electronAPI && window.electronAPI.getWindowOpacity) {
          const result = await window.electronAPI.getWindowOpacity();
          if (result.success && result.opacity !== undefined) {
            this.updateWindowOpacity(result.opacity);
          }
        }
      } catch (error) {
        console.warn('获取窗口透明度失败:', error);
      }
    },
    async loadWallpaper() {
      try {
        if (window.electronAPI && window.electronAPI.getWallpaper) {
          const result = await window.electronAPI.getWallpaper();
          if (result.success && result.wallpaper) {
            this.wallpaper = result.wallpaper;
          }
        }
      } catch (error) {
        console.warn('获取壁纸设置失败:', error);
      }
    },
    updateWindowOpacity(opacity) {
      // 设置CSS变量来控制透明度
      document.documentElement.style.setProperty('--window-opacity', opacity);
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

body {
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.main-container {
  flex: 1;
  height: calc(100vh - 32px); /* 假设标题栏高度为32px */
  overflow: auto;
  background: rgba(245, 245, 245, var(--window-opacity, 1));
  /* 移除模糊效果，避免影响壁纸显示 */
}

/* 页面切换过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>