<template>
  <div class="server-settings-page">
    <div class="page-header">
      <h2>FRPS服务器配置管理</h2>
      <button class="btn btn-primary" @click="addNewConfig">
        <i class="fas fa-plus"></i> 添加配置
      </button>
    </div>

    <div class="configs-list">
      <div v-for="config in configs" :key="config.id" class="config-card">
        <div class="config-header">
          <div class="config-info">
            <h3>{{ config.name }}</h3>
            <div class="config-details">
              <span class="port-info">监听端口: {{ config.bindPort }}</span>
              <span class="auth-info">认证方式: {{ getAuthMethodText(config.authMethod) }}</span>
              <span class="status" :class="config.status">
                {{ getStatusText(config.status) }}
              </span>
            </div>
          </div>
          <div class="config-actions">
            <button v-if="config.status === 'stopped'" class="btn btn-success" @click="startConfig(config.id)">
              <i class="fas fa-play"></i> 启动
            </button>
            <button v-if="config.status === 'running'" class="btn btn-warning" @click="stopConfig(config.id)">
              <i class="fas fa-stop"></i> 停止
            </button>
            <button class="btn btn-info" @click="viewTomlContent(config.id)">
              <i class="fas fa-code"></i> 查看配置
            </button>
            <button class="btn btn-secondary" @click="editConfig(config.id)">
              <i class="fas fa-edit"></i> 编辑
            </button>
            <button class="btn btn-danger" @click="deleteConfig(config.id)">
              <i class="fas fa-trash"></i> 删除
            </button>
          </div>
        </div>
        <div class="config-meta">
          <span>创建时间: {{ formatDate(config.createdAt) }}</span>
          <span v-if="config.updatedAt">更新时间: {{ formatDate(config.updatedAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 配置编辑模态框 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingConfig ? '编辑FRPS配置' : '添加FRPS配置' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>配置名称:</label>
            <input v-model="configForm.name" type="text" placeholder="输入配置名称">
          </div>
          
          <div class="form-group">
            <label>监听端口:</label>
            <input v-model="configForm.bindPort" type="number" placeholder="7000" min="1" max="65535">
          </div>
          
          <div class="form-group">
            <label>认证方式:</label>
            <select v-model="configForm.authMethod">
              <option value="none">无认证</option>
              <option value="token">Token认证</option>
            </select>
          </div>
          
          <div v-if="configForm.authMethod === 'token'" class="form-group">
            <label>认证令牌:</label>
            <input v-model="configForm.authToken" type="text" placeholder="输入认证令牌">
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveConfig">保存</button>
        </div>
      </div>
    </div>

    <!-- TOML内容查看模态框 -->
    <div v-if="showTomlModal" class="modal-overlay" @click="closeTomlModal">
      <div class="modal-content toml-modal" @click.stop>
        <div class="modal-header">
          <h3>frps.toml 配置内容</h3>
          <button class="close-btn" @click="closeTomlModal">&times;</button>
        </div>
        
        <div class="modal-body">
          <pre class="toml-content">{{ tomlContent }}</pre>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeTomlModal">关闭</button>
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
      configs: [],
      showEditModal: false,
      showTomlModal: false,
      editingConfig: null,
      tomlContent: '',
      configForm: {
        name: '',
        bindPort: 7000,
        authMethod: 'none',
        authToken: ''
      }
    }
  },
  mounted() {
    this.loadConfigs()
  },
  methods: {
    async loadConfigs() {
      try {
        this.configs = await window.electronAPI.frpsConfig.getAll()
      } catch (error) {
        this.showNotification('加载配置失败', error.message, 'error')
      }
    },

    getAuthMethodText(method) {
      const methodMap = {
        none: '无认证',
        token: 'Token认证'
      }
      return methodMap[method] || '未知'
    },

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

    formatDate(dateString) {
      if (!dateString) return ''
      return new Date(dateString).toLocaleString('zh-CN')
    },

    addNewConfig() {
      this.editingConfig = null
      this.configForm = {
        name: '',
        bindPort: 7000,
        authMethod: 'none',
        authToken: ''
      }
      this.showEditModal = true
    },

    editConfig(configId) {
      const config = this.configs.find(c => c.id === configId)
      if (config) {
        this.editingConfig = config
        this.configForm = { 
          name: config.name,
          bindPort: config.bindPort,
          authMethod: config.authMethod,
          authToken: config.authToken || ''
        }
        this.showEditModal = true
      }
    },

    closeModal() {
      this.showEditModal = false
      this.editingConfig = null
    },

    async saveConfig() {
      try {
        // 清理配置数据，移除不必要的字段
        const cleanConfig = {
          name: this.configForm.name,
          bindPort: this.configForm.bindPort,
          authMethod: this.configForm.authMethod,
          authToken: this.configForm.authToken
        };

        const validation = await window.electronAPI.frpsConfig.validate(cleanConfig)
        if (!validation.isValid) {
          this.showNotification('输入错误', validation.errors.join(', '), 'error')
          return
        }

        if (this.editingConfig) {
          // 更新现有配置
          await window.electronAPI.frpsConfig.update(this.editingConfig.id, cleanConfig)
          this.showNotification('保存成功', `配置"${this.configForm.name}"已更新`, 'success')
        } else {
          // 添加新配置
          await window.electronAPI.frpsConfig.add(cleanConfig)
          this.showNotification('保存成功', `配置"${this.configForm.name}"已创建`, 'success')
        }
        
        await this.loadConfigs()
        this.closeModal()
      } catch (error) {
        this.showNotification('保存失败', error.message, 'error')
      }
    },

    async startConfig(configId) {
      try {
        const result = await window.electronAPI.frpsConfig.start(configId)
        if (result.success) {
          this.showNotification('启动成功', `配置"${result.config.name}"已启动`, 'success')
          await this.loadConfigs()
        }
      } catch (error) {
        this.showNotification('启动失败', error.message, 'error')
      }
    },

    async stopConfig(configId) {
      try {
        const result = await window.electronAPI.frpsConfig.stop(configId)
        if (result.success) {
          this.showNotification('停止成功', `配置"${result.config.name}"已停止`, 'warning')
          await this.loadConfigs()
        }
      } catch (error) {
        this.showNotification('停止失败', error.message, 'error')
      }
    },

    async deleteConfig(configId) {
      const config = this.configs.find(c => c.id === configId)
      if (!config) return

      if (confirm(`确定要删除配置"${config.name}"吗？`)) {
        try {
          const success = await window.electronAPI.frpsConfig.delete(configId)
          if (success) {
            this.showNotification('删除成功', `配置"${config.name}"已删除`, 'info')
            await this.loadConfigs()
          }
        } catch (error) {
          this.showNotification('删除失败', error.message, 'error')
        }
      }
    },

    async viewTomlContent(configId) {
      try {
        const content = await window.electronAPI.frpsConfig.getTomlContent(configId)
        if (content) {
          this.tomlContent = content
          this.showTomlModal = true
        }
      } catch (error) {
        this.showNotification('获取配置内容失败', error.message, 'error')
      }
    },

    closeTomlModal() {
      this.showTomlModal = false
      this.tomlContent = ''
    },

    showNotification(title, message, type = 'info') {
      // 使用Element Plus的通知组件
      if (this.$notify) {
        this.$notify({
          title: title,
          message: message,
          type: type
        })
      } else {
        // 备用方案：使用浏览器原生通知
        console.log(`${type}: ${title} - ${message}`)
      }
    }
  }
}
</script>

