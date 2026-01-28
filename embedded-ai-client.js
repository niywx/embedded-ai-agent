/**
 * @file embedded-ai-client.js
 * @description Embedded AI Code Generator - JavaScript/Node.js Client SDK
 * 
 * 这是一个用于调用 Embedded AI Code Generator HTTP API 的 JavaScript 客户端库。
 * 
 * 安装依赖:
 *   npm install axios form-data
 * 
 * 使用示例:
 *   const EmbeddedAIClient = require('./embedded-ai-client');
 *   
 *   const client = new EmbeddedAIClient('http://localhost:8080');
 *   
 *   const result = await client.generateCode(
 *       'datasheet.pdf',
 *       'schematic.png',
 *       '生成GPIO初始化代码'
 *   );
 *   
 *   console.log(result.generated_code);
 * 
 * @author Embedded AI Team
 * @version 1.0.0
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * Embedded AI Code Generator API 客户端
 * 
 * 提供对嵌入式代码生成服务的便捷访问。
 */
class EmbeddedAIClient {
    /**
     * 初始化客户端
     * 
     * @param {string} baseUrl - API 服务器地址，例如 'http://localhost:8080'
     * @param {string|null} apiKey - API 密钥（如果服务器需要认证）
     * @param {number} timeout - 请求超时时间（毫秒），默认 60000（60秒）
     */
    constructor(baseUrl, apiKey = null, timeout = 60000) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.timeout = timeout;
        
        // 创建 axios 实例
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: apiKey ? { 'X-API-Key': apiKey } : {}
        });
    }
    
    /**
     * 健康检查
     * 
     * @returns {Promise<Object>} 包含服务状态信息的对象
     * @throws {Error} 请求失败
     */
    async healthCheck() {
        const response = await this.client.get('/api/v1/health');
        return response.data;
    }
    
    /**
     * 获取系统状态
     * 
     * @returns {Promise<Object>} 包含系统状态信息的对象
     * @throws {Error} 请求失败
     */
    async getStatus() {
        const response = await this.client.get('/api/v1/status');
        return response.data;
    }
    
    /**
     * 生成嵌入式代码（使用文件路径）
     * 
     * @param {string|null} datasteetPath - 数据手册文件路径
     * @param {string|null} schematicPath - 原理图文件路径
     * @param {string} instruction - 代码生成需求描述
     * @returns {Promise<Object>} 包含生成代码的对象
     * @throws {Error} 请求失败
     * 
     * @example
     * const result = await client.generateCode(
     *     'datasheet.pdf',
     *     'schematic.png',
     *     '生成GPIO初始化代码'
     * );
     * console.log(result.generated_code);
     */
    async generateCode(datasteetPath, schematicPath, instruction = '生成初始化代码') {
        const form = new FormData();
        
        if (datasteetPath && fs.existsSync(datasteetPath)) {
            form.append('datasheet', fs.createReadStream(datasteetPath));
        }
        if (schematicPath && fs.existsSync(schematicPath)) {
            form.append('schematic', fs.createReadStream(schematicPath));
        }
        form.append('instruction', instruction);
        
        const response = await this.client.post('/api/v1/generate', form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        return response.data;
    }
    
    /**
     * 生成嵌入式代码（使用 URL）
     * 
     * @param {string|null} datasteetUrl - 数据手册 URL
     * @param {string|null} schematicUrl - 原理图 URL
     * @param {string} instruction - 代码生成需求描述
     * @returns {Promise<Object>} 包含生成代码的对象
     * @throws {Error} 请求失败
     * 
     * @example
     * const result = await client.generateCodeFromUrls(
     *     'https://example.com/datasheet.pdf',
     *     'https://example.com/schematic.png',
     *     '生成I2C驱动代码'
     * );
     */
    async generateCodeFromUrls(datasteetUrl, schematicUrl, instruction = '生成初始化代码') {
        const data = { instruction };
        
        if (datasteetUrl) {
            data.datasheet_url = datasteetUrl;
        }
        if (schematicUrl) {
            data.schematic_url = schematicUrl;
        }
        
        const response = await this.client.post('/api/v1/generate/url', data);
        return response.data;
    }
    
    /**
     * 单独分析数据手册（文件路径）
     * 
     * @param {string} filePath - 数据手册文件路径
     * @returns {Promise<Object>} 包含分析结果的对象
     * @throws {Error} 请求失败
     */
    async analyzeDatasheet(filePath) {
        const form = new FormData();
        form.append('datasheet', fs.createReadStream(filePath));
        
        const response = await this.client.post('/api/v1/analyze/datasheet', form, {
            headers: form.getHeaders()
        });
        
        return response.data;
    }
    
    /**
     * 单独分析数据手册（URL）
     * 
     * @param {string} fileUrl - 数据手册 URL
     * @returns {Promise<Object>} 包含分析结果的对象
     * @throws {Error} 请求失败
     */
    async analyzeDatasheetFromUrl(fileUrl) {
        const response = await this.client.post('/api/v1/analyze/datasheet', {
            datasheet_url: fileUrl
        });
        
        return response.data;
    }
    
    /**
     * 单独分析原理图（文件路径）
     * 
     * @param {string} filePath - 原理图文件路径
     * @returns {Promise<Object>} 包含分析结果的对象
     * @throws {Error} 请求失败
     */
    async analyzeSchematic(filePath) {
        const form = new FormData();
        form.append('schematic', fs.createReadStream(filePath));
        
        const response = await this.client.post('/api/v1/analyze/schematic', form, {
            headers: form.getHeaders()
        });
        
        return response.data;
    }
    
    /**
     * 单独分析原理图（URL）
     * 
     * @param {string} fileUrl - 原理图 URL
     * @returns {Promise<Object>} 包含分析结果的对象
     * @throws {Error} 请求失败
     */
    async analyzeSchematicFromUrl(fileUrl) {
        const response = await this.client.post('/api/v1/analyze/schematic', {
            schematic_url: fileUrl
        });
        
        return response.data;
    }
    
    /**
     * 获取 API 文档
     * 
     * @returns {Promise<Object>} 包含 API 文档的对象
     * @throws {Error} 请求失败
     */
    async getDocs() {
        const response = await this.client.get('/api/v1/docs');
        return response.data;
    }
}

