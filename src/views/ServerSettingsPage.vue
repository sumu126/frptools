<template>
  <div class="content-section">
    <div class="page-header">
      <h1>服务管理</h1>
      <p>管理您的服务实例和配置</p>
      <button class="btn btn-primary" @click="addNewService">
        <span class="btn-icon">+</span>
        创建新服务
      </button>
    </div>
    
    <!-- 服务列表 -->
    <div class="services-grid">
      <div 
        v-for="service in services" 
        :key="service.id"
        class="service-card"
        :class="{ active: service.status === 'running' }"
      >
        <div class="card-header">
          <h3>{{ service.name }}</h3>
          <div class="status-indicator" :class="service.status">
            <span class="status-dot"></span>
            <span class="status-text">{{ getStatusText(service.status) }}</span>
          </div>
        </div>
        
        <div class="service-info">
          <div class="info-item">
            <span class="label">监听地址:</span>
            <span class="value">{{ service.listenAddress }}</span>
          </div>
          <div class="info-item">
            <span class="label">服务类型:</span>
            <span class="value type">{{ service.type }}</span>
          </div>
          <div class="info-item">
            <span class="label">协议:</span>
            <span class="value protocol">{{ service.protocol }}</span>
          </div>
          <div class="info-item">
            <span class="label">连接数:</span>
            <span class="value">{{ service.connections }}</span>
          </div>
          <div class="info-item">
            <span class="label">CPU使用:</span>
            <span class="value">{{ service.cpuUsage }}%</span>
          </div>
          <div class="info-item">
            <span class="label">内存使用:</span>
            <span class="value">{{ service.memoryUsage }}MB</span>
          </div>
        </div>
        
        <div class="card-actions">
          <button 
            v-if="service.status === 'stopped'" 
            class="btn btn-success btn-sm"
            @click="startService(service.id)"
          >
            <span class="btn-icon">▶</span>
            启动
          </button>
          <button 
            v-else 
            class="btn btn-danger btn-sm"
            @click="stopService(service.id)"
          >
            <span class="btn-icon">⏹</span>
            停止
          </button>
          <button 
            class="btn btn-outline btn-sm"
            @click="editService(service.id)"
          >
            <span class="btn-icon">✏️</span>
            编辑
          </button>
          <button 
            class="btn btn-outline btn-sm"
            @click="restartService(service.id)"
          >
            <span class="btn-icon">🔄</span>
            重启
          </button>
          <button 
            class="btn btn-outline btn-sm"
            @click="deleteService(service.id)"
          >
            <span class="btn-icon">🗑️</span>
            删除
          </button>
        </div>
      </div>
      
      <!-- 添加新服务卡片 -->
      <div class="service-card add-new-card" @click="addNewService">
        <div class="add-new-content">
          <span class="add-icon">+</span>
          <span class="add-text">创建新服务</span>
        </div>
      </div>
    </div>
    
    <!-- 服务编辑模态框 -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingService ? '编辑服务' : '创建新服务' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>服务名称:</label>
            <input v-model="serviceForm.name" type="text" placeholder="输入服务名称">
          </div>
          
          <div class="form-group">
            <label>服务类型:</label>
            <select v-model="serviceForm.type">
              <option value="web">Web服务</option>
              <option value="api">API服务</option>
              <option value="database">数据库服务</option>
              <option value="file">文件服务</option>
              <option value="proxy">代理服务</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>监听地址:</label>
            <input v-model="serviceForm.listenAddress" type="text" placeholder="0.0.0.0:8080">
          </div>
          
          <div class="form-group">
            <label>协议类型:</label>
            <select v-model="serviceForm.protocol">
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="tcp">TCP</option>
              <option value="udp">UDP</option>
              <option value="websocket">WebSocket</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>最大连接数:</label>
            <input v-model="serviceForm.maxConnections" type="number" min="1" max="10000" placeholder="1000">
          </div>
          
          <div class="form-group">
            <label>启用SSL:</label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="serviceForm.enableSSL"> 启用HTTPS加密
            </label>
          </div>
          
          <div v-if="serviceForm.enableSSL" class="form-group">
            <label>SSL证书路径:</label>
            <input v-model="serviceForm.sslCertPath" type="text" placeholder="/path/to/cert.pem">
          </div>
          
          <div class="form-group">
            <label>启用认证:</label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="serviceForm.enableAuth"> 启用用户认证
            </label>
          </div>
          
          <div class="form-group">
            <label>服务描述:</label>
            <textarea v-model="serviceForm.description" placeholder="输入服务描述信息" rows="3"></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveService">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ServerSettingsPage',
  data() {
    return {
      services: [
        {
          id: 1,
          name: 'Web服务器',
          type: 'web',
          listenAddress: '0.0.0.0:8080',
          protocol: 'http',
          status: 'running',
          connections: 156,
          cpuUsage: 12.5,
          memoryUsage: 128.3,
          maxConnections: 1000,
          enableSSL: false,
          enableAuth: true,
          description: '主要Web应用服务',
          createdAt: '2024-01-15 10:30:00'
        },
        {
          id: 2,
          name: 'API网关',
          type: 'api',
          listenAddress: '0.0.0.0:3000',
          protocol: 'https',
          status: 'running',
          connections: 89,
          cpuUsage: 8.2,
          memoryUsage: 64.7,
          maxConnections: 500,
          enableSSL: true,
          enableAuth: true,
          description: 'API接口网关服务',
          createdAt: '2024-01-10 14:20:00'
        },
        {
          id: 3,
          name: '文件服务',
          type: 'file',
          listenAddress: '0.0.0.0:9000',
          protocol: 'http',
          status: 'stopped',
          connections: 0,
          cpuUsage: 0,
          memoryUsage: 0,
          maxConnections: 200,
          enableSSL: false,
          enableAuth: false,
          description: '文件上传下载服务',
          createdAt: '2024-01-08 09:15:00'
        }
      ],
      showEditModal: false,
      editingService: null,
      serviceForm: {
        name: '',
        type: 'web',
        listenAddress: '',
        protocol: 'http',
        maxConnections: 1000,
        enableSSL: false,
        sslCertPath: '',
        enableAuth: false,
        description: ''
      }
    }
  },
  mounted() {
    this.startServiceMonitoring();
  },
  beforeUnmount() {
    this.stopServiceMonitoring();
  },
  methods: {
    getStatusText(status) {
      const statusMap = {
        running: '运行中',
        stopped: '已停止',
        error: '错误',
        starting: '启动中',
        stopping: '停止中'
      }
      return statusMap[status] || '未知'
    },
    
    addNewService() {
      this.editingService = null
      this.serviceForm = {
        name: '',
        type: 'web',
        listenAddress: '',
        protocol: 'http',
        maxConnections: 1000,
        enableSSL: false,
        sslCertPath: '',
        enableAuth: false,
        description: ''
      }
      this.showEditModal = true
    },
    
    editService(serviceId) {
      const service = this.services.find(s => s.id === serviceId)
      if (service) {
        this.editingService = service
        this.serviceForm = { ...service }
        this.showEditModal = true
      }
    },
    
    closeModal() {
      this.showEditModal = false
      this.editingService = null
    },
    
    saveService() {
      if (!this.serviceForm.name || !this.serviceForm.listenAddress) {
        this.$notify({
          title: '输入错误',
          message: '请填写完整的服务信息',
          type: 'error'
        })
        return
      }
      
      if (this.editingService) {
        // 更新现有服务
        const index = this.services.findIndex(s => s.id === this.editingService.id)
        if (index !== -1) {
          this.services[index] = { 
            ...this.serviceForm, 
            id: this.editingService.id,
            status: this.editingService.status,
            connections: this.editingService.connections,
            cpuUsage: this.editingService.cpuUsage,
            memoryUsage: this.editingService.memoryUsage,
            createdAt: this.editingService.createdAt
          }
        }
      } else {
        // 添加新服务
        const newService = {
          ...this.serviceForm,
          id: Math.max(...this.services.map(s => s.id)) + 1,
          status: 'stopped',
          connections: 0,
          cpuUsage: 0,
          memoryUsage: 0,
          createdAt: new Date().toLocaleString()
        }
        this.services.push(newService)
      }
      
      this.closeModal()
      this.$notify({
        title: '保存成功',
        message: `服务"${this.serviceForm.name}"已保存`,
        type: 'success'
      })
    },
    
    startService(serviceId) {
      const service = this.services.find(s => s.id === serviceId)
      if (service) {
        service.status = 'starting'
        
        // 模拟服务启动过程
        setTimeout(() => {
          service.status = 'running'
          service.connections = Math.floor(Math.random() * 200) + 1
          this.$notify({
            title: '服务启动',
            message: `服务"${service.name}"已成功启动`,
            type: 'success'
          })
        }, 2000)
      }
    },
    
    stopService(serviceId) {
      const service = this.services.find(s => s.id === serviceId)
      if (service) {
        service.status = 'stopping'
        
        // 模拟服务停止过程
        setTimeout(() => {
          service.status = 'stopped'
          service.connections = 0
          service.cpuUsage = 0
          service.memoryUsage = 0
          this.$notify({
            title: '服务停止',
            message: `服务"${service.name}"已停止`,
            type: 'warning'
          })
        }, 1500)
      }
    },
    
    restartService(serviceId) {
      const service = this.services.find(s => s.id === serviceId)
      if (service) {
        this.stopService(serviceId)
        setTimeout(() => {
          this.startService(serviceId)
        }, 2000)
      }
    },
    
    deleteService(serviceId) {
      const service = this.services.find(s => s.id === serviceId)
      if (service && confirm(`确定要删除服务"${service.name}"吗？`)) {
        this.services = this.services.filter(s => s.id !== serviceId)
        this.$notify({
          title: '删除成功',
          message: `服务"${service.name}"已删除`,
          type: 'info'
        })
      }
    },
    
    startServiceMonitoring() {
      this.monitorInterval = setInterval(() => {
        this.services.forEach(service => {
          if (service.status === 'running') {
            // 模拟实时监控数据更新
            service.connections = Math.max(0, service.connections + Math.floor(Math.random() * 10) - 3)
            service.cpuUsage = Math.max(0, Math.min(100, service.cpuUsage + (Math.random() * 5 - 2.5)))
            service.memoryUsage = Math.max(0, service.memoryUsage + (Math.random() * 2 - 1))
          }
        })
      }, 3000)
    },
    
    stopServiceMonitoring() {
      if (this.monitorInterval) {
        clearInterval(this.monitorInterval)
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

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.service-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.service-card.active {
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

.status-indicator.starting,
.status-indicator.stopping {
  background: #fff3cd;
  color: #856404;
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

.status-indicator.starting .status-dot,
.status-indicator.stopping .status-dot {
  background: #ffc107;
  animation: pulse 1s infinite;
}

.service-info {
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

.info-item .type {
  background: #9b59b6;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8em;
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
  gap: 6px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8em;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.75em;
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
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9em;
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
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