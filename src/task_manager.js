/**
 * @file task_manager.js
 * @brief 异步任务管理器
 * @description 管理后台代码生成任务的状态、队列和结果
 */

import EventEmitter from 'events';
import { runPipeline } from './pipeline.js';
import fs from 'fs-extra';
import path from 'path';

// ============================================================================
// 任务状态枚举
// ============================================================================

export const TaskStatus = {
    PENDING: 'pending',       // 等待处理
    PROCESSING: 'processing', // 正在处理
    COMPLETED: 'completed',   // 已完成
    FAILED: 'failed'          // 失败
};

// ============================================================================
// 任务管理器类
// ============================================================================

class TaskManager extends EventEmitter {
    constructor() {
        super();
        this.tasks = new Map(); // task_id -> task_info
        this.maxConcurrent = 3; // 最大并发任务数
        this.currentProcessing = 0;
        this.queue = []; // 待处理任务队列
    }

    /**
     * 创建新任务
     * @param {Object} params - 任务参数
     * @returns {string} task_id
     */
    createTask(params) {
        const taskId = this._generateTaskId();
        
        const task = {
            task_id: taskId,
            status: TaskStatus.PENDING,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            started_at: null,
            completed_at: null,
            params: params,
            result: null,
            error: null,
            progress: {
                current_step: 0,
                total_steps: 3,
                step_name: 'Initializing',
                percentage: 0
            },
            logs: []
        };

        this.tasks.set(taskId, task);
        this.queue.push(taskId);
        
        console.log(`[TaskManager] 📝 Task created: ${taskId}`);
        console.log(`[TaskManager]   • Status: ${task.status}`);
        console.log(`[TaskManager]   • Queue position: ${this.queue.length}`);
        
        // 尝试处理队列
        this._processQueue();
        
        return taskId;
    }

    /**
     * 获取任务信息
     * @param {string} taskId - 任务ID
     * @returns {Object|null} 任务信息
     */
    getTask(taskId) {
        return this.tasks.get(taskId) || null;
    }

    /**
     * 获取所有任务
     * @param {Object} filters - 过滤条件
     * @returns {Array} 任务列表
     */
    getTasks(filters = {}) {
        let tasks = Array.from(this.tasks.values());
        
        // 按状态过滤
        if (filters.status) {
            tasks = tasks.filter(t => t.status === filters.status);
        }
        
        // 按时间排序（最新的在前）
        tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // 限制数量
        if (filters.limit) {
            tasks = tasks.slice(0, filters.limit);
        }
        
        return tasks;
    }

