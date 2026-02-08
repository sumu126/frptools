<template>
  <div class="content-section">
    <div class="page-header">
      <h1>隧道管理</h1>
      <button class="btn btn-primary" @click="addNewTunnel">
        <span class="btn-icon">+</span>
        添加新隧道
      </button>
    </div>
    
    <!-- 启动进度提示 -->
    <div v-if="startingTunnelId" class="start-progress-overlay">
      <div class="start-progress-content">
        <div class="progress-header">
          <h3>正在启动隧道</h3>
          <span class="progress-close" @click="cancelStartProgress">×</span>
        </div>
        <div class="progress-body">
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: startProgress + '%' }"></div>
          </div>
          <div class="progress-text">{{ startProgressMessage }}</div>
          <div v-if="startError" class="progress-error">{{ startError }}</div>
        </div>
      </div>
    </div>
    
    <!-- 隧道列表 -->
    <div class="tunnels-grid">
      <div 
        v-for="tunnel in tunnels" 
        :key="tunnel.id"
        class="tunnel-card"
        :class="{ active: tunnel.status === 'running' }"
      >
        <div class="card-header">
          <h3>{{ tunnel.name }}</h3>
          <div class="status-indicator" :class="tunnel.status">
            <span class="status-dot"></span>
            <span class="status-text">{{ getStatusText(tunnel.status) }}</span>
          </div>
        </div>
        
        <div class="tunnel-info">
          <div class="info-item">
            <span class="label">本地地址:</span>
            <span class="value">{{ tunnel.localAddress }}</span>
          </div>
          <div class="info-item">
            <span class="label">远程地址:</span>
            <span class="value">{{ tunnel.remoteAddress }}</span>
          </div>
          <div class="info-item">
            <span class="label">协议:</span>
            <span class="value protocol">{{ tunnel.protocol }}</span>
          </div>
          <div class="info-item">
            <span class="label">创建时间:</span>
            <span class="value">{{ tunnel.createdAt }}</span>
          </div>
        </div>
        
        <div class="card-actions">
          <button 
            v-if="tunnel.status === 'stopped'" 
            class="btn btn-success btn-sm"
            @click="startTunnel(tunnel.id)"
          >
            <span class="btn-icon">▶</span>
            启动
          </button>
          <button 
            v-else 
            class="btn btn-danger btn-sm"
            @click="stopTunnel(tunnel.id)"
          >
            <span class="btn-icon">⏹</span>
            停止
          </button>
          <button 
            class="btn btn-outline btn-sm"
            @click="editTunnel(tunnel.id)"
          >
            <span class="btn-icon">✏️</span>
            编辑
          </button>
          <button 
            class="btn btn-outline btn-sm"
            @click="deleteTunnel(tunnel.id)"
          >
            <span class="btn-icon">🗑️</span>
            删除
          </button>
          <button 
            class="btn btn-primary btn-sm"
            @click="copyConnectionAddress(tunnel)"
            title="复制连接地址"
          >
            <span class="btn-icon">📋</span>
            复制地址
          </button>
        </div>
      </div>
      
      <!-- 添加新隧道卡片 -->
      <div class="tunnel-card add-new-card" @click="addNewTunnel">
        <div class="add-new-content">
          <span class="add-icon">+</span>
          <span class="add-text">添加新隧道</span>
        </div>
      </div>
    </div>
    
    <!-- 隧道编辑模态框 -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-scroll">
          <div class="modal-header">
            <h3>{{ editingTunnel ? '编辑隧道' : '添加新隧道' }}</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label>隧道名称:</label>
              <input v-model="tunnelForm.name" type="text" placeholder="输入隧道名称">
            </div>
            
            <div class="form-group">
              <label>本地地址:</label>
              <input v-model="tunnelForm.localAddress" type="text" placeholder="127.0.0.1:8080">
            </div>
            
            <div class="form-group">
              <label>远程地址:</label>
              <input v-model="tunnelForm.remoteAddress" type="text" placeholder="example.com:80">
            </div>
            
            <div class="form-group">
              <label>远程开放端口:</label>
              <input v-model="tunnelForm.remotePort" type="number" placeholder="8080" min="1" max="65535">
            </div>
            
            <div class="form-group">
              <label>协议类型:</label>
              <select v-model="tunnelForm.protocol">
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>认证方式:</label>
              <select v-model="tunnelForm.authType">
                <option value="none">无认证</option>
                <option value="token">Token认证</option>
              </select>
            </div>
            
            <div v-if="tunnelForm.authType !== 'none'" class="form-group">
              <label>认证密钥:</label>
              <input v-model="tunnelForm.authKey" type="password" placeholder="输入认证密钥">
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">取消</button>
            <button class="btn btn-primary" @click="saveTunnel">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClientSettingsPage',
  data() {
    return {
      tunnels: [],
      showEditModal: false,
      editingTunnel: null,
      tunnelForm: {
        name: '',
        localAddress: '',
        remoteAddress: '',
        remotePort: '',
        protocol: 'tcp',
        authType: 'none',
        authKey: ''
      },
      // 启动进度相关数据
      startingTunnelId: null,
      startProgress: 0,
      startProgressMessage: '',
      startError: null
    }
  },
  async mounted() {
    await this.loadTunnels()
    
    // 监听隧道状态更新事件
    window.electronAPI?.onTunnelStatusUpdated((event, data) => {
      console.log('收到隧道状态更新:', data);
      // 刷新隧道列表以更新状态显示
      this.loadTunnels();
    });
    
    // 监听隧道启动进度事件
    window.electronAPI?.onTunnelStartProgress((event, data) => {
      console.log('收到隧道启动进度:', data);
      this.handleTunnelStartProgress(data);
    });
  },
  
  beforeUnmount() {
    // 移除事件监听器，避免内存泄漏
    window.electronAPI?.removeTunnelStatusUpdatedListener?.();
    window.electronAPI?.removeTunnelStartProgressListener?.();
  },
  methods: {
    // 处理隧道启动进度
    handleTunnelStartProgress(data) {
      if (data.tunnelId === this.startingTunnelId) {
        this.startProgress = data.progress;
        this.startProgressMessage = data.message;
        
        if (data.error) {
          this.startError = data.message;
          // 错误时显示通知并自动关闭进度显示
          this.showNotification('隧道启动失败', data.message, 'error');
          setTimeout(() => {
            this.resetStartProgress();
          }, 3000);
        } else if (data.progress === 100) {
          // 完成时显示通知并自动关闭进度显示
          const tunnel = this.tunnels.find(t => t.id === this.startingTunnelId);
          const tunnelName = tunnel ? tunnel.name : '隧道';
          this.showNotification('隧道启动成功', `隧道"${tunnelName}"已启动`, 'success');
          setTimeout(() => {
            this.resetStartProgress();
            this.loadTunnels(); // 刷新隧道列表
          }, 1000);
        }
      }
    },
    
    // 重置启动进度状态
    resetStartProgress() {
      this.startingTunnelId = null;
      this.startProgress = 0;
      this.startProgressMessage = '';
      this.startError = null;
    },
    
    // 取消启动进度显示
    cancelStartProgress() {
      this.resetStartProgress();
    },
    
    // 显示通知的通用方法
    showNotification(title, message, type = 'info') {
      // 使用Element Plus的通知组件，添加偏移量避免与头部重合
      this.$notify({
        title: title,
        message: message,
        type: type,
        duration: 3000,
        position: 'top-right',
        offset: 40 
      })
    },
    // 加载隧道数据
    async loadTunnels() {
      try {
        const result = await window.electronAPI.tunnel.getAll()
        if (result.error) {
          console.error('加载隧道失败:', result.error)
          return
        }
        this.tunnels = result
      } catch (error) {
        console.error('加载隧道失败:', error)
      }
    },
    
    getStatusText(status) {
      const statusMap = {
        running: '运行中',
        stopped: '已停止',
        error: '错误'
      }
      return statusMap[status] || '未知'
    },
    
    addNewTunnel() {
      this.editingTunnel = null
      this.tunnelForm = {
        name: '',
        localAddress: '',
        remoteAddress: '',
        remotePort: '',
        protocol: 'tcp',
        authType: 'none',
        authKey: ''
      }
      this.showEditModal = true
    },
    
    editTunnel(tunnelId) {
      const tunnel = this.tunnels.find(t => t.id === tunnelId)
      if (tunnel) {
        this.editingTunnel = tunnel
        this.tunnelForm = { ...tunnel }
        this.showEditModal = true
      }
    },
    
    closeModal() {
      this.showEditModal = false
      this.editingTunnel = null
    },
    
    async saveTunnel() {
      if (!this.tunnelForm.name || !this.tunnelForm.localAddress || !this.tunnelForm.remoteAddress || !this.tunnelForm.remotePort) {
        this.showNotification('输入错误', '请填写完整的隧道信息', 'error')
        return
      }
      
      try {
        let result
        // 创建可序列化的数据副本
        const serializableData = JSON.parse(JSON.stringify(this.tunnelForm))
        
        if (this.editingTunnel) {
          // 更新现有隧道
          result = await window.electronAPI.tunnel.update(this.editingTunnel.id, serializableData)
        } else {
          // 添加新隧道
          result = await window.electronAPI.tunnel.add(serializableData)
        }
        
        if (result.error) {
          console.error('保存隧道失败:', result.error)
          this.showNotification('保存失败', result.error, 'error')
          return
        }
        
        await this.loadTunnels()
        this.closeModal()
        this.showNotification('保存成功', `隧道"${this.tunnelForm.name}"已保存`, 'success')
      } catch (error) {
        console.error('保存隧道失败:', error)
        this.showNotification('保存失败', error.message, 'error')
      }
    },
    
    async startTunnel(tunnelId) {
      try {
        // 显示启动进度
        this.startingTunnelId = tunnelId;
        this.startProgress = 0;
        this.startProgressMessage = '正在启动隧道...';
        this.startError = null;
        
        const result = await window.electronAPI.tunnel.start(tunnelId)
        if (result.error) {
          console.error('启动隧道失败:', result.error)
          this.showNotification('启动失败', result.error, 'error')
          this.startError = result.error;
          return
        }
        
        // 进度会在handleTunnelStartProgress中自动更新
        // 完成时自动关闭进度显示并刷新列表
        
      } catch (error) {
        console.error('启动隧道失败:', error)
        this.showNotification('启动失败', error.message, 'error')
        this.startError = error.message;
      }
    },
    
    async stopTunnel(tunnelId) {
      try {
        const result = await window.electronAPI.tunnel.stop(tunnelId)
        if (result.error) {
          console.error('停止隧道失败:', result.error)
          this.showNotification('停止失败', result.error, 'error')
          return
        }
        await this.loadTunnels()
        const tunnel = this.tunnels.find(t => t.id === tunnelId)
        this.showNotification('隧道停止', `隧道"${tunnel.name}"已停止`, 'warning')
      } catch (error) {
        console.error('停止隧道失败:', error)
        this.showNotification('停止失败', error.message, 'error')
      }
    },
    
    async deleteTunnel(tunnelId) {
      const tunnel = this.tunnels.find(t => t.id === tunnelId)
      if (tunnel && confirm(`确定要删除隧道"${tunnel.name}"吗？`)) {
        try {
          const result = await window.electronAPI.tunnel.delete(tunnelId)
          if (result.error) {
            console.error('删除隧道失败:', result.error)
            this.showNotification('删除失败', result.error, 'error')
            return
          }
          await this.loadTunnels()
          this.showNotification('删除成功', `隧道"${tunnel.name}"已删除`, 'info')
        } catch (error) {
          console.error('删除隧道失败:', error)
          this.showNotification('删除失败', error.message, 'error')
        }
      }
    },
    
    async copyConnectionAddress(tunnel) {
      try {
        // 从远程地址中提取 server_addr
        const remoteAddress = tunnel.remoteAddress || ''
        const serverAddr = this.extractServerAddr(remoteAddress)
        const remotePort = tunnel.remotePort || ''
        
        if (!serverAddr || !remotePort) {
          this.showNotification('复制失败', '连接地址信息不完整', 'error')
          return
        }
        
        const connectionAddress = `${serverAddr}:${remotePort}`
        
        // 使用现代浏览器的 Clipboard API
        await navigator.clipboard.writeText(connectionAddress)
        this.showNotification('复制成功', `连接地址 "${connectionAddress}" 已复制到剪贴板`, 'success')
      } catch (error) {
        console.error('复制连接地址失败:', error)
        // 降级方案：使用传统方法
        try {
          const remoteAddress = tunnel.remoteAddress || ''
          const serverAddr = this.extractServerAddr(remoteAddress)
          const remotePort = tunnel.remotePort || ''
          const connectionAddress = `${serverAddr}:${remotePort}`
          
          // 创建临时文本区域
          const textArea = document.createElement('textarea')
          textArea.value = connectionAddress
          textArea.style.position = 'fixed'
          textArea.style.opacity = '0'
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          
          this.showNotification('复制成功', `连接地址 "${connectionAddress}" 已复制到剪贴板`, 'success')
        } catch (fallbackError) {
          console.error('降级复制方法也失败:', fallbackError)
          this.showNotification('复制失败', '无法复制连接地址', 'error')
        }
      }
    },
    
    extractServerAddr(remoteAddress) {
      // 从远程地址中提取 server_addr
      // 如果远程地址包含端口，则只取IP部分
      if (!remoteAddress) return ''
      
      // 移除协议前缀（如果有）
      let address = remoteAddress
      if (address.includes('://')) {
        address = address.split('://')[1]
      }
      
      // 如果包含端口，只取IP部分
      if (address.includes(':')) {
        address = address.split(':')[0]
      }
      
      return address
    }
  }
}
</script>

