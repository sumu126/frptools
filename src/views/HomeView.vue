<template>
  <div class="home-container">
    <h1>{{ appName }}</h1>
    <p>这是一个使用自定义标题栏的 Electron 应用</p>
    
    <div class="controls">
      <div class="control-group">
        <label>应用名称:</label>
        <input v-model="appNameInput" @input="updateAppName" type="text">
      </div>
      
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
</template>

<script>
export default {
  name: 'HomeView',
  data() {
    return {
      appName: '加载中...', // 初始显示加载状态
      appNameInput: '', // 用于输入框的独立数据
      theme: 'dark'
    }
  },
  async mounted() {
    // 异步获取应用名称
    await this.loadAppName();
    
    // 设置输入框的初始值
    this.appNameInput = this.appName;
    
    // 组件挂载时，通知父组件初始值
    this.updateAppName();
    this.updateTheme();
  },
  methods: {
    async loadAppName() {
      try {
        // 从package.json中获取应用名称，如果获取失败则使用默认值
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
    updateAppName() {
      // 更新显示的应用名称
      this.appName = this.appNameInput;
      
      // 通过事件总线发送应用名称更新事件
      window.dispatchEvent(new CustomEvent('update-app-name', { 
        detail: { appName: this.appName } 
      }));
    },
    updateTheme() {
      // 通过事件总线发送主题更新事件
      window.dispatchEvent(new CustomEvent('update-theme', { 
        detail: { theme: this.theme } 
      }));
    }
  }
}
</script>

<style scoped>
.home-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

h1 {
  margin-bottom: 10px;
}

p {
  margin-bottom: 20px;
  color: #666;
}

.controls {
  margin-top: 20px;
}

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.control-group input,
.control-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}
</style>