<template>
  <div class="content-section">
    <div class="about-content">

      <div class="app-details">
        <div class="app-header">
          <div class="app-info">
            <p><strong>关于:</strong> frptools</p>
            <p><strong>版本:</strong> {{ appVersion }}</p>
            <p><strong>描述:</strong> 一个frp的GUI工具</p>
            <p><strong>许可证:</strong> MIT</p>
          </div>
          <div class="app-logo">
            <img src="@/assets/icon.png" alt="应用图标" draggable="false" ondragstart="return false;">
          </div>
        </div>
        <div class="contact-info">
          <h4>发布信息</h4>
          <p>GitHub: https://github.com/sumu126/frptools</p>
        </div>
        
        <div class="open-source-credits">
          <h4>开源鸣谢</h4>
          <p>本项目基于以下优秀的开源项目构建，特此鸣谢：</p>
          
          <div class="credits-grid">
            <div class="credit-category">
              <h5>核心框架</h5>
              <ul>
                <li><a href="https://v3.vuejs.org/" target="_blank">Vue 3</a> - 渐进式JavaScript框架</li>
                <li><a href="https://www.electronjs.org/" target="_blank">Electron</a> - 跨平台桌面应用开发框架</li>
                <li><a href="https://github.com/fatedier/frp" target="_blank">FRP</a> - 快速反向代理工具</li>
              </ul>
            </div>
            
            <div class="credit-category">
              <h5>UI组件</h5>
              <ul>
                <li><a href="https://element-plus.org/" target="_blank">Element Plus</a> - Vue 3的UI组件库</li>
              </ul>
            </div>
            
            <div class="credit-category">
              <h5>状态管理</h5>
              <ul>
                <li><a href="https://pinia.vuejs.org/" target="_blank">Pinia</a> - Vue 3的状态管理库</li>
                <li><a href="https://router.vuejs.org/" target="_blank">Vue Router</a> - Vue 3的路由管理库</li>
              </ul>
            </div>
            
            <div class="credit-category">
              <h5>工具库</h5>
              <ul>
                <li><a href="https://github.com/sindresorhus/electron-store" target="_blank">Electron Store</a> - 配置持久化存储</li>
                <li><a href="https://github.com/megahertz/electron-log" target="_blank">Electron Log</a> - 日志管理</li>
                <li><a href="https://github.com/sindresorhus/electron-util" target="_blank">Electron Util</a> - 工具函数库</li>
                <li><a href="https://github.com/sindresorhus/ps-list" target="_blank">ps-list</a> - 进程列表获取工具</li>
              </ul>
            </div>
            
            <div class="credit-category">
              <h5>构建工具</h5>
              <ul>
                <li><a href="https://vitejs.dev/" target="_blank">Vite</a> - 现代前端构建工具</li>
                <li><a href="https://www.typescriptlang.org/" target="_blank">TypeScript</a> - 类型安全的JavaScript超集</li>
                <li><a href="https://www.electron.build/" target="_blank">Electron Builder</a> - 应用打包工具</li>
              </ul>
            </div>
            
            <div class="credit-category">
              <h5>开发工具</h5>
              <ul>
                <li><a href="https://github.com/open-cli-tools/concurrently" target="_blank">Concurrently</a> - 并行执行命令行工具</li>
                <li><a href="https://github.com/jeffbski/wait-on" target="_blank">Wait-on</a> - 等待资源可用的工具</li>
                <li><a href="https://github.com/vuejs/language-tools" target="_blank">Vue TSC</a> - Vue TypeScript编译器</li>
              </ul>
            </div>
          </div>
          
          <div class="special-thanks">
            <p><strong>特别感谢</strong>所有开源项目的贡献者，正是有了你们的努力，才使得这个项目成为可能。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 直接从package.json导入版本号
import packageInfo from '../../package.json';

export default {
  name: 'AboutPage',
  props: {
    appName: {
      type: String,
      default: 'frptools'
    }
  },
  data() {
    return {
      appVersion: packageInfo.version
    }
  },
  mounted() {
    this.startAutoScroll()
  },
  methods: {
    startAutoScroll() {
      // 使用nextTick确保DOM完全渲染
      this.$nextTick(() => {
        const creditsGrid = this.$el.querySelector('.credits-grid')
        if (creditsGrid && creditsGrid.scrollHeight > creditsGrid.clientHeight) {
          let scrollPosition = 0
          const scrollSpeed = 2 // 增加滚动速度
          let isScrolling = true
          
          const scroll = () => {
            if (!isScrolling) return
            
            scrollPosition += scrollSpeed
            if (scrollPosition >= creditsGrid.scrollHeight - creditsGrid.clientHeight) {
              // 滚动到底部后暂停2秒再重新开始
              isScrolling = false
              setTimeout(() => {
                scrollPosition = 0
                creditsGrid.scrollTop = 0
                isScrolling = true
              }, 2000)
            }
            creditsGrid.scrollTop = scrollPosition
          }
          
          this.scrollInterval = setInterval(scroll, 50)
          
          // 鼠标悬停时暂停滚动
          creditsGrid.addEventListener('mouseenter', () => {
            isScrolling = false
          })
          
          // 鼠标离开时恢复滚动
          creditsGrid.addEventListener('mouseleave', () => {
            isScrolling = true
          })
        }
      })
    }
  },
  beforeUnmount() {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval)
    }
  }
}
</script>

<style scoped>
.content-section {
  padding: 30px;
  max-width: 1000px;
  margin: 0 auto;
}

.content-section h1 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 2em;
}

.about-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.app-info {
  flex: 1;
}

.app-logo {
  margin-left: 30px;
}

.app-logo img {
  width: 80px;
  height: 80px;
  border-radius: 8px;
}

.app-details p {
  margin-bottom: 10px;
  color: #2c3e50;
}

.app-details strong {
  color: #34495e;
}

.contact-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
}

.contact-info h4 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.contact-info p {
  margin-bottom: 5px;
  font-size: 0.9em;
  color: #7f8c8d;
}

.open-source-credits {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
}

.open-source-credits h4 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.2em;
}

.open-source-credits > p {
  margin-bottom: 20px;
  color: #7f8c8d;
  font-size: 0.95em;
}

.credits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

/* 滚动条样式 */
.credits-grid::-webkit-scrollbar {
  width: 8px;
}

.credits-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.credits-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.credits-grid::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.credit-category {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.credit-category h5 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 1em;
  font-weight: 600;
}

.credit-category ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.credit-category li {
  margin-bottom: 8px;
  font-size: 0.9em;
  line-height: 1.4;
}

.credit-category a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}

.credit-category a:hover {
  text-decoration: underline;
  color: #2980b9;
}

.special-thanks {
  background: #e8f4fd;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #2ecc71;
  margin-top: 20px;
}

.special-thanks p {
  margin: 0;
  color: #2c3e50;
  font-size: 0.95em;
  line-height: 1.5;
}

.special-thanks strong {
  color: #27ae60;
}

@media (max-width: 768px) {
  .about-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .credits-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .content-section {
    padding: 20px;
  }
}
</style>