<style scoped>
.content-section {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.page-header h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 2em;
}

.page-header p {
  color: #7f8c8d;
  margin: 5px 0 0 0;
  font-size: 1.1em;
}

.tunnels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.tunnel-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.tunnel-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.tunnel-card.active {
  border-left: 4px solid #2ecc71;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2em;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 500;
}

.status-indicator.running {
  background: #e8f8f0;
  color: #27ae60;
}

.status-indicator.stopped {
  background: #f8f9fa;
  color: #7f8c8d;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.running .status-dot {
  background: #2ecc71;
  animation: pulse 2s infinite;
}

.status-indicator.stopped .status-dot {
  background: #95a5a6;
}

.tunnel-info {
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.info-item .label {
  color: #7f8c8d;
  font-weight: 500;
}

.info-item .value {
  color: #2c3e50;
  font-family: 'Courier New', monospace;
}

.info-item .protocol {
  background: #3498db;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8em;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.8em;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-success {
  background: #2ecc71;
  color: white;
}

.btn-success:hover {
  background: #27ae60;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-outline {
  background: transparent;
  border: 1px solid #bdc3c7;
  color: #7f8c8d;
}

.btn-outline:hover {
  background: #f8f9fa;
  border-color: #95a5a6;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.add-new-card {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #bdc3c7;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-new-card:hover {
  border-color: #3498db;
  background: #e3f2fd;
}

.add-new-content {
  text-align: center;
  color: #7f8c8d;
}

.add-icon {
  font-size: 2em;
  display: block;
  margin-bottom: 8px;
}

.add-text {
  font-weight: 500;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
    background: white;
    border-radius: 16px;
    width: 500px;
    max-width: 90vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
    position: relative;
    overflow: hidden;
  }

  .modal-scroll {
    flex: 1;
    overflow-y: auto;
    /* 启用平滑滚动 */
    scroll-behavior: smooth;
    /* 为滚动容器本身也添加圆角 */
    border-radius: 16px;
  }
  
  /* 自定义滚动条样式 - WebKit浏览器 */
  .modal-scroll::-webkit-scrollbar {
    width: 6px;
  }
  
  .modal-scroll::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  .modal-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;
    transition: background-color 0.2s ease;
  }
  
  .modal-scroll::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
  
  /* 自定义滚动条样式 - Firefox */
  .modal-scroll {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f1f1f1;
  }

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25em;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.75em;
  cursor: pointer;
  color: #95a5a6;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  line-height: 1;
  height: 32px;
  width: 32px;
}

