import { dialog, app } from 'electron';
import { storeManager } from '../../store/storeManager/storeManager.mjs';
import path from 'path';
import fs from 'fs';

/**
 * 壁纸服务
 */
class WallpaperService {
    constructor() {
        this.wallpaperKey = 'wallpaper-settings';
        this.opacityKey = 'window-opacity';
        this.supportedImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        this.supportedVideoTypes = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    }

    /**
     * 设置壁纸
     * @param {string} type - 壁纸类型 ('none', 'static', 'dynamic')
     * @param {string} filePath - 文件路径
     * @param {number} opacity - 透明度 (固定为1)
     * @param {BrowserWindow} mainWindow - 主窗口实例
     */
    async setWallpaper(type, filePath, opacity, mainWindow) {
        const settings = {
            type,
            path: filePath,
            opacity: 1, // 壁纸固定为不透明
            updatedAt: Date.now()
        };

        console.log('设置壁纸:', settings);

        // 验证文件
        if (type !== 'none' && filePath) {
            if (!fs.existsSync(filePath)) {
                throw new Error('文件不存在');
            }

            const ext = path.extname(filePath).toLowerCase();
            const isImage = this.supportedImageTypes.includes(ext);
            const isVideo = this.supportedVideoTypes.includes(ext);

            if (type === 'static' && !isImage) {
                throw new Error('静态壁纸只支持图片文件');
            }

            if (type === 'dynamic' && !isVideo) {
                throw new Error('动态壁纸只支持视频文件');
            }
        }

        // 应用壁纸到窗口
        if (mainWindow) {
            await this.applyWallpaperToWindow(mainWindow, type, filePath, 1);
        }

        // 保存设置
        storeManager.set(this.wallpaperKey, settings);
        console.log('壁纸设置已保存到本地存储');
        
        // 验证保存是否成功
        const saved = storeManager.get(this.wallpaperKey);
        console.log('验证保存的设置:', saved);
        
        return settings;
    }

    /**
     * 获取壁纸设置
     */
    async getWallpaper() {
        const settings = storeManager.get(this.wallpaperKey, {
            type: 'none',
            path: '',
            opacity: 1,
            updatedAt: Date.now()
        });
        return settings;
    }

    /**
     * 清除壁纸
     * @param {BrowserWindow} mainWindow - 主窗口实例
     */
    async clearWallpaper(mainWindow) {
        if (mainWindow) {
            // 清除窗口背景
            await this.applyWallpaperToWindow(mainWindow, 'none', '', 1);
        }
        storeManager.delete(this.wallpaperKey);
    }

    /**
     * 应用壁纸到窗口
     * @param {BrowserWindow} window - 窗口实例
     * @param {string} type - 壁纸类型
     * @param {string} filePath - 文件路径
     * @param {number} opacity - 透明度 (固定为1)
     */
    async applyWallpaperToWindow(window, type, filePath, opacity) {
        try {
            // 将本地文件路径转换为file://协议URL，确保渲染进程可以访问
            let wallpaperUrl = filePath;
            if (filePath && !filePath.startsWith('data:') && !filePath.startsWith('http')) {
                // 确保路径使用正斜杠，并添加file://协议前缀
                const normalizedPath = filePath.replace(/\\/g, '/');
                if (!normalizedPath.startsWith('file://')) {
                    wallpaperUrl = `file:///${normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath}`;
                }
            }

            // 发送壁纸信息到渲染进程，壁纸固定为不透明
            window.webContents.send('wallpaper-changed', {
                type,
                path: wallpaperUrl,
                opacity: 1
            });
        } catch (error) {
            console.error('应用壁纸到窗口失败:', error);
            throw error;
        }
    }

    /**
     * 设置窗口透明度
     * @param {number} opacity - 透明度 (0-1)
     */
    async setWindowOpacity(opacity) {
        if (opacity < 0.1 || opacity > 1.0) {
            throw new Error('透明度必须在0.1到1.0之间');
        }
        storeManager.set(this.opacityKey, opacity);
        
        // 验证保存是否成功
        const saved = storeManager.get(this.opacityKey);
        console.log('验证保存的透明度:', saved);
        return opacity;
    }

    /**
     * 获取窗口透明度
     */
    async getWindowOpacity() {
        return storeManager.get(this.opacityKey, 1.0); // 默认完全不透明
    }

    /**
     * 选择壁纸文件
     */
    async selectFile() {
        const result = await dialog.showOpenDialog({
            title: '选择壁纸文件',
            filters: [
                {
                    name: '图片文件',
                    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
                },
                {
                    name: '视频文件',
                    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
                },
                {
                    name: '所有支持的文件',
                    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
                }
            ],
            properties: ['openFile']
        });

        if (result.canceled || result.filePaths.length === 0) {
            throw new Error('用户取消了文件选择');
        }

        return result.filePaths[0];
    }

    /**
     * 选择图片文件
     */
    async selectImageFile() {
        const result = await dialog.showOpenDialog({
            title: '选择图片壁纸',
            filters: [
                {
                    name: '图片文件',
                    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
                }
            ],
            properties: ['openFile']
        });

        if (result.canceled || result.filePaths.length === 0) {
            throw new Error('用户取消了文件选择');
        }

        return result.filePaths[0];
    }

    /**
     * 选择视频文件
     */
    async selectVideoFile() {
        const result = await dialog.showOpenDialog({
            title: '选择MP4壁纸',
            filters: [
                {
                    name: 'MP4视频文件',
                    extensions: ['mp4']
                }
            ],
            properties: ['openFile']
        });

        if (result.canceled || result.filePaths.length === 0) {
            throw new Error('用户取消了文件选择');
        }

        return result.filePaths[0];
    }

    /**
     * 验证文件类型
     * @param {string} filePath - 文件路径
     */
    getFileType(filePath) {
        if (!filePath) return 'none';
        
        const ext = path.extname(filePath).toLowerCase();
        if (this.supportedImageTypes.includes(ext)) {
            return 'image';
        } else if (this.supportedVideoTypes.includes(ext)) {
            return 'video';
        }
        return 'unsupported';
    }
}

// 创建单例实例
const wallpaperService = new WallpaperService();

export { wallpaperService };