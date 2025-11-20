import { spawn } from 'child_process';
import EventEmitter from 'events';
import psList from 'ps-list';

class UniversalProcessManager extends EventEmitter {
  constructor() {
    super();
    // 存储进程信息，key为PID
    this.processes = new Map(); 
  }

  /**
   * 启动应用程序
   * @param {string} command - 要执行的命令或可执行文件路径
   * @param {Array|Object} [args=[]] - 启动参数
   * @param {Object} [options={}] - 子进程选项
   * @returns {Promise<Object>} 包含PID和进程信息的Promise
   */
  async startApplication(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // 处理参数格式
        const finalArgs = this.normalizeArgs(args);
        
        // 合并默认选项
        const spawnOptions = {
          stdio: ['pipe', 'pipe', 'pipe'],
          windowsHide: true,
          ...options
        };

        console.log(`启动应用: ${command}`, finalArgs);

        // 创建子进程
        const childProcess = spawn(command, finalArgs, spawnOptions);

        // 等待进程PID分配
        const waitForPid = () => {
          if (childProcess.pid) {
            const pid = childProcess.pid;
            
            // 进程信息对象
            const processInfo = {
              pid: pid,
              process: childProcess,
              command: command,
              args: finalArgs,
              originalArgs: args,
              options: spawnOptions,
              status: 'running',
              startTime: new Date(),
              logs: [],
              exitCode: null,
              error: null
            };

            // 存储进程信息（使用PID作为key）
            this.processes.set(pid, processInfo);

            // 设置事件监听
            this.setupProcessEventListeners(pid, childProcess);

            console.log(`应用启动成功，PID: ${pid}`);

            resolve({
              success: true,
              pid: pid,
              command: command,
              startTime: processInfo.startTime
            });

          } else {
            // 如果PID还未分配，稍后重试
            setTimeout(waitForPid, 10);
          }
        };

        // 开始等待PID
        waitForPid();

        // 进程错误处理
        childProcess.on('error', (error) => {
          reject({
            success: false,
            error: `应用启动失败: ${error.message}`,
            command: command
          });
        });

      } catch (error) {
        reject({
          success: false,
          error: `启动应用时发生错误: ${error.message}`,
          command: command
        });
      }
    });
  }

  /**
   * 关闭应用程序
   * @param {number} pid - 进程PID
   * @param {number} [timeout=5000] - 超时时间（毫秒）
   * @param {string} [signal='SIGTERM'] - 关闭信号
   * @returns {Promise<Object>} 关闭结果
   */
  async stopApplication(pid, timeout = 5000, signal = 'SIGTERM') {
    return new Promise(async (resolve) => {
      // 检查PID是否为数字
      if (typeof pid !== 'number' || isNaN(pid) || pid <= 0) {
        resolve({
          success: false,
          pid: pid,
          error: '无效的PID'
        });
        return;
      }

      const processInfo = this.processes.get(pid);
      
      if (!processInfo) {
        // 如果内存中没有记录，检查系统进程是否存在
        const exists = await this.checkProcessExists(pid);
        if (!exists) {
          resolve({
            success: false,
            pid: pid,
            error: `进程不存在 (PID: ${pid})`
          });
          return;
        }
        
        // 进程存在但不在管理中，尝试直接杀死
        resolve(await this.forceKillProcess(pid, timeout));
        return;
      }

      if (processInfo.status === 'exited' || processInfo.status === 'killed') {
        resolve({
          success: true,
          pid: pid,
          message: '进程已终止',
          alreadyStopped: true
        });
        return;
      }

      try {
        const childProcess = processInfo.process;
        
        // 更新状态
        processInfo.status = 'stopping';
        this.emit('process-stopping', pid, processInfo);

        // 发送终止信号
        const killed = childProcess.kill(signal);
        
        if (!killed) {
          // 如果kill方法失败，尝试强制杀死
          resolve(await this.forceKillProcess(pid, timeout));
          return;
        }

        // 等待进程退出
        const exitResult = await this.waitForProcessExit(pid, timeout);
        
        if (exitResult.success) {
          processInfo.status = 'exited';
          processInfo.exitCode = exitResult.code;
          
          resolve({
            success: true,
            pid: pid,
            message: `进程已正常退出，代码: ${exitResult.code}`,
            exitCode: exitResult.code
          });
        } else {
          // 超时，强制杀死
          const killResult = await this.forceKillProcess(pid, 1000);
          resolve(killResult);
        }

        this.emit('process-stopped', pid, processInfo);

      } catch (error) {
        resolve({
          success: false,
          pid: pid,
          error: `终止进程时发生错误: ${error.message}`
        });
      }
    });
  }

  /**
   * 强制杀死进程
   * @param {number} pid - 进程PID
   * @param {number} timeout - 超时时间
   * @returns {Promise<Object>} 杀死结果
   */
  async forceKillProcess(pid, timeout = 1000) {
    try {
      // 使用taskkill（Windows）或kill（Unix）命令
      const isWindows = process.platform === 'win32';
      const command = isWindows ? 'taskkill' : 'kill';
      const args = isWindows ? ['/PID', pid.toString(), '/F', '/T'] : ['-9', pid.toString()];

      const killProcess = spawn(command, args);
      
      const result = await new Promise((resolve) => {
        killProcess.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, code: code });
          } else {
            resolve({ success: false, code: code });
          }
        });
        
        killProcess.on('error', () => {
          resolve({ success: false, code: -1 });
        });
        
        setTimeout(() => resolve({ success: false, code: -1, timeout: true }), timeout);
      });

      if (result.success) {
        // 更新进程状态
        const processInfo = this.processes.get(pid);
        if (processInfo) {
          processInfo.status = 'killed';
          processInfo.exitCode = -1;
        }
        
        return {
          success: true,
          pid: pid,
          message: '进程已强制终止',
          forced: true
        };
      } else {
        return {
          success: false,
          pid: pid,
          error: `强制终止进程失败 (退出代码: ${result.code})`
        };
      }
    } catch (error) {
      return {
        success: false,
        pid: pid,
        error: `强制终止进程时发生错误: ${error.message}`
      };
    }
  }

  /**
   * 检查进程是否存在
   * @param {number} pid - 进程PID
   * @returns {Promise<boolean>} 是否存在
   */
  async checkProcessExists(pid) {
    try {
      if (process.platform === 'win32') {
        // Windows系统使用tasklist检查
        const { exec } = await import('child_process');
        return new Promise((resolve) => {
          exec(`tasklist /fi "PID eq ${pid}"`, (error, stdout) => {
            resolve(stdout.includes(pid.toString()));
          });
        });
      } else {
        // Unix系统使用ps检查
        const processList = await psList();
        return processList.some(proc => proc.pid === pid);
      }
    } catch (error) {
      console.error('检查进程存在性时出错:', error);
      return false;
    }
  }

  /**
   * 等待进程退出
   * @param {number} pid - 进程PID
   * @param {number} timeout - 超时时间
   * @returns {Promise<Object>} 退出结果
   */
  async waitForProcessExit(pid, timeout) {
    return new Promise((resolve) => {
      const processInfo = this.processes.get(pid);
      if (!processInfo) {
        resolve({ success: false, code: -1 });
        return;
      }

      const childProcess = processInfo.process;
      let timeoutId;

      const cleanup = () => {
        clearTimeout(timeoutId);
      };

      const onExit = (code) => {
        cleanup();
        resolve({ success: true, code: code });
      };

      const onTimeout = () => {
        childProcess.removeListener('exit', onExit);
        resolve({ success: false, code: -1, timeout: true });
      };

      childProcess.once('exit', onExit);
      timeoutId = setTimeout(onTimeout, timeout);
    });
  }

  /**
   * 设置进程事件监听器
   * @param {number} pid - 进程PID
   * @param {ChildProcess} childProcess - 子进程对象
   */
  setupProcessEventListeners(pid, childProcess) {
    // 捕获标准输出
    childProcess.stdout.on('data', (data) => {
      this.handleProcessOutput(pid, 'stdout', data);
    });

    // 捕获错误输出
    childProcess.stderr.on('data', (data) => {
      this.handleProcessOutput(pid, 'stderr', data);
    });

    // 进程退出处理
    childProcess.on('close', (code) => {
      this.handleProcessExit(pid, code);
    });

    childProcess.on('error', (error) => {
      this.handleProcessError(pid, error);
    });
  }

  /**
   * 获取进程信息
   * @param {number} pid - 进程PID
   * @returns {Object|null} 进程信息
   */
  getProcessInfo(pid) {
    const processInfo = this.processes.get(pid);
    if (!processInfo) return null;

    return {
      pid: processInfo.pid,
      command: processInfo.command,
      args: [...processInfo.args],
      status: processInfo.status,
      startTime: processInfo.startTime,
      exitCode: processInfo.exitCode,
      logCount: processInfo.logs.length
    };
  }

  /**
   * 获取所有运行的进程
   * @returns {Array} 进程信息数组
   */
  getRunningProcesses() {
    const result = [];
    this.processes.forEach((processInfo) => {
      if (processInfo.status === 'running') {
        result.push(this.getProcessInfo(processInfo.pid));
      }
    });
    return result;
  }

  /**
   * 标准化参数格式
   */
  normalizeArgs(args) {
    if (Array.isArray(args)) {
      return args.map(arg => String(arg));
    }
    
    if (args && typeof args === 'object') {
      const argsArray = [];
      for (const [key, value] of Object.entries(args)) {
        if (value === true || value === null || value === undefined) {
          argsArray.push(`--${key}`);
        } else if (value === false) {
          continue;
        } else if (key.length === 1) {
          argsArray.push(`-${key}`, String(value));
        } else {
          argsArray.push(`--${key}`, String(value));
        }
      }
      return argsArray;
    }
    
    return [];
  }

  /**
   * 处理进程输出
   */
  handleProcessOutput(pid, type, data) {
    const processInfo = this.processes.get(pid);
    if (!processInfo) return;

    const logEntry = {
      timestamp: new Date(),
      type: type,
      data: data.toString().trim()
    };

    processInfo.logs.push(logEntry);
    
    // 限制日志数量
    if (processInfo.logs.length > 1000) {
      processInfo.logs = processInfo.logs.slice(-500);
    }

    this.emit('process-output', pid, logEntry);
  }

  /**
   * 处理进程退出
   */
  handleProcessExit(pid, code) {
    const processInfo = this.processes.get(pid);
    if (!processInfo) return;

    processInfo.status = 'exited';
    processInfo.exitCode = code;
    processInfo.endTime = new Date();

    this.emit('process-exited', pid, processInfo);
    
    // 进程退出后从进程管理中删除，释放内存
    this.processes.delete(pid);
    console.log(`进程 ${pid} 信息已从内存中清理，释放资源`);
  }

  /**
   * 处理进程错误
   */
  handleProcessError(pid, error) {
    const processInfo = this.processes.get(pid);
    if (!processInfo) return;

    processInfo.status = 'error';
    processInfo.error = error;
    processInfo.endTime = new Date();

    this.emit('process-error', pid, processInfo, error);
  }
}

export default UniversalProcessManager;