.modal-close:hover {
  background: #f8f9fa;
  color: #e74c3c;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.95em;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95em;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background-color: #ffffff;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* 添加输入框占位符样式 */
.form-group input::placeholder,
.form-group select::placeholder {
  color: #bdc3c7;
}

/* 改善select下拉框样式 */
.form-group select {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%237f8c8d' viewBox='0 0 16 16'%3E%3Cpath d='M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  appearance: none;
}

.modal-footer {
  padding: 20px 24px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 响应式设计增强 */
@media (max-width: 768px) {
  .modal-content {
    width: 95vw;
    max-width: 95vw;
    margin: 20px;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
  }
  
  .modal-footer button {
    width: 100%;
  }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* 启动进度显示样式 */
.start-progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.start-progress-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

.progress-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25em;
  font-weight: 600;
}

.progress-close {
  background: none;
  border: none;
  font-size: 1.75em;
  cursor: pointer;
  color: #95a5a6;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  line-height: 1;
  height: 32px;
  width: 32px;
}

.progress-close:hover {
  background: #f8f9fa;
  color: #e74c3c;
}

.progress-body {
  padding: 24px;
}

.progress-bar-container {
  background: #f0f0f0;
  border-radius: 10px;
  height: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.progress-bar {
  background: linear-gradient(90deg, #3498db, #2ecc71);
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: #7f8c8d;
  font-size: 0.95em;
  margin-bottom: 8px;
}

.progress-error {
  text-align: center;
  color: #e74c3c;
  font-size: 0.9em;
  background: #ffeaea;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 8px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>