/**
 * @file api_server.js
 * @brief RESTful API 服务器
 * @description 提供 HTTP 接口供外部调用嵌入式代码生成服务
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { runPipeline } from './src/pipeline.js';
import { checkAvailableTools } from './src/pdf_converter.js';
import { taskManager, TaskStatus } from './src/task_manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// 服务器配置
// ============================================================================

const app = express();
const PORT = process.env.PORT || 8080;
const API_VERSION = 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

// 创建必要的目录
const tempDir = path.join(__dirname, 'temp');
const outputDir = path.join(__dirname, 'out');
await fs.ensureDir(tempDir);
await fs.ensureDir(outputDir);

// ============================================================================
// 中间件配置
// ============================================================================

// CORS 配置 - 允许跨域请求
app.use(cors({
    origin: '*', // 生产环境应限制具体域名
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON 解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 文件上传配置
const upload = multer({
    dest: tempDir,
    storage: multer.diskStorage({
        destination: tempDir,
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const filename = Date.now() + '-' + Math.random().toString(36).substring(7) + ext;
            cb(null, filename);
        }
    }),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 5
    }
});

// ============================================================================
// API 路由
// ============================================================================

/**
 * GET /api/v1/health
 * 健康检查接口
 */
app.get(`${API_PREFIX}/health`, (req, res) => {
    res.json({
        status: 'ok',
        service: 'Embedded AI Code Generator',
        version: API_VERSION,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * GET /api/v1/status
 * 系统状态检查
 */
app.get(`${API_PREFIX}/status`, async (req, res) => {
    try {
        const tools = await checkAvailableTools();
        // 检查环境变量或 qwen_api.js 中的硬编码值
        const qwenApiKey = process.env.QWEN_API_KEY || 'sk-0f4bf35cd5ea468794a24920026dbb9c';
        const qwenConfigured = qwenApiKey && qwenApiKey !== '<PUT_YOUR_KEY_HERE>' ? '已配置' : '未配置';
        
        res.json({
            status: 'ok',
            system: {
                qwen_api: qwenConfigured,
                pdf_converter: {
                    imagemagick: tools.imageMagick,
                    ghostscript: tools.ghostscript,
                    available: tools.canConvert
                },
                node_version: process.version,
                platform: process.platform
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * POST /api/v1/generate
 * 主代码生成接口 - 支持文件上传
 * 
 * Request:
 *   - datasheet: 数据手册文件 (PDF) (multipart/form-data)
 *   - schematic: 原理图文件 (PNG/JPG/PDF) (multipart/form-data) ✨ 新增 PDF 支持
 *   - instruction: 代码生成需求 (form field)
 * 
 * 注意：原理图现已支持 PDF 格式，适用于 OpenWebUI 等不支持图片上传的平台
 *      系统会自动将 PDF 转换为图片后进行 OCR 识别
 * 
 * Response:
 *   {
 *     "status": "success",
 *     "generated_code": "...",
 *     "metadata": { "..." }
 *   }
 */
app.post(
    `${API_PREFIX}/generate`,
    upload.fields([
        { name: 'datasheet', maxCount: 1 },
        { name: 'schematic', maxCount: 1 }
    ]),
    async (req, res) => {
        const startTime = Date.now();
        let datasheetFile = null;
        let schematicFile = null;

        try {
            // 验证请求
            if (!req.files || (!req.files.datasheet && !req.files.schematic)) {
                return res.status(400).json({
                    status: 'error',
                    message: '至少需要提供 datasheet 或 schematic 文件'
                });
            }

            if (!req.body.instruction) {
                return res.status(400).json({
                    status: 'error',
                    message: '缺少 instruction 参数'
                });
            }

            // 获取上传的文件
            datasheetFile = req.files.datasheet ? req.files.datasheet[0] : null;
            schematicFile = req.files.schematic ? req.files.schematic[0] : null;
            const instruction = req.body.instruction;

            // 详细的请求日志
            const requestId = Date.now();
            console.log(`\n${'='.repeat(70)}`);
            console.log(`[API] 📥 New Request Received (ID: ${requestId})`);
            console.log(`${'='.repeat(70)}`);
            console.log(`[API] 📋 Request Details:`);
            console.log(`[API]   • Client IP: ${req.ip || req.connection.remoteAddress}`);
            console.log(`[API]   • Timestamp: ${new Date().toISOString()}`);
            console.log(`[API]   • User-Agent: ${req.get('User-Agent')?.substring(0, 50) || 'Unknown'}`);
            
            console.log(`\n[API] 📁 Uploaded Files:`);
            if (datasheetFile) {
                console.log(`[API]   ✓ Datasheet:`);
                console.log(`[API]     - Name: ${datasheetFile.originalname}`);
                console.log(`[API]     - Size: ${(datasheetFile.size / 1024).toFixed(2)} KB`);
                console.log(`[API]     - Type: ${datasheetFile.mimetype}`);
                console.log(`[API]     - Temp path: ${datasheetFile.path}`);
            } else {
                console.log(`[API]   ✗ Datasheet: Not provided`);
            }
            
            if (schematicFile) {
                console.log(`[API]   ✓ Schematic:`);
                console.log(`[API]     - Name: ${schematicFile.originalname}`);
                console.log(`[API]     - Size: ${(schematicFile.size / 1024).toFixed(2)} KB`);
                console.log(`[API]     - Type: ${schematicFile.mimetype}`);
                console.log(`[API]     - Format: ${path.extname(schematicFile.originalname).toUpperCase()}`);
                console.log(`[API]     - Temp path: ${schematicFile.path}`);
            } else {
                console.log(`[API]   ✗ Schematic: Not provided`);
            }
            
            console.log(`\n[API] 📝 Instruction:`);
            console.log(`[API]   • Length: ${instruction.length} characters`);
            console.log(`[API]   • Preview: ${instruction.substring(0, 150)}${instruction.length > 150 ? '...' : ''}`);
            console.log(`${'='.repeat(70)}\n`);

            // 生成输出文件名
            const outputFilename = `generated_${Date.now()}.c`;
            const outputPath = path.join(outputDir, outputFilename);

            // 运行代码生成 Pipeline
            const result = await runPipeline({
                datasheet: datasheetFile ? datasheetFile.path : null,
                schematic: schematicFile ? schematicFile.path : null,
                instruction: instruction,
                outputPath: outputPath
            });

            // 读取生成的代码
            const generatedCode = await fs.readFile(outputPath, 'utf-8');

            // 清理临时文件
            console.log(`[API] 🧹 Cleaning up temporary files...`);
            if (datasheetFile) {
                await fs.remove(datasheetFile.path);
                console.log(`[API]   ✓ Removed: ${datasheetFile.path}`);
            }
            if (schematicFile) {
                await fs.remove(schematicFile.path);
                console.log(`[API]   ✓ Removed: ${schematicFile.path}`);
            }

            const elapsed = Date.now() - startTime;

            // 详细的成功日志
            console.log(`\n${'='.repeat(70)}`);
            console.log(`[API] ✅ Request Completed Successfully (ID: ${requestId})`);
            console.log(`${'='.repeat(70)}`);
            console.log(`[API] 📊 Generation Statistics:`);
            console.log(`[API]   • Total processing time: ${elapsed}ms (${(elapsed/1000).toFixed(2)}s)`);
            console.log(`[API]   • Registers extracted: ${result.extracted_data?.registers?.registers?.length || 0}`);
            console.log(`[API]   • Pin mappings found: ${result.extracted_data?.pin_mappings?.pin_mappings?.length || 0}`);
            console.log(`[API]   • Generated code size: ${generatedCode.length} characters`);
            console.log(`[API]   • Generated code lines: ${generatedCode.split('\n').length}`);
            console.log(`[API]   • Output file: ${outputFilename}`);
            console.log(`[API] 📤 Sending response to client...`);
            console.log(`${'='.repeat(70)}\n`);

            // 返回结果
            res.json({
                status: 'success',
                generated_code: generatedCode,
                metadata: {
                    datasheet_name: datasheetFile ? datasheetFile.originalname : null,
                    schematic_name: schematicFile ? schematicFile.originalname : null,
                    instruction: instruction,
                    output_filename: outputFilename,
                    registers_count: result.extracted_data?.registers?.length || 0,
                    pin_mappings_count: result.extracted_data?.pin_mappings?.length || 0,
                    processing_time_ms: elapsed,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            const requestId = Date.now();
            console.error(`\n${'='.repeat(70)}`);
            console.error(`[API] ❌ Request Failed (ID: ${requestId})`);
            console.error(`${'='.repeat(70)}`);
            console.error(`[API] 🔴 Error Details:`);
            console.error(`[API]   • Type: ${error.name}`);
            console.error(`[API]   • Message: ${error.message}`);
            console.error(`[API]   • Stack trace:`);
            error.stack.split('\n').slice(0, 5).forEach(line => {
                console.error(`[API]     ${line}`);
            });
            console.error(`${'='.repeat(70)}\n`);

            // 清理临时文件
            if (datasheetFile) await fs.remove(datasheetFile.path).catch(() => {});
            if (schematicFile) await fs.remove(schematicFile.path).catch(() => {});

            res.status(500).json({
                status: 'error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * POST /api/v1/generate/async
 * 异步代码生成接口 - 立即返回任务ID，后台处理
 * 
 * Request:
 *   - datasheet: 数据手册文件 (PDF) (multipart/form-data)
 *   - schematic: 原理图文件 (PNG/JPG/PDF) (multipart/form-data)
 *   - instruction: 代码生成需求 (form field)
 * 
 * Response:
 *   {
 *     "status": "accepted",
 *     "task_id": "task_1705312845123_abc123",
 *     "message": "Task accepted and queued for processing",
 *     "estimated_time": "60-180 seconds",
 *     "poll_url": "/api/v1/tasks/task_1705312845123_abc123"
 *   }
 */
app.post(
    `${API_PREFIX}/generate/async`,
    upload.fields([
        { name: 'datasheet', maxCount: 1 },
        { name: 'schematic', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            // 验证请求
            if (!req.files || (!req.files.datasheet && !req.files.schematic)) {
                return res.status(400).json({
                    status: 'error',
                    message: '至少需要提供 datasheet 或 schematic 文件'
                });
            }

            if (!req.body.instruction) {
                return res.status(400).json({
                    status: 'error',
                    message: '缺少 instruction 参数'
                });
            }

            // 获取上传的文件
            const datasheetFile = req.files.datasheet ? req.files.datasheet[0] : null;
            const schematicFile = req.files.schematic ? req.files.schematic[0] : null;
            const instruction = req.body.instruction;

            console.log(`\n${'='.repeat(70)}`);
            console.log(`[API] 📥 Async Request Received`);
            console.log(`${'='.repeat(70)}`);
            console.log(`[API] 📋 Request Details:`);
            console.log(`[API]   • Mode: Async`);
            console.log(`[API]   • Client IP: ${req.ip || req.connection.remoteAddress}`);
            console.log(`[API]   • Timestamp: ${new Date().toISOString()}`);
            if (datasheetFile) {
                console.log(`[API]   • Datasheet: ${datasheetFile.originalname} (${(datasheetFile.size / 1024).toFixed(2)} KB)`);
            }
            if (schematicFile) {
                console.log(`[API]   • Schematic: ${schematicFile.originalname} (${(schematicFile.size / 1024).toFixed(2)} KB)`);
            }
            console.log(`[API]   • Instruction: ${instruction.substring(0, 100)}${instruction.length > 100 ? '...' : ''}`);
            console.log(`${'='.repeat(70)}\n`);

            // 生成输出文件名
            const outputFilename = `generated_${Date.now()}.c`;
            const outputPath = path.join(outputDir, outputFilename);

            // 创建任务
            const taskId = taskManager.createTask({
                datasheet: datasheetFile ? datasheetFile.path : null,
                schematic: schematicFile ? schematicFile.path : null,
                instruction: instruction,
                outputPath: outputPath,
                tempFiles: [
                    datasheetFile ? datasheetFile.path : null,
                    schematicFile ? schematicFile.path : null
                ].filter(Boolean),
                client_info: {
                    ip: req.ip || req.connection.remoteAddress,
                    user_agent: req.get('User-Agent')
                }
            });

            console.log(`[API] ✅ Task created and queued: ${taskId}`);
            console.log(`[API]   • Poll URL: ${API_PREFIX}/tasks/${taskId}`);
            console.log(`[API]   • Result URL: ${API_PREFIX}/tasks/${taskId}/result\n`);

            // 立即返回任务ID
            res.status(202).json({
                status: 'accepted',
                task_id: taskId,
                message: 'Task accepted and queued for processing',
                estimated_time: '60-180 seconds',
                poll_url: `${API_PREFIX}/tasks/${taskId}`,
                result_url: `${API_PREFIX}/tasks/${taskId}/result`,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error(`[API] ❌ Async request failed: ${error.message}`);
            res.status(500).json({
                status: 'error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * GET /api/v1/tasks/:task_id
 * 查询任务状态和进度
 * 
 * Response:
 *   {
 *     "task_id": "task_123",
 *     "status": "processing",
 *     "progress": {
 *       "current_step": 2,
 *       "total_steps": 3,
 *       "step_name": "Parsing schematic",
 *       "percentage": 60
 *     },
 *     "created_at": "2024-01-15T10:30:45.123Z",
 *     "started_at": "2024-01-15T10:30:46.456Z",
 *     ...
 *   }
 */
app.get(`${API_PREFIX}/tasks/:task_id`, (req, res) => {
    const { task_id } = req.params;
    const task = taskManager.getTask(task_id);

    if (!task) {
        return res.status(404).json({
            status: 'error',
            message: 'Task not found',
            task_id: task_id
        });
    }

    // 返回任务信息（不包含完整结果）
    const response = {
        task_id: task.task_id,
        status: task.status,
        progress: task.progress,
        created_at: task.created_at,
        updated_at: task.updated_at,
        started_at: task.started_at,
        completed_at: task.completed_at
    };

    // 如果任务完成，添加结果摘要
    if (task.status === TaskStatus.COMPLETED) {
        response.result_available = true;
        response.result_url = `${API_PREFIX}/tasks/${task_id}/result`;
        response.result_summary = {
            registers_count: task.result?.extracted_data?.registers?.length || 0,
            pin_mappings_count: task.result?.extracted_data?.pin_mappings?.length || 0,
            code_lines: task.result?.generated_code_lines || 0,
            processing_time: task.completed_at ? 
                `${Math.round((new Date(task.completed_at) - new Date(task.started_at)) / 1000)}s` : null
        };
    }

    // 如果任务失败，添加错误信息
    if (task.status === TaskStatus.FAILED) {
        response.error = task.error;
    }

    res.json(response);
});

/**
 * GET /api/v1/tasks/:task_id/result
 * 下载任务结果（生成的代码）
 * 
 * Response:
 *   {
 *     "status": "success",
 *     "task_id": "task_123",
 *     "generated_code": "...",
 *     "metadata": { ... }
 *   }
 */
app.get(`${API_PREFIX}/tasks/:task_id/result`, async (req, res) => {
    const { task_id } = req.params;
    const task = taskManager.getTask(task_id);

    if (!task) {
        return res.status(404).json({
            status: 'error',
            message: 'Task not found',
            task_id: task_id
        });
    }

    if (task.status === TaskStatus.PENDING || task.status === TaskStatus.PROCESSING) {
        return res.status(425).json({
            status: 'error',
            message: 'Task not yet completed',
            task_status: task.status,
            progress: task.progress,
            retry_after: 10 // 建议10秒后重试
        });
    }

    if (task.status === TaskStatus.FAILED) {
        return res.status(500).json({
            status: 'error',
            message: 'Task failed',
            error: task.error
        });
    }

    // 任务已完成，返回结果
    try {
        // 如果请求下载文件格式
        if (req.query.download === 'file') {
            const outputPath = task.result.output_path;
            const filename = path.basename(outputPath);
            
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            const fileStream = fs.createReadStream(outputPath);
            fileStream.pipe(res);
        } else {
            // 返回 JSON 格式
            res.json({
                status: 'success',
                task_id: task.task_id,
                generated_code: task.result.generated_code,
                metadata: {
                    output_filename: path.basename(task.result.output_path),
                    registers_count: task.result?.extracted_data?.registers?.length || 0,
                    pin_mappings_count: task.result?.extracted_data?.pin_mappings?.length || 0,
                    code_lines: task.result.generated_code.split('\n').length,
                    code_size: task.result.generated_code.length,
                    processing_time: task.completed_at ? 
                        `${Math.round((new Date(task.completed_at) - new Date(task.started_at)) / 1000)}s` : null,
                    created_at: task.created_at,
                    completed_at: task.completed_at
                }
            });
        }
    } catch (error) {
        console.error(`[API] ❌ Error retrieving task result: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve task result',
            error: error.message
        });
    }
});

/**
 * GET /api/v1/tasks
 * 获取任务列表
 * 
 * Query Parameters:
 *   - status: 过滤状态 (pending|processing|completed|failed)
 *   - limit: 限制数量 (默认 20)
 * 
 * Response:
 *   {
 *     "tasks": [...],
 *     "stats": {
 *       "total": 10,
 *       "pending": 2,
 *       "processing": 1,
 *       "completed": 6,
 *       "failed": 1
 *     }
 *   }
 */
app.get(`${API_PREFIX}/tasks`, (req, res) => {
    const { status, limit } = req.query;
    
    const filters = {
        status: status || undefined,
        limit: limit ? parseInt(limit) : 20
    };

    const tasks = taskManager.getTasks(filters);
    const stats = taskManager.getStats();

    // 返回简化的任务信息
    const simplifiedTasks = tasks.map(task => ({
        task_id: task.task_id,
        status: task.status,
        progress: task.progress,
        created_at: task.created_at,
        updated_at: task.updated_at,
        completed_at: task.completed_at,
        duration: task.started_at && task.completed_at ? 
            `${Math.round((new Date(task.completed_at) - new Date(task.started_at)) / 1000)}s` : null
    }));

    res.json({
        tasks: simplifiedTasks,
        stats: stats,
        timestamp: new Date().toISOString()
    });
});

/**
 * DELETE /api/v1/tasks/:task_id
 * 删除任务和结果
 * 
 * Response:
 *   {
 *     "status": "success",
 *     "message": "Task deleted",
 *     "task_id": "task_123"
 *   }
 */
app.delete(`${API_PREFIX}/tasks/:task_id`, (req, res) => {
    const { task_id } = req.params;

    try {
        const deleted = taskManager.deleteTask(task_id);
        
        if (!deleted) {
            return res.status(404).json({
                status: 'error',
                message: 'Task not found',
                task_id: task_id
            });
        }

        res.json({
            status: 'success',
            message: 'Task deleted',
            task_id: task_id,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message,
            task_id: task_id
        });
    }
});

/**
 * POST /api/v1/generate/url
 * 通过 URL 生成代码（不需要上传文件）
 * 
 * Request Body:
 *   {
 *     "datasheet_url": "http://example.com/datasheet.pdf",
 *     "schematic_url": "http://example.com/schematic.png",
 *     "instruction": "初始化代码"
 *   }
 */
app.post(`${API_PREFIX}/generate/url`, async (req, res) => {
    const startTime = Date.now();

    try {
        const { datasheet_url, schematic_url, instruction } = req.body;

        if (!datasheet_url && !schematic_url) {
            return res.status(400).json({
                status: 'error',
                message: '至少需要提供 datasheet_url 或 schematic_url'
            });
        }

        if (!instruction) {
            return res.status(400).json({
                status: 'error',
                message: '缺少 instruction 参数'
            });
        }

        // 下载文件
        const axios = (await import('axios')).default;
        let datasheetPath = null;
        let schematicPath = null;

        if (datasheet_url) {
            const datasheetResponse = await axios.get(datasheet_url, { responseType: 'arraybuffer' });
            datasheetPath = path.join(tempDir, `datasheet_${Date.now()}.pdf`);
            await fs.writeFile(datasheetPath, datasheetResponse.data);
        }

        if (schematic_url) {
            const schematicResponse = await axios.get(schematic_url, { responseType: 'arraybuffer' });
            const ext = path.extname(new URL(schematic_url).pathname) || '.pdf';
            schematicPath = path.join(tempDir, `schematic_${Date.now()}${ext}`);
            await fs.writeFile(schematicPath, schematicResponse.data);
        }

        // 生成代码
        const outputFilename = `generated_${Date.now()}.c`;
        const outputPath = path.join(outputDir, outputFilename);

        const result = await runPipeline({
            datasheet: datasheetPath,
            schematic: schematicPath,
            instruction: instruction,
            outputPath: outputPath
        });

        const generatedCode = await fs.readFile(outputPath, 'utf-8');

        // 清理临时文件
        if (datasheetPath) await fs.remove(datasheetPath);
        if (schematicPath) await fs.remove(schematicPath);

        const elapsed = Date.now() - startTime;

        res.json({
            status: 'success',
            generated_code: generatedCode,
            metadata: {
                datasheet_url: datasheet_url,
                schematic_url: schematic_url,
                instruction: instruction,
                output_filename: outputFilename,
                processing_time_ms: elapsed,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[API] 错误:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/v1/analyze/datasheet
 * 仅分析数据手册
 */
app.post(
    `${API_PREFIX}/analyze/datasheet`,
    upload.single('datasheet'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    status: 'error',
                    message: '缺少 datasheet 文件'
                });
            }

            const { extractText } = await import('./src/ocr.js');
            const { callTextModel } = await import('./src/qwen_api.js');
            const { readFile } = await import('fs/promises');

            // 提取文本
            const text = await extractText(req.file.path);
            
            // 提取寄存器
            const prompt = await readFile(path.join(__dirname, 'prompts', 'extract_registers.txt'), 'utf-8');
            const result = await callTextModel(prompt + '\n\n' + text, { temperature: 0.3 });

            // 清理临时文件
            await fs.remove(req.file.path);

            res.json({
                status: 'success',
                data: JSON.parse(result),
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('[API] 错误:', error);
            if (req.file) await fs.remove(req.file.path).catch(() => {});
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
);

/**
 * POST /api/v1/analyze/schematic
 * 仅分析原理图
 */
app.post(
    `${API_PREFIX}/analyze/schematic`,
    upload.single('schematic'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    status: 'error',
                    message: '缺少 schematic 文件'
                });
            }

            const { extractAsImage, isImage } = await import('./src/ocr.js');
            const { callVisionModel } = await import('./src/qwen_api.js');
            const { readFile } = await import('fs/promises');

            const prompt = await readFile(path.join(__dirname, 'prompts', 'parse_schematic.txt'), 'utf-8');

            let result;
            if (isImage(req.file.path)) {
                const imageBuffer = await extractAsImage(req.file.path);
                result = await callVisionModel(imageBuffer, prompt, { temperature: 0.3 });
            } else {
                return res.status(400).json({
                    status: 'error',
                    message: '仅支持图片格式的原理图'
                });
            }

            // 清理临时文件
            await fs.remove(req.file.path);

            res.json({
                status: 'success',
                data: JSON.parse(result),
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('[API] 错误:', error);
            if (req.file) await fs.remove(req.file.path).catch(() => {});
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/v1/docs
 * API 文档
 */
app.get(`${API_PREFIX}/docs`, (req, res) => {
    res.json({
        service: 'Embedded AI Code Generator API',
        version: API_VERSION,
        endpoints: [
            {
                path: '/api/v1/health',
                method: 'GET',
                description: '健康检查',
                response: { status: 'ok', timestamp: '...' }
            },
            {
                path: '/api/v1/status',
                method: 'GET',
                description: '系统状态检查',
                response: { status: 'ok', system: '{ tools: {...}, qwenApiKey: "..." }' }
            },
            {
                path: '/api/v1/generate',
                method: 'POST',
                description: '生成嵌入式代码（文件上传）',
                content_type: 'multipart/form-data',
                parameters: {
                    datasheet: '数据手册文件 (可选)',
                    schematic: '原理图文件 (可选)',
                    instruction: '代码生成需求 (必需)'
                },
                response: {
                    status: 'success',
                    generated_code: '...',
                    metadata: '{ ... }'
                }
            },
            {
                path: '/api/v1/generate/url',
                method: 'POST',
                description: '通过 URL 生成代码',
                content_type: 'application/json',
                body: {
                    datasheet_url: 'http://...',
                    schematic_url: 'http://...',
                    instruction: '...'
                }
            },
            {
                path: '/api/v1/analyze/datasheet',
                method: 'POST',
                description: '仅分析数据手册',
                content_type: 'multipart/form-data',
                parameters: { datasheet: '数据手册文件' }
            },
            {
                path: '/api/v1/analyze/schematic',
                method: 'POST',
                description: '仅分析原理图',
                content_type: 'multipart/form-data',
                parameters: { schematic: '原理图文件' }
            }
        ],
        examples: {
            curl: {
                generate: `curl -X POST http://localhost:${PORT}${API_PREFIX}/generate \\
  -F "datasheet=@datasheet.pdf" \\
  -F "schematic=@schematic.png" \\
  -F "instruction=生成GPIO初始化代码"`,
                
                url: `curl -X POST http://localhost:${PORT}${API_PREFIX}/generate/url \\
  -H "Content-Type: application/json" \\
  -d '{"datasheet_url":"http://example.com/ds.pdf","instruction":"初始化"}'`
            }
        }
    });
});

// 根路径重定向到文档
app.get('/', (req, res) => {
    res.redirect(`${API_PREFIX}/docs`);
});

// ============================================================================
// 错误处理
// ============================================================================

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `API endpoint not found: ${req.method} ${req.url}`,
        available_endpoints: `${API_PREFIX}/docs`
    });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('[API] 未捕获的错误:', err);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// ============================================================================
// 启动服务器
// ============================================================================

app.listen(PORT, async () => {
    // 获取系统状态
    const tools = await checkAvailableTools();
    const qwenConfigured = process.env.QWEN_API_KEY ? true : false;
    
    // ANSI 颜色代码
    const colors = {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        cyan: '\x1b[36m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        red: '\x1b[31m'
    };
    
    const { cyan, green, yellow, blue, magenta, reset, bright, red } = colors;
    
    // 清屏（可选）
    // console.clear();
    
    // ASCII 艺术字标题
    console.log('\n');
    console.log(`${cyan}${bright}╔═══════════════════════════════════════════════════════════════════════╗${reset}`);
    console.log(`${cyan}${bright}║                                                                       ║${reset}`);
    console.log(`${cyan}${bright}║${reset}     ${magenta}${bright}███████╗███╗   ███╗██████╗ ███████╗██████╗ ██████╗ ███████╗██████╗${reset}      ${cyan}${bright}║${reset}`);
    console.log(`${cyan}${bright}║${reset}     ${magenta}${bright}██╔════╝████╗ ████║██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝██╔══██╗${reset}     ${cyan}${bright}║${reset}`);
    console.log(`${cyan}${bright}║${reset}     ${magenta}${bright}█████╗  ██╔████╔██║██████╔╝█████╗  ██║  ██║██║  ██║█████╗  ██║  ██║${reset}     ${cyan}${bright}║${reset}`);
    console.log(`${cyan}${bright}║${reset}     ${magenta}${bright}██╔══╝  ██║╚██╔╝██║██╔══██╗██╔══╝  ██║  ██║██║  ██║██╔══╝  ██║  ██║${reset}     ${cyan}${bright}║${reset}`);
    console.log(`${cyan}${bright}║${reset}     ${magenta}${bright}███████╗██║ ╚═╝ ██║██████╔╝███████╗██████╔╝██████╔╝███████╗██████╔╝${reset}     ${cyan}${bright}║${reset}`);
    console.log(`${cyan}${bright}║${reset}     ${magenta}${bright}╚══════╝╚═╝     ╚═╝╚═════╝ ╚══════╝╚═════╝ ╚═════╝ ╚══════╝╚═════╝${reset}      ${cyan}${bright}║${reset}`);
    console.log(`${cyan}${bright}║${reset}                                                                       ${cyan}${bright}║${reset}`);
    console.log(`${cyan}${bright}║${reset}              ${blue}${bright}🤖 AI-Powered Embedded Code Generator API 🚀${reset}              ${cyan}${bright}║${reset}`);
    console.log(`${cyan}${bright}║${reset}                                                                       ${cyan}${bright}║${reset}`);
    console.log(`${cyan}${bright}╚═══════════════════════════════════════════════════════════════════════╝${reset}`);
    console.log('\n');
    
    // 服务器信息
    console.log(`${green}${bright}┌─────────────────────────────────────────────────────────────────────┐${reset}`);
    console.log(`${green}${bright}│  🌐 SERVER INFORMATION${reset}                                              ${green}${bright}│${reset}`);
    console.log(`${green}${bright}├─────────────────────────────────────────────────────────────────────┤${reset}`);
    console.log(`${green}${bright}│${reset}  ${bright}🚀 Status:${reset}         ${green}RUNNING${reset}                                          ${green}${bright}│${reset}`);
    console.log(`${green}${bright}│${reset}  ${bright}🔗 URL:${reset}            ${blue}http://localhost:${PORT}${reset}                             ${green}${bright}│${reset}`);
    console.log(`${green}${bright}│${reset}  ${bright}📦 Version:${reset}        ${yellow}${API_VERSION}${reset}                                             ${green}${bright}│${reset}`);
    console.log(`${green}${bright}│${reset}  ${bright}⏰ Started:${reset}        ${new Date().toLocaleString('zh-CN')}                  ${green}${bright}│${reset}`);
    console.log(`${green}${bright}└─────────────────────────────────────────────────────────────────────┘${reset}`);
    console.log('\n');
    
    // API 端点
    console.log(`${yellow}${bright}┌─────────────────────────────────────────────────────────────────────┐${reset}`);
    console.log(`${yellow}${bright}│  📚 QUICK ACCESS ENDPOINTS${reset}                                          ${yellow}${bright}│${reset}`);
    console.log(`${yellow}${bright}├─────────────────────────────────────────────────────────────────────┤${reset}`);
    console.log(`${yellow}${bright}│${reset}  ${bright}📖 Documentation:${reset}  ${cyan}http://localhost:${PORT}${API_PREFIX}/docs${reset}              ${yellow}${bright}│${reset}`);
    console.log(`${yellow}${bright}│${reset}  ${bright}💚 Health Check:${reset}   ${cyan}http://localhost:${PORT}${API_PREFIX}/health${reset}            ${yellow}${bright}│${reset}`);
    console.log(`${yellow}${bright}│${reset}  ${bright}🔧 System Status:${reset}  ${cyan}http://localhost:${PORT}${API_PREFIX}/status${reset}            ${yellow}${bright}│${reset}`);
    console.log(`${yellow}${bright}│${reset}  ${bright}🚀 Main Endpoint:${reset}  ${cyan}POST http://localhost:${PORT}${API_PREFIX}/generate${reset}     ${yellow}${bright}│${reset}`);
    console.log(`${yellow}${bright}└─────────────────────────────────────────────────────────────────────┘${reset}`);
    console.log('\n');
    
    // 系统状态
    console.log(`${blue}${bright}┌─────────────────────────────────────────────────────────────────────┐${reset}`);
    console.log(`${blue}${bright}│  🔍 SYSTEM STATUS${reset}                                                   ${blue}${bright}│${reset}`);
    console.log(`${blue}${bright}├─────────────────────────────────────────────────────────────────────┤${reset}`);
    console.log(`${blue}${bright}│${reset}  ${bright}🔑 Qwen API:${reset}       ${qwenConfigured ? `${green}✓ Configured${reset}` : `${red}✗ Not Configured${reset}`}                              ${blue}${bright}│${reset}`);
    console.log(`${blue}${bright}│${reset}  ${bright}🖼️  PDF→Image:${reset}     ${tools.pdfSupported ? `${green}✓ Available (${tools.pdfTool})${reset}` : `${red}✗ Not Available${reset}`}                ${blue}${bright}│${reset}`);
    console.log(`${blue}${bright}│${reset}  ${bright}📝 OCR Engine:${reset}     ${tools.ocrSupported ? `${green}✓ Available (${tools.ocrTool})${reset}` : `${red}✗ Not Available${reset}`}                ${blue}${bright}│${reset}`);
    console.log(`${blue}${bright}└─────────────────────────────────────────────────────────────────────┘${reset}`);
    console.log('\n');
    
    // 快速开始指南
    console.log(`${magenta}${bright}┌─────────────────────────────────────────────────────────────────────┐${reset}`);
    console.log(`${magenta}${bright}│  💡 QUICK START EXAMPLES${reset}                                            ${magenta}${bright}│${reset}`);
    console.log(`${magenta}${bright}├─────────────────────────────────────────────────────────────────────┤${reset}`);
    console.log(`${magenta}${bright}│${reset}                                                                       ${magenta}${bright}│${reset}`);
    console.log(`${magenta}${bright}│${reset}  ${bright}1️⃣  查看 API 文档:${reset}                                                  ${magenta}${bright}│${reset}`);
    console.log(`${magenta}${bright}│${reset}      ${cyan}Start-Process "http://localhost:${PORT}${API_PREFIX}/docs"${reset}           ${magenta}${bright}│${reset}`);
    console.log(`${magenta}${bright}│${reset}                                                                       ${magenta}${bright}│${reset}`);
    console.log(`${magenta}${bright}│${reset}  ${bright}2️⃣  测试健康检查:${reset}                                                  ${magenta}${bright}│${reset}`);
    console.log(`${magenta}${bright}│${reset}      ${cyan}curl http://localhost:${PORT}${API_PREFIX}/health${reset}                  ${magenta}${bright}│${reset}`);
    console.log(`${magenta}${bright}│${reset}                                                                       ${magenta}${bright}│${reset}`);
    console.log(`${magenta}${bright}│${reset}  ${bright}3️⃣  运行测试脚本:${reset}                                                  ${magenta}${bright}│${reset}`);
    console.log(`${magenta}${bright}│${reset}      ${cyan}npm run test-api${reset}                                            ${magenta}${bright}│${reset}`);
    console.log(`${magenta}${bright}│${reset}                                                                       ${magenta}${bright}│${reset}`);
    console.log(`${magenta}${bright}│${reset}  ${bright}4️⃣  上传文件生成代码:${reset}                                              ${magenta}${bright}│${reset}`);
    console.log(`${magenta}${bright}│${reset}      ${cyan}参考 API_QUICKSTART.md 中的示例${reset}                            ${magenta}${bright}│${reset}`);
    console.log(`${magenta}${bright}│${reset}                                                                       ${magenta}${bright}│${reset}`);
    console.log(`${magenta}${bright}└─────────────────────────────────────────────────────────────────────┘${reset}`);
    console.log('\n');
    
    // 警告信息
    if (!qwenConfigured) {
        console.log(`${red}${bright}⚠️  WARNING: QWEN_API_KEY 环境变量未配置！${reset}`);
        console.log(`${red}   某些功能可能无法正常工作。请配置后重启服务器。${reset}\n`);
    }
    
    if (!tools.pdfSupported) {
        console.log(`${yellow}${bright}💡 TIP: 安装 Ghostscript 或 Poppler 以支持 PDF 自动转换${reset}`);
        console.log(`${yellow}   详见: PDF_AUTO_CONVERT_GUIDE.md${reset}\n`);
    }
    
    // 底部提示
    console.log(`${cyan}${bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);
    console.log(`${bright}  ✨ Server ready! Press ${red}Ctrl+C${reset}${bright} to stop.${reset}`);
    console.log(`${cyan}${bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);
    console.log('\n');
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，正在关闭服务器...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n收到 SIGINT 信号，正在关闭服务器...');
    process.exit(0);
});
