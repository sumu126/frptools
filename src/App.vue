<template>
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
import iconSrc from './assets/icon.png'

export default {
  name: 'App',
  components: {
    TitleBar
  },
  data() {
    return {
      appName: '加载中...',
      iconSrc: iconSrc,
      theme: 'dark'
    }
  },
  async mounted() {
    // 初始化应用名称
    await this.loadAppName();

    // 监听应用名称更新事件
    window.addEventListener('update-app-name', this.handleAppNameUpdate)
    
    // 监听主题更新事件
    window.addEventListener('update-theme', this.handleThemeUpdate)
  },
  beforeUnmount() {
    // 清理事件监听器
    window.removeEventListener('update-app-name', this.handleAppNameUpdate)
    window.removeEventListener('update-theme', this.handleThemeUpdate)
  },
  methods: {
    /**
     * 动态加载应用名称
     */
    async loadAppName() {
      try {
        if (window.electronAPI && window.electronAPI.getAppName) {
          const name = await window.electronAPI.getAppName();
          this.appName = name || 'electron_demo';
        } else {
          // 如果无法从Electron API获取，则使用默认值
          this.appName = 'electron_demo';
        }
      } catch (error) {
        console.warn('获取应用名称失败，使用默认值:', error);
        this.appName = 'electron_demo';
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
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.main-container {
  flex: 1;
  height: calc(100vh - 32px); /* 假设标题栏高度为32px */
  overflow: auto;
  background: #f5f5f5;
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