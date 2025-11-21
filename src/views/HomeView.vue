<template>
  <div class="layout-container" :class="{ dark: theme === 'dark' }">
    <!-- 左侧导航栏 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>{{ appName }}</h2>
      </div>
      <nav class="sidebar-nav">
        <ul>
          <li 
            v-for="item in navItems" 
            :key="item.id"
            :class="{ active: activeNav === item.id }"
            @click="switchNav(item.id)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-text">{{ item.text }}</span>
          </li>
        </ul>
      </nav>
    </div>

    <!-- 右侧内容区域 -->
    <div class="content-area">
      <!-- 主页 -->
      <IndexPage 
        v-if="activeNav === 'home' " 
      />
      
      <!-- 客户端设置页面 -->
      <ClientSettingsPage 
        v-if="activeNav === 'client-settings' " 
      />

      <!-- 服务端设置页面 -->
      <ServerSettingsPage 
        v-if="activeNav === 'server-settings'" 
      />

      <!-- 隧道日志页面 -->
      <TunnelLogsPage 
        v-if="activeNav === 'tunnel-logs'" 
      />

      <!-- 设置页面 -->
      <SettingsPage 
        v-if="activeNav === 'settings'" 
        :current-theme="theme"
        @update-theme="handleThemeUpdate"
      />

      <!-- 关于页面 -->
      <AboutPage 
        v-if="activeNav === 'about'" 
        :app-name="appName"
      />
    </div>
  </div>
</template>

<script>
import SettingsPage from './SettingsPage.vue'
import AboutPage from './AboutPage.vue'
import ClientSettingsPage from './ClientSettingsPage.vue'
import ServerSettingsPage from './ServerSettingsPage.vue'
import TunnelLogsPage from './TunnelLogsPage.vue'
import IndexPage from './IndexPage.vue'

export default {
  name: 'HomeView',
  components: {
    SettingsPage,
    AboutPage,
    ClientSettingsPage,
    ServerSettingsPage,
    TunnelLogsPage,
    IndexPage
  },
  data() {
    return {
      appName: '加载中...',
      theme: 'dark',
      activeNav: 'home',
      navItems: [
        { id: 'home', text: '主页', icon: '🏠' },
        { id: 'client-settings', text: '隧道管理', icon: '💻' },
        { id: 'server-settings', text: '服务管理', icon: '🌐' },
        { id: 'tunnel-logs', text: '日志', icon: '📋' },
        { id: 'settings', text: '设置', icon: '⚙️' },
        { id: 'about', text: '关于', icon: 'ℹ️' }
      ]
    }
  },
  async mounted() {
    await this.loadAppName();
    this.updateAppName();
    this.updateTheme();
  },
  methods: {
    async loadAppName() {
      try {
        if (window.electronAPI && window.electronAPI.getAppName) {
          const name = await window.electronAPI.getAppName();
          this.appName = name || 'frptools';
        } else {
          this.appName = 'frptools';
        }
      } catch (error) {
        console.warn('获取应用名称失败，使用默认值:', error);
        this.appName = 'frptools';
      }
    },
    updateAppName() {
      window.dispatchEvent(new CustomEvent('update-app-name', { 
        detail: { appName: this.appName } 
      }));
    },
    updateTheme() {
      window.dispatchEvent(new CustomEvent('update-theme', { 
        detail: { theme: this.theme } 
      }));
    },
    switchNav(navId) {
      this.activeNav = navId;
    },
    handleAppNameUpdate(newAppName) {
      this.appName = newAppName;
      this.updateAppName();
    },
    handleThemeUpdate(newTheme) {
      this.theme = newTheme;
      this.updateTheme();
    }
  }
}
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* 左侧导航栏样式 */
.sidebar {
  width: 250px;
  background: rgba(44, 62, 80, var(--window-opacity, 1));
  color: white;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #34495e;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #34495e;
  text-align: center;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.2em;
  font-weight: 600;
}

.sidebar-nav {
  flex: 1;
  padding: 10px 0;
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-nav li {
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-nav li:hover {
  background-color: #34495e;
}

.sidebar-nav li.active {
  background-color: #3498db;
  border-right: 3px solid #2980b9;
}

.nav-icon {
  font-size: 1.2em;
}

.nav-text {
  font-size: 0.95em;
  font-weight: 500;
}

/* 右侧内容区域样式 */
.content-area {
  flex: 1;
  overflow-y: auto;
  background: rgba(236, 240, 241, var(--window-opacity, 1));
  /* 移除模糊效果，避免影响壁纸显示 */
  scroll-behavior: smooth;
}

/* 自定义滚动条样式 - WebKit浏览器 */
.content-area::-webkit-scrollbar {
  width: 8px;
}

.content-area::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.content-area::-webkit-scrollbar-thumb {
  background: rgba(180, 180, 180, 0.3);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.content-area::-webkit-scrollbar-thumb:hover {
  background: rgba(180, 180, 180, 0.6);
}

.content-area::-webkit-scrollbar-button {
  display: none;
}

/* Firefox 滚动条样式 */
.content-area {
  scrollbar-width: thin;
  scrollbar-color: rgba(180, 180, 180, 0.3) transparent;
}

/* 暗色主题滚动条样式 */
.layout-container.dark .content-area::-webkit-scrollbar-track {
  background: transparent;
}

.layout-container.dark .content-area::-webkit-scrollbar-thumb {
  background: rgba(100, 100, 100, 0.4);
}

.layout-container.dark .content-area::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 100, 100, 0.7);
}

.layout-container.dark .content-area {
  scrollbar-color: rgba(100, 100, 100, 0.4) transparent;
}
</style>