<template>
  <div class="content-section">
    <div class="page-header">
      <h1>隧道管理</h1>
      <p>管理您的隧道连接和配置</p>
      <button class="btn btn-primary" @click="addNewTunnel">
        <span class="btn-icon">+</span>
        添加新隧道
      </button>
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
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="websocket">WebSocket</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>认证方式:</label>
            <select v-model="tunnelForm.authType">
              <option value="none">无认证</option>
              <option value="token">Token认证</option>
              <option value="basic">基本认证</option>
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
</template>

<script>
export default {
  name: 'ClientSettingsPage',
  data() {
    return {
      tunnels: [
        {
          id: 1,
          name: 'Web服务隧道',
          localAddress: '127.0.0.1:8080',
          remoteAddress: 'web.example.com:80',
          protocol: 'http',
          status: 'running',
          authType: 'token',
          createdAt: '2024-01-15 10:30:00'
        },
        {
          id: 2,
          name: '数据库隧道',
          localAddress: '127.0.0.1:3306',
          remoteAddress: 'db.example.com:3306',
          protocol: 'tcp',
          status: 'stopped',
          authType: 'none',
          createdAt: '2024-01-10 14:20:00'
        },
        {
          id: 3,
          name: 'API服务隧道',
          localAddress: '127.0.0.1:3000',
          remoteAddress: 'api.example.com:443',
          protocol: 'https',
          status: 'running',
          authType: 'basic',
          createdAt: '2024-01-08 09:15:00'
        }
      ],
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
      }
    }
  },
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
      }
    }
  },
  async mounted() {
    await this.loadTunnels()
  },
  methods: {
    // 显示通知的通用方法
    showNotification(title, message, type = 'info') {
      // 使用Element Plus的通知组件
      this.$notify({
        title: title,
        message: message,
        type: type,
        duration: 3000,
        position: 'top-right'
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
        const result = await window.electronAPI.tunnel.start(tunnelId)
        if (result.error) {
          console.error('启动隧道失败:', result.error)
          this.showNotification('启动失败', result.error, 'error')
          return
        }
        await this.loadTunnels()
        const tunnel = this.tunnels.find(t => t.id === tunnelId)
        this.showNotification('隧道启动', `隧道"${tunnel.name}"已启动`, 'success')
      } catch (error) {
        console.error('启动隧道失败:', error)
        this.showNotification('启动失败', error.message, 'error')
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
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #7f8c8d;
}

.modal-close:hover {
  color: #e74c3c;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9em;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>