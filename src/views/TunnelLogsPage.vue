<template>
  <div class="content-section">
    <div class="page-header">
      <h2>📋 日志管理</h2>
      <p class="page-description">查看和管理隧道与服务端日志</p>
      <div class="log-type-selector">
        <label>日志类型：</label>
        <select 
          id="log-type-select" 
          v-model="logType" 
          @change="onLogTypeChange"
          class="log-type-select"
        >
          <option value="tunnel">隧道日志</option>
          <option value="server">服务端日志</option>
        </select>
      </div>
    </div>

    <!-- 选择器 -->
    <div class="tunnel-selector">
      <label for="item-select">{{ logType === 'tunnel' ? '选择隧道：' : '选择服务：' }}</label>
      <select 
        id="item-select" 
        v-model="selectedId" 
        @change="onSelectionChange"
        class="tunnel-select"
      >
        <option value="">{{ logType === 'tunnel' ? '请选择隧道' : '请选择服务' }}</option>
        <option 
          v-for="item in selectableItems" 
          :key="item.id" 
          :value="item.id"
        >
          {{ item.name }} {{ logType === 'tunnel' ? `(${getStatusText(item.status)})` : '' }}
        </option>
      </select>
      <button 
        class="btn btn-primary btn-sm"
        @click="refreshTunnels"
        title="刷新隧道列表"
      >
        <span class="btn-icon">🔄</span>
        刷新
      </button>
    </div>

    <!-- 日志控制按钮 -->
    <div class="log-controls" v-if="selectedId">
      <button 
        class="btn btn-primary btn-sm"
        @click="loadLogs"
        :disabled="loading"
      >
        <span class="btn-icon">🔄</span>
        {{ loading ? '加载中...' : '刷新日志' }}
      </button>
      <button 
        class="btn btn-warning btn-sm"
        @click="clearLogs"
        :disabled="loading || logs.length === 0"
      >
        <span class="btn-icon">🗑️</span>
        清空日志
      </button>
      <button 
        class="btn btn-success btn-sm"
        @click="exportLogs"
        :disabled="loading || logs.length === 0"
      >
        <span class="btn-icon">💾</span>
        导出日志
      </button>
      <div class="log-info">
        <span>日志条数：{{ logs.length }}</span>
        <span v-if="lastUpdated">最后更新：{{ formatDate(lastUpdated) }}</span>
      </div>
    </div>

    <!-- 日志显示区域 -->
    <div class="log-container" v-if="selectedId">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载日志中...</p>
      </div>
      <div v-else-if="logs.length === 0" class="empty-logs">
        <p>📝 暂无日志数据</p>
        <p>{{ logType === 'tunnel' ? '启动隧道后将显示相关日志' : '启动服务后将显示相关日志' }}</p>
      </div>
      <div v-else class="log-content">
        <div 
          v-for="(log, index) in logs" 
          :key="index" 
          class="log-entry"
          :class="getLogClass(log)"
        >
          <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
          <span class="log-type" :class="log.type">{{ log.type.toUpperCase() }}</span>
          <span class="log-message" v-html="formatLogMessage(log.data)"></span>
        </div>
      </div>
    </div>

    <!-- 未选择项目时的提示 -->
    <div v-else class="no-tunnel-selected">
      <p>🔍 请从上方选择一个{{ logType === 'tunnel' ? '隧道' : '服务' }}来查看其日志</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TunnelLogsPage',
  data() {
    return {
      logs: [],
      selectedTunnelId: '',
      selectedServerId: null,
      selectedId: null,
      logType: 'tunnel', // 'tunnel' 或 'server'
      tunnels: [],
      servers: [],
      loading: false,
      lastUpdated: null,
      autoRefreshInterval: null
    }
  },
  computed: {
    /**
     * 获取正在运行的隧道列表
     */
    runningTunnels() {
      return this.tunnels.filter(tunnel => tunnel.status === 'running');
    },
    runningServers() {
      return this.servers.filter(server => server.status === 'running');
    },
    selectableItems() {
      return this.logType === 'tunnel' ? this.runningTunnels : this.runningServers;
    }
  },
  mounted() {
    this.loadTunnels();
    this.loadServers();
    this.startAutoRefresh();
  },
  beforeUnmount() {
    this.stopAutoRefresh();
  },
  methods: {
    /**
     * 加载隧道列表
     */
    async loadTunnels() {
      try {
        const result = await window.electronAPI.tunnel.getAll();
        if (result.error) {
          console.error('获取隧道列表失败:', result.error);
          this.showNotification('获取隧道列表失败', result.error, 'error');
          return;
        }
        this.tunnels = result || [];
      } catch (error) {
        console.error('获取隧道列表失败:', error);
        this.showNotification('获取隧道列表失败', error.message, 'error');
      }
    },

    async loadServers() {
      try {
        const result = await window.electronAPI.frpsConfig.getAll();
        if (result.error) {
          console.error('获取服务端列表失败:', result.error);
          this.showNotification('获取服务端列表失败', result.error, 'error');
          return;
        }
        this.servers = result || [];
      } catch (error) {
        console.error('获取服务端列表失败:', error);
        this.showNotification('获取服务端列表失败', error.message, 'error');
      }
    },

    /**
     * 刷新项目列表
     */
    async refreshItems() {
      if (this.logType === 'tunnel') {
        await this.loadTunnels();
      } else {
        await this.loadServers();
      }
      if (this.selectedId) {
        await this.loadLogs();
      }
    },

    /**
     * 日志类型切换处理
     */
    onLogTypeChange() {
      // 切换日志类型时清空选择
      this.selectedId = null;
      this.logs = [];
      
      // 加载对应类型的数据
      if (this.logType === 'server') {
        this.loadServers();
      }
    },

    /**
     * 选择变化处理
     */
    onSelectionChange() {
      // 选择变化时加载对应的日志
      this.loadLogs();
    },

    /**
     * 加载日志
     */
    async loadLogs() {
      if (!this.selectedId) {
        this.logs = [];
        return;
      }

      try {
        if (this.logType === 'tunnel') {
          await this.loadTunnelLogs();
        } else {
          await this.loadServerLogs();
        }
      } catch (error) {
        console.error('加载日志失败:', error);
        this.showNotification('加载日志失败', error.message, 'error');
      }
    },

    /**
     * 加载服务端日志
     */
    async loadServerLogs() {
      if (!this.selectedId) {
        this.logs = [];
        return;
      }

      this.loading = true;
      try {
        console.log(`正在加载服务端 ${this.selectedId} 的日志...`);
        const result = await window.electronAPI.frpsConfig.getLogs(this.selectedId);
        if (result.error) {
          console.error('获取服务端日志失败:', result.error);
          this.showNotification('获取服务端日志失败', result.error, 'error');
          return;
        }
        this.logs = result || [];
        this.lastUpdated = new Date();
        console.log(`服务端 ${this.selectedId} 日志加载成功:`, this.logs);
      } catch (error) {
        console.error('获取服务端日志失败:', error);
        this.showNotification('获取服务端日志失败', error.message, 'error');
      } finally {
        this.loading = false;
      }
    },

    /**
     * 加载隧道日志
     */
    async loadTunnelLogs() {
      if (!this.selectedId) return;

      this.loading = true;
      try {
        const result = await window.electronAPI.tunnel.getLogs(this.selectedId);
        if (result.error) {
          console.error('获取隧道日志失败:', result.error);
          this.showNotification('获取隧道日志失败', result.error, 'error');
          return;
        }
        this.logs = result || [];
        this.lastUpdated = new Date();
      } catch (error) {
        console.error('获取隧道日志失败:', error);
        this.showNotification('获取隧道日志失败', error.message, 'error');
      } finally {
        this.loading = false;
      }
    },

    /**
     * 清空日志
     */
    async clearLogs() {
      if (!this.selectedId) return;

      let itemName = '';
      if (this.logType === 'tunnel') {
        const tunnel = this.tunnels.find(t => t.id === this.selectedId);
        if (!tunnel) return;
        itemName = tunnel.name;
      } else {
        const server = this.servers.find(s => s.id === this.selectedId);
        if (!server) return;
        itemName = server.name;
      }

      const itemType = this.logType === 'tunnel' ? '隧道' : '服务端';
      if (confirm(`确定要清空${itemType}"${itemName}"的日志吗？`)) {
        try {
          let result;
          if (this.logType === 'tunnel') {
            result = await window.electronAPI.tunnel.clearLogs(this.selectedId);
          } else {
            result = await window.electronAPI.frpsConfig.clearLogs(this.selectedId);
          }
          
          if (result.error) {
            console.error(`清空${itemType}日志失败:`, result.error);
            this.showNotification('清空日志失败', result.error, 'error');
            return;
          }
          this.logs = [];
          this.showNotification('清空成功', `${itemType}"${itemName}"的日志已清空`, 'info');
        } catch (error) {
          console.error(`清空${itemType}日志失败:`, error);
          this.showNotification('清空日志失败', error.message, 'error');
        }
      }
    },

    /**
     * 导出日志
     */
    async exportLogs() {
      if (!this.selectedId || this.logs.length === 0) return;

      let itemName = '';
      if (this.logType === 'tunnel') {
        const tunnel = this.tunnels.find(t => t.id === this.selectedId);
        if (!tunnel) return;
        itemName = tunnel.name;
      } else {
        const server = this.servers.find(s => s.id === this.selectedId);
        if (!server) return;
        itemName = server.name;
      }

      const itemType = this.logType === 'tunnel' ? '隧道' : '服务端';
      const fileName = `${itemType}_${itemName}_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`;
      
      try {
        const content = this.logs.map(log => 
          `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.data}`
        ).join('\n');
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);

        this.showNotification('导出成功', `日志已导出为 ${fileName}`, 'success');
      } catch (error) {
        console.error('导出日志失败:', error);
        this.showNotification('导出日志失败', error.message, 'error');
      }
    },

    /**
     * 生成日志内容
     */
    generateLogContent(tunnel) {
      const header = `# 隧道日志导出\n# 隧道名称: ${tunnel.name}\n# 隧道ID: ${tunnel.id}\n# 导出时间: ${new Date().toLocaleString('zh-CN')}\n# 日志条数: ${this.logs.length}\n${'='.repeat(80)}\n\n`;
      
      const logLines = this.logs.map(log => {
        const time = this.formatLogTime(log.timestamp);
        const type = log.type.toUpperCase().padEnd(6);
        const message = log.data;
        return `[${time}] ${type} ${message}`;
      }).join('\n');

      return header + logLines;
    },

    /**
     * 获取日志样式类
     */
    getLogClass(log) {
      return `log-${log.type}`;
    },

    /**
     * 格式化日志消息，支持控制台颜色
     */
    formatLogMessage(message) {
      if (!message) return '';
      
      // 转义HTML字符
      let formatted = message
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      // 处理ANSI颜色代码
      formatted = this.parseAnsiColors(formatted);
      
      // 处理URL链接
      formatted = this.parseUrls(formatted);
      
      return formatted;
    },

    /**
     * 解析ANSI颜色代码
     */
    parseAnsiColors(text) {
      // ANSI颜色代码正则表达式
      const ansiRegex = /\x1b\[[0-9;]*m/g;
      
      // 移除ANSI代码但保留颜色信息
      return text.replace(ansiRegex, (match) => {
        const code = match.slice(2, -1);
        
        // 颜色映射
        const colorMap = {
          '30': 'color-black',    // 黑色
          '31': 'color-red',      // 红色
          '32': 'color-green',    // 绿色
          '33': 'color-yellow',   // 黄色
          '34': 'color-blue',     // 蓝色
          '35': 'color-magenta',  // 洋红
          '36': 'color-cyan',     // 青色
          '37': 'color-white',    // 白色
          '90': 'color-gray',     // 亮黑色(灰色)
          '91': 'color-light-red',    // 亮红色
          '92': 'color-light-green',  // 亮绿色
          '93': 'color-light-yellow', // 亮黄色
          '94': 'color-light-blue',   // 亮蓝色
          '95': 'color-light-magenta',// 亮洋红
          '96': 'color-light-cyan',   // 亮青色
          '97': 'color-light-white'   // 亮白色
        };
        
        const colorClass = colorMap[code];
        return colorClass ? `</span><span class="${colorClass}">` : '';
      });
    },

    /**
     * 解析URL链接
     */
    parseUrls(text) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return text.replace(urlRegex, '<a href="$1" target="_blank" class="log-link">$1</a>');
    },

    /**
     * 格式化日志时间
     */
    formatLogTime(timestamp) {
      if (!timestamp) return '';
      return new Date(timestamp).toLocaleTimeString('zh-CN');
    },

    /**
     * 格式化日期
     */
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleString('zh-CN');
    },

    /**
     * 获取状态文本
     */
    getStatusText(status) {
      const statusMap = {
        running: '运行中',
        stopped: '已停止',
        error: '错误',
        starting: '启动中',
        stopping: '停止中'
      };
      return statusMap[status] || '未知';
    },

    /**
     * 显示通知
     */
    showNotification(title, message, type = 'info') {
      // 这里可以实现一个通知系统，暂时使用console
      console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
      
      // 也可以发送自定义事件给主应用处理
      window.dispatchEvent(new CustomEvent('show-notification', {
        detail: { title, message, type }
      }));
    },

    /**
     * 开始自动刷新
     */
    startAutoRefresh() {
      this.autoRefreshInterval = setInterval(() => {
        if (this.selectedId) {
          this.loadLogs();
        }
      }, 5000); // 每5秒刷新一次
    },

    /**
     * 停止自动刷新
     */
    stopAutoRefresh() {
      if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval);
        this.autoRefreshInterval = null;
      }
    }
  }
}
</script>

