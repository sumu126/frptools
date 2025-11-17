<template>
  <div class="wallpaper-display" :style="wallpaperStyle">
    <!-- 静态图片壁纸 -->
    <img
      v-if="wallpaper.type === 'static' && wallpaper.path"
      :src="wallpaper.path"
      class="wallpaper-image"
      @error="handleImageError"
    />
    
    <!-- 动态视频壁纸 -->
    <video
      v-if="wallpaper.type === 'dynamic' && wallpaper.path"
      :src="wallpaper.path"
      class="wallpaper-video"
      autoplay
      loop
      muted
      @error="handleVideoError"
    />
    
    <!-- 错误提示 -->
    <div v-if="error" class="wallpaper-error">
      <el-alert
        :title="error"
        type="error"
        show-icon
        :closable="false"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'WallpaperDisplay',
  props: {
    wallpaper: {
      type: Object,
      default: () => ({
        type: 'none',
        path: '',
        opacity: 1
      })
    }
  },
  data() {
    return {
      error: ''
    }
  },
  computed: {
    wallpaperStyle() {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        backgroundColor: this.wallpaper.type === 'none' ? 'transparent' : '#000'
      }
    }
  },
  watch: {
    wallpaper: {
      handler(newWallpaper) {
        this.error = ''
      },
      deep: true
    }
  },
  methods: {
    handleImageError() {
      this.error = '图片加载失败，请检查文件是否存在'
    },
    handleVideoError() {
      this.error = '视频加载失败，请检查文件是否存在'
    }
  }
}
</script>

<style scoped>
.wallpaper-display {
  overflow: hidden;
}

.wallpaper-image,
.wallpaper-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wallpaper-error {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 1000;
}
</style>