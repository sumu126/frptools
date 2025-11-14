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
      windowOpacity: 1
    }
  },
  watch: {
    currentTheme(newTheme) {
      this.theme = newTheme;
    }
  },
  methods: {
    updateTheme() {
      this.$emit('update-theme', this.theme);
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
</style>