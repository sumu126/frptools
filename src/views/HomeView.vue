<template>
  <div class="layout-container">
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
      <!-- 客户端设置页面 -->
      <ClientSettingsPage 
        v-if="activeNav === 'client-settings'" 
      />

      <!-- 服务端设置页面 -->
      <ServerSettingsPage 
        v-if="activeNav === 'server-settings'" 
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

export default {
  name: 'HomeView',
  components: {
    SettingsPage,
    AboutPage,
    ClientSettingsPage,
    ServerSettingsPage
  },
  data() {
    return {
      appName: '加载中...',
      theme: 'dark',
      activeNav: 'home',
      navItems: [
        { id: 'client-settings', text: '隧道管理', icon: '💻' },
        { id: 'server-settings', text: '服务管理', icon: '🌐' },
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
}
</style>