<style scoped>
.content-section {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 2em;
}

.page-description {
  color: #7f8c8d;
  margin: 0;
  font-size: 1.1em;
}

.tunnel-selector {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.tunnel-selector label {
  font-weight: 600;
  color: #2c3e50;
  min-width: 80px;
}

.tunnel-select {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: border-color 0.3s;
}

.tunnel-select:focus {
  outline: none;
  border-color: #3498db;
}

.log-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.log-info {
  margin-left: auto;
  display: flex;
  gap: 20px;
  color: #7f8c8d;
  font-size: 14px;
}

.log-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-logs {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-logs p:first-child {
  font-size: 1.2em;
  margin-bottom: 10px;
}

.no-tunnel-selected {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
  font-size: 1.1em;
}

.log-content {
  max-height: 600px;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.log-entry {
  display: flex;
  padding: 8px 15px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.log-entry:hover {
  background-color: #f8f9fa;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: #7f8c8d;
  min-width: 80px;
  font-size: 12px;
}

.log-type {
  min-width: 60px;
  font-weight: bold;
  font-size: 11px;
  text-align: center;
  padding: 2px 6px;
  border-radius: 3px;
  margin-right: 10px;
}

.log-type.stdout {
  background-color: #d4edda;
  color: #155724;
}

.log-type.stderr {
  background-color: #f8d7da;
  color: #721c24;
}

.log-message {
  flex: 1;
  word-break: break-all;
  white-space: pre-wrap;
}

/* 日志颜色样式 */
.color-black { color: #000000; }
.color-red { color: #ff0000; }
.color-green { color: #00ff00; }
.color-yellow { color: #ffff00; }
.color-blue { color: #0000ff; }
.color-magenta { color: #ff00ff; }
.color-cyan { color: #00ffff; }
.color-white { color: #ffffff; }
.color-gray { color: #808080; }
.color-light-red { color: #ff6b6b; }
.color-light-green { color: #51cf66; }
.color-light-yellow { color: #ffd43b; }
.color-light-blue { color: #339af0; }
.color-light-magenta { color: #ff6bb6; }
.color-light-cyan { color: #22b8cf; }
.color-light-white { color: #f8f9fa; }

.log-link {
  color: #3498db;
  text-decoration: none;
}

.log-link:hover {
  text-decoration: underline;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-warning {
  background-color: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background-color: #e67e22;
}

.btn-success {
  background-color: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #229954;
}

.btn-icon {
  font-size: 1em;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tunnel-selector {
    flex-direction: column;
    align-items: stretch;
  }
  
  .log-controls {
    flex-wrap: wrap;
  }
  
  .log-info {
    width: 100%;
    margin-top: 10px;
    justify-content: space-between;
  }
  
  .log-entry {
    flex-direction: column;
    gap: 5px;
  }
  
  .log-time,
  .log-type {
    min-width: auto;
  }
}
</style>