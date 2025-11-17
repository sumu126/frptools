<template>
  <div class="title-bar" :class="themeClass">
    <div class="title-bar-left">
      <img :src="iconSrc" alt="App Icon" class="icon" v-if="iconSrc">
      <span class="title">{{ appName }}</span>
    </div>
    <div class="title-bar-right">
      <button class="winButton" @click="handleMinimize">─</button>
      <button class="winButton" @click="handleMaximize">🗖</button>
      <button class="winButton" id="close" @click="handleClose">✖</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TitleBar',
  props: {
    appName: {
      type: String,
      default: '加载中...'
    },
    iconSrc: {
      type: String,
      default: ''
    },
    theme: {
      type: String,
      default: 'dark',
      validator: (value) => ['dark', 'light', 'blue', 'pink-gradient', 'dynamic', 'purple', 'green'].includes(value)
    }
  },
  emits: ['minimize', 'maximize', 'close'],
  computed: {
    themeClass() {
      return `theme-${this.theme}`;
    }
  },
  methods: {
    handleMinimize() {
      // Electron 最小化窗口
      window.electronAPI.winMinimize();
      // this.$emit('minimize');
    },
    handleMaximize() {
      // Electron 最大化/还原窗口
      window.electronAPI.winMaximize();
      // this.$emit('maximize');
    },
    handleClose() {
      // Electron 关闭窗口
      window.electronAPI.winClose();
      // this.$emit('close');
    }
  }
}
</script>

<style scoped>
.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  background: rgba(30, 30, 30, var(--window-opacity, 1));
  color: white;
  -webkit-app-region: drag;
  padding: 0 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  user-select: none;
  transition: background 0.3s ease;
}

.title-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.title {
  font-size: 14px;
  font-weight: 500;
}

.title-bar-right {
  display: flex;
  -webkit-app-region: no-drag;
}

.winButton {
  width: 40px;
  height: 30px;
  border: none;
  background: transparent;
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

/* 深色主题 */
.title-bar.theme-dark {
  background: rgba(30, 30, 30, var(--window-opacity, 1));
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

/* 浅色主题 */
.title-bar.theme-light {
  background: rgba(250, 250, 250, var(--window-opacity, 1));
  color: #333;
  border-bottom-color: rgba(0, 0, 0, 0.1);
}

.title-bar.theme-light .winButton {
  color: #333;
}

/* 蓝色主题 */
.title-bar.theme-blue {
  background: linear-gradient(90deg, #2196F3, #1976D2);
  border-bottom-color: #1565C0;
}

/* 粉色渐变主题 */
.title-bar.theme-pink-gradient {
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E, #FFC3A1);
  border-bottom-color: #FF6B6B;
}

/* 紫色主题 */
.title-bar.theme-purple {
  background: linear-gradient(90deg, #9C27B0, #7B1FA2);
  border-bottom-color: #6A1B9A;
}

/* 绿色主题 */
.title-bar.theme-green {
  background: linear-gradient(90deg, #4CAF50, #388E3C);
  border-bottom-color: #33691E;
}

/* 动态主题 */
.title-bar.theme-dynamic {
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
  border-bottom: none;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 按钮悬停效果 */
.title-bar.theme-dark .winButton:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.title-bar.theme-light .winButton:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.title-bar:not(.theme-light) .winButton:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.title-bar .winButton#close:hover {
    background-color: #ff3b30;
}

#close:hover {
  background: #e81123;
}

/* 主题样式 */
.title-bar.theme-light {
  background: rgba(240, 240, 240, var(--window-opacity, 1));
  color: #333;
}

.title-bar.theme-light .winButton {
  color: #333;
}

.title-bar.theme-light .winButton:hover {
  background: rgba(0, 0, 0, 0.1);
}

.title-bar.theme-blue {
  background: linear-gradient(135deg, #1a2a6c, #0078ff);
}

/* 响应式设计 */
@media (max-width: 600px) {
  .title-bar {
    height: 50px;
    padding: 0 15px;
  }
  
  .title {
    font-size: 16px;
  }
  
  .winButton {
    width: 50px;
    height: 40px;
    font-size: 16px;
  }
}
</style>