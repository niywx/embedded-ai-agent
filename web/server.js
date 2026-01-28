/**
 * @file server.js
 * @brief Web UI 后端服务器
 * @description 提供 Web 界面和 API 接口
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { runPipeline } from '../src/pipeline.js';

// ES Module 中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Express 应用配置
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3000;

// 配置文件上传 - 保留文件扩展名
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = path.join(__dirname, '..', 'temp');
        fs.ensureDirSync(tempDir);
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        // 保留原始文件扩展名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    }
});

// 静态文件服务
app.use(express.static(__dirname));
app.use(express.json());

// ============================================================================
// 路由
// ============================================================================

/**
 * 首页
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * API: 代码生成
 */
app.post('/api/generate', upload.fields([
    { name: 'datasheet', maxCount: 1 },
    { name: 'schematic', maxCount: 1 }
]), async (req, res) => {
    console.log('\n[Server] Received code generation request');

    try {
        // 检查文件
        if (!req.files || !req.files.datasheet || !req.files.schematic) {
            return res.status(400).json({
                status: 'error',
                error_message: 'Missing required files'
            });
        }

        // 检查指令
        if (!req.body.instruction) {
            return res.status(400).json({
                status: 'error',
                error_message: 'Missing instruction'
            });
        }

        const datasheetFile = req.files.datasheet[0];
        const schematicFile = req.files.schematic[0];
        const instruction = req.body.instruction;

        console.log(`[Server] Datasheet: ${datasheetFile.originalname}`);
        console.log(`[Server] Schematic: ${schematicFile.originalname}`);
        console.log(`[Server] Instruction: ${instruction}`);

        // 运行 Pipeline
        const result = await runPipeline({
            datasheet: datasheetFile.path,
            schematic: schematicFile.path,
            instruction: instruction,
            outputPath: path.join(__dirname, '..', 'out', 'web_generated.c')
        });

        // 清理临时文件
        await fs.remove(datasheetFile.path);
        await fs.remove(schematicFile.path);

        // 返回结果
        if (result.status === 'success') {
            const generatedCode = await fs.readFile(result.generated_code_path, 'utf-8');
            res.json({
                status: 'success',
                generated_code: generatedCode,
                metadata: {
                    registers: result.extracted_data.registers,
                    pin_mappings: result.extracted_data.pin_mappings,
                    elapsed: result.elapsed
                }
            });
        } else {
            res.status(500).json(result);
        }

    } catch (error) {
        console.error('[Server] Error:', error);
        res.status(500).json({
            status: 'error',
            error_message: error.message
        });
    }
});

/**
 * API: 健康检查
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// ============================================================================
// 启动服务器
// ============================================================================

app.listen(PORT, () => {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║   Embedded AI Agent - Web Server        ║');
    console.log('╚═══════════════════════════════════════════╝\n');
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📝 Open http://localhost:${PORT} in your browser\n`);
    console.log('Press Ctrl+C to stop the server\n');
});

// ============================================================================
// 错误处理
// ============================================================================

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
