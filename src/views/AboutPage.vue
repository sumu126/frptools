<template>
  <div class="content-section">
    <h1>关于 {{ appName }}</h1>
    <div class="about-content">
      <div class="app-logo">
        <img src="@/assets/icon.png" alt="应用图标">
      </div>
      <div class="app-details">
        <p><strong>版本:</strong> 1.0.0</p>
        <p><strong>描述:</strong> 一个更好的frp工具</p>
        <p><strong>许可证:</strong> MIT</p>
        <div class="contact-info">
          <h4>发布信息</h4>
          <p>GitHub: https://github.com/sumu126/frptools</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AboutPage',
  props: {
    appName: {
      type: String,
      default: 'frptools'
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

.about-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 30px;
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
</style>