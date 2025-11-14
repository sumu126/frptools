# Electron 开发模板

这是一个基于 Electron + Vue 3 + TypeScript 的桌面应用开发模板，集成了开发工具链和实用的功能模块，可作为快速启动项目使用。

## 🚀 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite 7.x
- **桌面框架**: Electron 38.x
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **构建工具**: Electron Builder
- **开发工具**: Vue DevTools

## 📁 项目结构

```
ElectronDemo/
├── electron/                 # Electron 主进程代码
│   ├── main.mjs             # 主进程入口文件
│   ├── modules/             # 功能模块
│   │   ├── dialog/          # 对话框模块
│   │   ├── store/           # 数据存储模块
│   │   ├── tray/            # 系统托盘模块
│   │   ├── utils/           # 工具函数
│   │   └── windowsManager/  # 窗口管理模块
│   └── preload.cjs          # 预加载脚本
├── src/                     # 渲染进程代码
│   ├── App.vue              # 根组件
│   ├── assets/              # 静态资源
│   ├── components/          # 公共组件
│   │   └── titleBar/        # 自定义标题栏组件
│   ├── router/              # 路由配置
│   ├── stores/              # Pinia 状态管理
│   ├── views/               # 页面组件
│   └── main.ts              # 渲染进程入口
├── dist/                    # 构建输出目录
├── electron-build/          # Electron 打包输出
└── 配置文件
    ├── package.json         # 项目配置
    ├── vite.config.ts       # Vite 配置
    ├── tsconfig.json        # TypeScript 配置
    └── electron-builder.yml # 打包配置
```

## ✨ 核心特性

### 🎯 现代化开发体验
- **热重载**: 支持 Electron 和 Vue 的双向热重载
- **TypeScript**: 完整的 TypeScript 支持，提供类型安全
- **模块化架构**: 清晰的模块分离，便于维护和扩展

### 🖼️ 自定义界面
- **自定义标题栏**: 完全自定义的标题栏，支持最小化、最大化、关闭操作
- **多主题支持**: 内置多种主题样式（深色、浅色、蓝色、动态呼吸灯等）
- **响应式设计**: 适配不同屏幕尺寸

### 🔧 功能模块
- **窗口管理**: 完整的窗口生命周期管理
- **系统托盘**: 支持系统托盘图标和菜单
- **对话框**: 文件选择、消息提示等系统对话框
- **数据存储**: 基于 electron-store 的本地数据持久化
- **日志系统**: 集成 electron-log 进行应用日志记录

### 📦 打包部署
- **自动打包**: 一键构建 Windows 安装包
- **安装程序**: 支持 NSIS 安装程序，可自定义安装选项
- **自动更新**: 预留自动更新机制接口

## 🛠️ 快速开始

### 环境要求
- Node.js 20.19.0+ 或 22.12.0+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
# 启动开发服务器（同时启动 Electron 和 Vite 开发服务器）
npm run electron:dev
```

### 构建应用
```bash
# 构建渲染进程代码
npm run build

# 构建并打包 Electron 应用
npm run electron:build
```

### 类型检查
```bash
npm run type-check
```

## 🔧 开发指南

### 添加新功能模块
1. 在 `electron/modules/` 下创建新的模块目录
2. 按照现有模块结构组织代码（Controller + Service 模式）
3. 在 `initializeControllersUtils.mjs` 中注册新模块
4. 在渲染进程中通过 `window.electronAPI` 调用新功能

### 自定义标题栏
项目使用自定义标题栏组件，位于 `src/components/titleBar/`。支持：
- 应用图标和名称显示
- 窗口控制按钮（最小化、最大化、关闭）
- 主题切换
- 动态应用名称更新

### 主题系统
通过事件总线实现主题切换：
```javascript
// 发送主题更新事件
window.dispatchEvent(new CustomEvent('update-theme', { 
  detail: { theme: 'dark' } 
}))
```

### 数据存储
使用 electron-store 进行本地数据持久化：
```javascript
// 在主进程中
const store = new Store()
store.set('user.preferences', { theme: 'dark' })

// 在渲染进程中通过 API 访问
```

## 📋 可用脚本

- `npm run dev` - 仅启动 Vite 开发服务器
- `npm run electron:dev` - 启动完整的 Electron 开发环境
- `npm run build` - 构建渲染进程代码
- `npm run electron:build` - 构建并打包 Electron 应用
- `npm run preview` - 预览构建结果
- `npm run type-check` - TypeScript 类型检查

## 🔒 安全配置

- 禁用 Node.js 集成（通过预加载脚本安全地暴露 API）
- 禁用远程模块
- 配置 CSP 策略
- 窗口安全设置（禁用 nodeIntegration，启用 contextIsolation）

## 🚀 部署说明

构建完成后，安装程序位于 `electron-build/` 目录：
- `electron_demo Setup 0.0.0.exe` - Windows 安装程序
- `win-unpacked/` - 绿色版可执行文件

## 🤝 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源。

## 🙏 致谢

感谢以下开源项目：
- [Electron](https://electronjs.org/)
- [Vue.js](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Electron Builder](https://www.electron.build/)

**Demo图标：** [@秋风萧色](https://www.pixiv.net/artworks/118804796)太太的神迹
二开记得修改应用名称和图标
快去看GBC!

总结
---
这是一个自用的开发模板，您可以直接基于此项目进行功能开发，无需重复搭建基础架构。项目已经配置好了完整的开发环境和构建流程，开箱即用。