<style scoped>
.server-settings-page {
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

.page-header h2 {
  color: #2c3e50;
  margin: 0;
  font-size: 2em;
}

.configs-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.config-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.config-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.config-info h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1.3em;
}

.config-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.port-info, .auth-info {
  font-size: 0.9em;
  color: #7f8c8d;
}

.status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 500;
  margin-top: 5px;
}

.status.running {
  background: #d4edda;
  color: #155724;
}

.status.stopped {
  background: #f8d7da;
  color: #721c24;
}

.status.error {
  background: #f8d7da;
  color: #721c24;
}

.status.starting, .status.stopping {
  background: #fff3cd;
  color: #856404;
}

.config-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.config-meta {
  font-size: 0.8em;
  color: #95a5a6;
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8em;
  font-weight: 500;
  transition: all 0.2s ease;
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

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover {
  background: #e67e22;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
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

.modal-content.toml-modal {
  width: 600px;
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

.close-btn {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
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
  font-size: 1em;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.toml-content {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 15px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  line-height: 1.5;
  color: #2c3e50;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .server-settings-page {
    padding: 15px;
  }
  
  .configs-list {
    grid-template-columns: 1fr;
  }
  
  .config-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .config-actions .btn {
    width: 100%;
    justify-content: center;
  }
  
  .modal-content {
    width: 95vw;
  }
}
</style>