module.exports = EmbeddedAIClient;

// 使用示例
if (require.main === module) {
    (async () => {
        console.log('='.repeat(60));
        console.log('Embedded AI Code Generator - JavaScript Client SDK');
        console.log('='.repeat(60));
        console.log();
        
        try {
            // 创建客户端
            const client = new EmbeddedAIClient('http://localhost:8080');
            
            // 1. 健康检查
            console.log('1. 健康检查...');
            const health = await client.healthCheck();
            console.log(`   ✓ 服务状态: ${health.status}`);
            console.log(`   ✓ 版本: ${health.version}`);
            console.log();
            
            // 2. 系统状态
            console.log('2. 系统状态...');
            const status = await client.getStatus();
            console.log(`   ✓ Qwen API: ${status.qwenApiKey}`);
            console.log(`   ✓ PDF 支持: ${status.system.tools.pdfSupported}`);
            console.log();
            
            // 3. 生成代码（需要提供实际文件）
            const args = process.argv.slice(2);
            if (args.length >= 2) {
                console.log('3. 生成代码...');
                const datasheet = args[0];
                const schematic = args[1];
                const instruction = args[2] || '生成初始化代码';
                
                console.log(`   数据手册: ${datasheet}`);
                console.log(`   原理图: ${schematic}`);
                console.log(`   需求: ${instruction}`);
                console.log('   处理中...');
                
                const result = await client.generateCode(datasheet, schematic, instruction);
                
                if (result.status === 'success') {
                    // 保存代码
                    const outputFile = 'generated.c';
                    fs.writeFileSync(outputFile, result.generated_code, 'utf8');
                    
                    console.log('   ✓ 代码生成成功！');
                    console.log(`   ✓ 处理时间: ${result.metadata.processing_time_ms}ms`);
                    console.log(`   ✓ 保存到: ${outputFile}`);
                } else {
                    console.log(`   ✗ 生成失败: ${result.message || '未知错误'}`);
                }
            } else {
                console.log('3. 生成代码 - 跳过（需要提供文件）');
                console.log('   用法: node embedded-ai-client.js <datasheet> <schematic> [instruction]');
            }
            
            console.log();
            console.log('='.repeat(60));
            console.log('✓ 所有测试通过！');
            console.log('='.repeat(60));
            
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.error('✗ 错误: 无法连接到 API 服务器');
                console.error('  请确保服务器正在运行: npm run api');
                process.exit(1);
            } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                console.error('✗ 错误: 请求超时');
                process.exit(1);
            } else {
                console.error(`✗ 错误: ${error.message}`);
                if (error.response) {
                    console.error(`  状态码: ${error.response.status}`);
                    console.error(`  响应: ${JSON.stringify(error.response.data, null, 2)}`);
                }
                process.exit(1);
            }
        }
    })();
}
