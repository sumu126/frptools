// configService.mjs
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

class ConfigService {
    /**
     * 获取应用名称（推荐方案）
     */
    getAppName() {
        // 直接使用导入的app实例
        if (app.name && app.name !== 'Electron') {
            return app.name;
        }
        
        // 回退到package.json读取
        return this.getAppNameFromPackageJson();
    }
    
    /**
     * 从package.json读取应用名称
     */
    getAppNameFromPackageJson() {
        try {
            let packagePath;
            
            if (process.env.NODE_ENV === 'development') {
                // 开发环境
                packagePath = path.join(process.cwd(), 'package.json');
            } else {
                // 生产环境
                if (process.resourcesPath) {
                    const asarPath = path.join(process.resourcesPath, 'app.asar', 'package.json');
                    packagePath = fs.existsSync(asarPath) 
                        ? asarPath 
                        : path.join(process.resourcesPath, 'app', 'package.json');
                } else {
                    packagePath = path.join(process.cwd(), 'package.json');
                }
            }
            
            if (fs.existsSync(packagePath)) {
                const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                return packageData.name || 'electron_demo';
            }
        } catch (error) {
            console.warn('从package.json获取应用名称失败:', error);
        }
        
        return 'electron_demo';
    }
}

// 创建单例实例
const configService = new ConfigService();

export { configService };