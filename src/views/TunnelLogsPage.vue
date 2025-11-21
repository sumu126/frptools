<template>
  <div class="logs-page">
    <div class="page-header">
      <h1>日志管理</h1>
      <p>查看和管理隧道与服务端日志</p>
    </div>

    <!-- 日志类型选择卡片 -->
    <div class="selector-card">
      <div class="card-header">
        <h3>选择日志类型</h3>
      </div>
      <div class="card-body">
        <div class="selector-controls">
          <select 
            id="log-type-select" 
            v-model="logType" 
            @change="onLogTypeChange"
            class="form-select"
          >
            <option value="tunnel">隧道日志</option>
            <option value="server">服务端日志</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 选择器卡片 -->
    <div class="selector-card">
      <div class="card-header">
        <h3>{{ logType === 'tunnel' ? '选择隧道' : '选择服务' }}</h3>
      </div>
      <div class="card-body">
        <div class="selector-controls">
          <select 
            id="item-select" 
            v-model="selectedId" 
            @change="onSelectionChange"
            class="form-select"
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
            class="btn btn-primary"
            @click="refreshItems"
            title="刷新列表"
          >
            <span class="btn-icon">🔄</span>
            刷新
          </button>
        </div>
      </div>
    </div>

    <!-- 日志控制卡片 -->
    <div class="log-controls-card" v-if="selectedId">
      <div class="card-header">
        <h3>日志控制</h3>
        <div class="log-info">
          <span>日志条数：{{ logs.length }}</span>
          <span v-if="lastUpdated">最后更新：{{ formatDate(lastUpdated) }}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="control-buttons">
          <button 
            class="btn btn-primary"
            @click="loadLogs"
            :disabled="loading"
          >
            <span class="btn-icon">🔄</span>
            {{ loading ? '加载中...' : '刷新日志' }}
          </button>
          <button 
            class="btn btn-warning"
            @click="clearLogs"
            :disabled="loading || logs.length === 0"
          >
            <span class="btn-icon">🗑️</span>
            清空日志
          </button>
          <button 
            class="btn btn-success"
            @click="exportLogs"
            :disabled="loading || logs.length === 0"
          >
            <span class="btn-icon">💾</span>
            导出日志
          </button>
        </div>
      </div>
    </div>

    <!-- 日志显示卡片 -->
    <div class="log-display-card" v-if="selectedId">
      <div class="card-header">
        <h3>日志内容</h3>
      </div>
      <div class="card-body card-body-no-padding">
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
    </div>

    <!-- 未选择项目时的提示 -->
    <div v-else class="no-selection-card">
      <div class="card-body">
        <div class="empty-state">
          <p>🔍 请从上方选择一个{{ logType === 'tunnel' ? '隧道' : '服务' }}来查看其日志</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TunnelLogsPage',
  data() {
    // 从localStorage恢复状态
    const savedState = this.loadSavedState();
    return {
      logs: [],
      selectedTunnelId: savedState.selectedTunnelId || '',
      selectedServerId: savedState.selectedServerId || null,
      selectedId: savedState.selectedId || null,
      logType: savedState.logType || 'tunnel', // 'tunnel' 或 'server'
      tunnels: [],
      servers: [],
      loading: false,
      lastUpdated: null,
      autoRefreshInterval: null
    }
  },
  watch: {
    /**
     * 监听selectedId变化，保存状态
     */
    selectedId(newVal) {
      if (newVal) {
        this.saveState();
      }
    },
    
    /**
     * 监听logType变化，保存状态
     */
    logType() {
      this.saveState();
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
    
    // 在数据加载完成后，如果有保存的选择状态，尝试加载对应的日志
    this.$nextTick(() => {
      setTimeout(() => {
        this.validateAndRestoreState();
      }, 1000);
    });
  },
  beforeUnmount() {
    this.stopAutoRefresh();
  },
  methods: {
    /**
     * 从localStorage恢复保存的状态
     */
    loadSavedState() {
      try {
        const savedState = localStorage.getItem('tunnelLogsPageState');
        return savedState ? JSON.parse(savedState) : {};
      } catch (error) {
        console.error('恢复状态失败:', error);
        return {};
      }
    },

    /**
     * 保存当前状态到localStorage
     */
    saveState() {
      try {
        const state = {
          logType: this.logType,
          selectedId: this.selectedId,
          selectedTunnelId: this.selectedTunnelId,
          selectedServerId: this.selectedServerId
        };
        localStorage.setItem('tunnelLogsPageState', JSON.stringify(state));
      } catch (error) {
        console.error('保存状态失败:', error);
      }
    },

    /**
     * 验证并恢复保存的状态
     */
    validateAndRestoreState() {
      // 检查保存的日志类型是否还有对应的项目
      if (this.logType === 'tunnel' && this.selectedId) {
        const tunnelExists = this.tunnels.some(t => t.id === this.selectedId);
        if (!tunnelExists) {
          console.log('保存的隧道不存在，清空选择');
          this.selectedId = null;
          this.selectedTunnelId = '';
          this.saveState();
          return;
        }
      } else if (this.logType === 'server' && this.selectedId) {
        const serverExists = this.servers.some(s => s.id === this.selectedId);
        if (!serverExists) {
          console.log('保存的服务不存在，清空选择');
          this.selectedId = null;
          this.selectedServerId = null;
          this.saveState();
          return;
        }
      }

      // 如果有有效的选择，加载对应的日志
      if (this.selectedId) {
        console.log('恢复状态，加载日志:', this.logType, this.selectedId);
        this.loadLogs();
      }
    },

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
      
      // 保存状态
      this.saveState();
      
      // 加载对应类型的数据
      if (this.logType === 'server') {
        this.loadServers();
      }
    },

    /**
     * 选择变化处理
     */
    onSelectionChange() {
      // 保存状态
      this.saveState();
      
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
/* 页面布局 */
.logs-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面头部样式 */
.page-header {
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.page-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 2em;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: #7f8c8d;
  font-size: 1.1em;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.log-type-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-type-selector label {
  font-weight: 500;
  color: #2c3e50;
}

/* 卡片通用样式 */
.selector-card,
.log-controls-card,
.log-display-card,
.no-selection-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.card-header {
  background: #f8f9fa;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2em;
  font-weight: 600;
}

.card-body {
  padding: 20px;
}

.card-body-no-padding {
  padding: 0;
}

/* 选择器控制区域 */
.selector-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.form-select {
  flex: 1;
  min-width: 250px;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9em;
  background: white;
  color: #2c3e50;
}

.form-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

/* 日志控制区域 */
.log-info {
  display: flex;
  gap: 20px;
  color: #7f8c8d;
  font-size: 0.9em;
}

.control-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #e67e22;
}

.btn-success {
  background: #2ecc71;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #27ae60;
}

.btn-icon {
  font-size: 1em;
}

/* 日志显示区域 */
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
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
  font-size: 1.3em;
  margin-bottom: 10px;
}

.empty-state {
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
  line-height: 1.6;
}

.log-entry {
  display: flex;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
  align-items: flex-start;
}

.log-entry:hover {
  background-color: #f8f9fa;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: #7f8c8d;
  min-width: 90px;
  font-size: 12px;
  font-family: inherit;
}

.log-type {
  min-width: 70px;
  font-weight: bold;
  font-size: 11px;
  text-align: center;
  padding: 3px 8px;
  border-radius: 4px;
  margin-right: 15px;
  font-family: inherit;
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
  font-family: inherit;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .logs-page {
    padding: 15px;
  }
  
  .page-header {
    margin-bottom: 20px;
  }
  
  .page-header h1 {
    font-size: 1.5em;
  }
  
  .header-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .selector-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-select {
    min-width: auto;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .log-info {
    flex-direction: column;
    gap: 5px;
  }
  
  .control-buttons {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .log-entry {
    flex-direction: column;
    gap: 8px;
    padding: 15px;
  }
  
  .log-time,
  .log-type {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .logs-page {
    padding: 10px;
  }
  
  .card-header,
  .card-body {
    padding: 15px;
  }
  
  .log-content {
    max-height: 400px;
  }
}
</style>