    /**
     * 删除任务
     * @param {string} taskId - 任务ID
     * @returns {boolean} 是否成功删除
     */
    deleteTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return false;
        }

        // 如果任务正在处理中，不允许删除
        if (task.status === TaskStatus.PROCESSING) {
            throw new Error('Cannot delete task while processing');
        }

        // 删除结果文件
        if (task.result && task.result.output_path) {
            fs.remove(task.result.output_path).catch(err => {
                console.error(`[TaskManager] Failed to delete result file: ${err.message}`);
            });
        }

        // 从队列中移除
        const queueIndex = this.queue.indexOf(taskId);
        if (queueIndex > -1) {
            this.queue.splice(queueIndex, 1);
        }

        this.tasks.delete(taskId);
        console.log(`[TaskManager] 🗑️  Task deleted: ${taskId}`);
        
        return true;
    }

    /**
     * 更新任务进度
     * @param {string} taskId - 任务ID
     * @param {Object} progress - 进度信息
     */
    updateProgress(taskId, progress) {
        const task = this.tasks.get(taskId);
        if (!task) return;

        task.progress = { ...task.progress, ...progress };
        task.updated_at = new Date().toISOString();
        
        // 发送进度事件
        this.emit('progress', { task_id: taskId, progress: task.progress });
    }

    /**
     * 添加任务日志
     * @param {string} taskId - 任务ID
     * @param {string} message - 日志消息
     * @param {string} level - 日志级别
     */
    addLog(taskId, message, level = 'info') {
        const task = this.tasks.get(taskId);
        if (!task) return;

        task.logs.push({
            timestamp: new Date().toISOString(),
            level: level,
            message: message
        });

        // 限制日志数量（最多保留 100 条）
        if (task.logs.length > 100) {
            task.logs = task.logs.slice(-100);
        }
    }

    /**
     * 处理任务队列
     * @private
     */
    async _processQueue() {
        // 检查是否可以处理更多任务
        while (this.currentProcessing < this.maxConcurrent && this.queue.length > 0) {
            const taskId = this.queue.shift();
            const task = this.tasks.get(taskId);
            
            if (!task || task.status !== TaskStatus.PENDING) {
                continue;
            }

            this.currentProcessing++;
            this._processTask(taskId);
        }
    }

    /**
     * 处理单个任务
     * @private
     * @param {string} taskId - 任务ID
     */
    async _processTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) return;

        try {
            console.log(`\n${'='.repeat(70)}`);
            console.log(`[TaskManager] 🚀 Starting task: ${taskId}`);
            console.log(`${'='.repeat(70)}`);
            
            // 更新状态为处理中
            task.status = TaskStatus.PROCESSING;
            task.started_at = new Date().toISOString();
            task.updated_at = new Date().toISOString();
            this.addLog(taskId, 'Task started', 'info');

            // 更新进度：步骤 1
            this.updateProgress(taskId, {
                current_step: 1,
                step_name: 'Extracting registers',
                percentage: 10
            });

            // 运行 Pipeline
            const result = await runPipeline({
                datasheet: task.params.datasheet,
                schematic: task.params.schematic,
                instruction: task.params.instruction,
                outputPath: task.params.outputPath,
                onProgress: (step, stepName, percentage) => {
                    this.updateProgress(taskId, {
                        current_step: step,
                        step_name: stepName,
                        percentage: percentage
                    });
                    this.addLog(taskId, `Step ${step}: ${stepName} (${percentage}%)`, 'info');
                }
            });

            // 读取生成的代码
            // 优先使用 pipeline 返回的实际路径，如果没有则使用预定义路径
            const actualOutputPath = result.generated_code_path || task.params.outputPath;
            console.log(`[TaskManager] 📖 Reading generated code...`);
            console.log(`[TaskManager]   • Expected path: ${task.params.outputPath}`);
            console.log(`[TaskManager]   • Actual path: ${actualOutputPath}`);
            
            // 检查文件是否存在
            const fileExists = await fs.pathExists(actualOutputPath);
            if (!fileExists) {
                console.error(`[TaskManager] ❌ File not found: ${actualOutputPath}`);
                console.error(`[TaskManager] 🔍 Checking directory contents...`);
                
                const dir = path.dirname(actualOutputPath);
                const basename = path.basename(actualOutputPath);
                
                try {
                    const files = await fs.readdir(dir);
                    console.error(`[TaskManager] 📁 Files in ${path.basename(dir)}:`);
                    const recentGenerated = files
                        .filter(f => f.startsWith('generated_'))
                        .sort()
                        .slice(-5);
                    recentGenerated.forEach(f => {
                        console.error(`[TaskManager]   - ${f}`);
                    });
                    console.error(`[TaskManager] 🎯 Expected: ${basename}`);
                } catch (dirError) {
                    console.error(`[TaskManager] ❌ Cannot read directory: ${dirError.message}`);
                }
                
                throw new Error(`Generated file not found: ${actualOutputPath}`);
            }
            
            const generatedCode = await fs.readFile(actualOutputPath, 'utf-8');
            console.log(`[TaskManager]   ✓ File read successfully (${generatedCode.length} bytes)`);

            // 更新进度：完成
            this.updateProgress(taskId, {
                current_step: 3,
                step_name: 'Completed',
                percentage: 100
            });

            // 标记为完成
            task.status = TaskStatus.COMPLETED;
            task.completed_at = new Date().toISOString();
            task.updated_at = new Date().toISOString();
            task.result = {
                ...result,
                generated_code: generatedCode,
                output_path: actualOutputPath  // 使用实际路径
            };
            
            this.addLog(taskId, 'Task completed successfully', 'success');

            console.log(`[TaskManager] ✅ Task completed: ${taskId}`);
            console.log(`[TaskManager]   • Duration: ${this._calculateDuration(task.started_at, task.completed_at)}`);
            
            // 发送完成事件
            this.emit('completed', { task_id: taskId, result: task.result });

        } catch (error) {
            console.error(`[TaskManager] ❌ Task failed: ${taskId}`);
            console.error(`[TaskManager]   • Error: ${error.message}`);
            
            // 标记为失败
            task.status = TaskStatus.FAILED;
            task.completed_at = new Date().toISOString();
            task.updated_at = new Date().toISOString();
            task.error = {
                message: error.message,
                stack: error.stack
            };
            
            this.addLog(taskId, `Task failed: ${error.message}`, 'error');
            
            // 发送失败事件
            this.emit('failed', { task_id: taskId, error: task.error });

        } finally {
            // 清理临时文件
            if (task.params.tempFiles) {
                for (const file of task.params.tempFiles) {
                    await fs.remove(file).catch(() => {});
                }
            }

            this.currentProcessing--;
            
            // 继续处理队列
            this._processQueue();
        }
    }

    /**
     * 生成任务ID
     * @private
     * @returns {string} 任务ID
     */
    _generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    /**
     * 计算持续时间
     * @private
     * @param {string} startTime - 开始时间
     * @param {string} endTime - 结束时间
     * @returns {string} 格式化的持续时间
     */
    _calculateDuration(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMs = end - start;
        const durationSec = (durationMs / 1000).toFixed(2);
        return `${durationMs}ms (${durationSec}s)`;
    }

    /**
     * 清理过期任务（超过24小时的已完成/失败任务）
     */
    cleanupOldTasks() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24小时

        let cleanedCount = 0;
        
        for (const [taskId, task] of this.tasks.entries()) {
            // 只清理已完成或失败的任务
            if (task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.FAILED) {
                continue;
            }

            const taskAge = now - new Date(task.updated_at).getTime();
            
            if (taskAge > maxAge) {
                try {
                    this.deleteTask(taskId);
                    cleanedCount++;
                } catch (err) {
                    console.error(`[TaskManager] Failed to cleanup task ${taskId}: ${err.message}`);
                }
            }
        }

        if (cleanedCount > 0) {
            console.log(`[TaskManager] 🧹 Cleaned up ${cleanedCount} old tasks`);
        }

        return cleanedCount;
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        const stats = {
            total: this.tasks.size,
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
            queue_length: this.queue.length,
            current_processing: this.currentProcessing
        };

        for (const task of this.tasks.values()) {
            stats[task.status]++;
        }

        return stats;
    }
}

// ============================================================================
// 导出单例
// ============================================================================

export const taskManager = new TaskManager();

// 定期清理过期任务（每小时执行一次）
setInterval(() => {
    taskManager.cleanupOldTasks();
}, 60 * 60 * 1000);

export default taskManager;
