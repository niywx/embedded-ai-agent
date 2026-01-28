/**
 * @file qwen_api.js
 * @brief Qwen API 封装模块
 * @description 提供与通义千问 API 交互的接口，支持文本模型和视觉模型
 */

import axios from 'axios';

// ============================================================================
// 配置
// ============================================================================

const QWEN_API_KEY = process.env.QWEN_API_KEY || 'sk-0f4bf35cd5ea468794a24920026dbb9c';
const QWEN_API_BASE = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const QWEN_VL_API_BASE = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

// 模型配置
const TEXT_MODEL = 'qwen-plus';  // 文本模型
const VISION_MODEL = 'qwen-vl-plus';  // 视觉模型

// 重试配置
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 毫秒
const API_TIMEOUT = 120000; // 120 秒超时（处理大文件）

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 延时函数
 * @param {number} ms - 延时毫秒数
 * @returns {Promise}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查 API Key 配置
 * @throws {Error} 如果 API Key 未配置
 */
function checkApiKey() {
    if (!QWEN_API_KEY || QWEN_API_KEY === '<PUT_YOUR_KEY_HERE>') {
        throw new Error('QWEN_API_KEY not configured. Please set environment variable or edit qwen_api.js');
    }
}

// ============================================================================
// 文本模型 API
// ============================================================================

/**
 * 调用 Qwen 文本模型
 * @param {string} prompt - 输入提示词
 * @param {Object} options - 可选参数
 * @param {string} options.systemPrompt - 系统提示词
 * @param {number} options.temperature - 温度参数 (0-2)
 * @param {number} options.maxTokens - 最大输出 token 数
 * @returns {Promise<string>} 模型输出文本
 */
export async function callTextModel(prompt, options = {}) {
    checkApiKey();

    const {
        systemPrompt = '',
        temperature = 0.7,
        maxTokens = 2000
    } = options;

    const messages = [];
    
    if (systemPrompt) {
        messages.push({
            role: 'system',
            content: systemPrompt
        });
    }
    
    messages.push({
        role: 'user',
        content: prompt
    });

    const payload = {
        model: TEXT_MODEL,
        input: {
            messages: messages
        },
        parameters: {
            temperature: temperature,
            max_tokens: maxTokens,
            result_format: 'message'
        }
    };

    // 重试逻辑
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        let attemptStart = Date.now(); // 在循环开始时定义，使 catch 块也能访问
        
        try {
            console.log(`\n${'─'.repeat(50)}`);
            console.log(`[Qwen Text API] 🔄 Attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
            console.log(`[Qwen Text API] ⏰ Start time: ${new Date().toISOString()}`);
            console.log(`[Qwen Text API] 📊 Request details:`);
            console.log(`[Qwen Text API]   • Model: ${TEXT_MODEL}`);
            console.log(`[Qwen Text API]   • Temperature: ${temperature}`);
            console.log(`[Qwen Text API]   • Max tokens: ${maxTokens}`);
            console.log(`[Qwen Text API]   • Messages: ${messages.length}`);
            console.log(`[Qwen Text API]   • Total chars: ${JSON.stringify(messages).length}`);
            console.log(`[Qwen Text API]   • Timeout: ${API_TIMEOUT}ms (${API_TIMEOUT/1000}s)`);
            console.log(`${'─'.repeat(50)}`);
            
            const response = await axios.post(
                QWEN_API_BASE,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${QWEN_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: API_TIMEOUT // 使用配置的超时时间
                }
            );

            const attemptElapsed = Date.now() - attemptStart;

            if (response.data && response.data.output && response.data.output.choices) {
                const result = response.data.output.choices[0].message.content;
                const usage = response.data.usage || {};
                
                console.log(`[Qwen Text API] ✅ Success!`);
                console.log(`[Qwen Text API] ⏱️  API call time: ${attemptElapsed}ms (${(attemptElapsed/1000).toFixed(2)}s)`);
                console.log(`[Qwen Text API] 📈 Token usage:`);
                console.log(`[Qwen Text API]   • Input tokens: ${usage.input_tokens || 'N/A'}`);
                console.log(`[Qwen Text API]   • Output tokens: ${usage.output_tokens || 'N/A'}`);
                console.log(`[Qwen Text API]   • Total tokens: ${usage.total_tokens || 'N/A'}`);
                console.log(`[Qwen Text API] 📝 Response preview: ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`);
                console.log(`[Qwen Text API] 📏 Response length: ${result.length} characters\n`);
                
                return result;
            } else {
                throw new Error('Invalid response format from Qwen API');
            }

        } catch (error) {
            const attemptElapsed = Date.now() - attemptStart;
            console.error(`\n[Qwen Text API] ❌ Error on attempt ${attempt + 1} (after ${attemptElapsed}ms):`);
            console.error(`[Qwen Text API]   • Error type: ${error.name}`);
            console.error(`[Qwen Text API]   • Error message: ${error.message}`);
            
            if (error.code === 'ECONNABORTED') {
                console.error(`[Qwen Text API]   • Reason: Request timeout (exceeded ${API_TIMEOUT}ms)`);
            } else if (error.code) {
                console.error(`[Qwen Text API]   • Error code: ${error.code}`);
            }
            
            if (error.response) {
                console.error(`[Qwen Text API]   • HTTP Status: ${error.response.status} ${error.response.statusText || ''}`);
                console.error(`[Qwen Text API]   • Response data:`, JSON.stringify(error.response.data, null, 2));
            }
            
            if (attempt < MAX_RETRIES) {
                console.log(`[Qwen Text API] 🔄 Retrying in ${RETRY_DELAY}ms... (${MAX_RETRIES - attempt} retries left)`);
                await delay(RETRY_DELAY);
            } else {
                console.error(`[Qwen Text API] ❌ All ${MAX_RETRIES + 1} attempts failed. Giving up.`);
                const errorDetail = error.response ? JSON.stringify(error.response.data) : error.message;
                throw new Error(`Qwen Text API failed after ${MAX_RETRIES + 1} attempts: ${errorDetail}`);
            }
        }
    }
}

// ============================================================================
// 视觉模型 API
// ============================================================================

/**
 * 调用 Qwen 视觉模型
 * @param {Buffer} imageBuffer - 图片 Buffer
 * @param {string} prompt - 对图片的提问或指令
 * @param {Object} options - 可选参数
 * @returns {Promise<string>} 模型输出文本
 */
export async function callVisionModel(imageBuffer, prompt, options = {}) {
    checkApiKey();

    const {
        temperature = 0.7,
        maxTokens = 2000
    } = options;

    // 将图片转换为 base64
    const imageBase64 = imageBuffer.toString('base64');
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    const messages = [
        {
            role: 'user',
            content: [
                {
                    type: 'image',
                    image: imageUrl
                },
                {
                    type: 'text',
                    text: prompt
                }
            ]
        }
    ];

    const payload = {
        model: VISION_MODEL,
        input: {
            messages: messages
        },
        parameters: {
            temperature: temperature,
            max_tokens: maxTokens
        }
    };

    // 重试逻辑
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        let attemptStart = Date.now(); // 在循环开始时定义，使 catch 块也能访问
        
        try {
            const imageSize = imageBuffer.length;
            
            console.log(`\n${'─'.repeat(50)}`);
            console.log(`[Qwen Vision API] 🔄 Attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
            console.log(`[Qwen Vision API] ⏰ Start time: ${new Date().toISOString()}`);
            console.log(`[Qwen Vision API] 📊 Request details:`);
            console.log(`[Qwen Vision API]   • Model: ${VISION_MODEL}`);
            console.log(`[Qwen Vision API]   • Temperature: ${temperature}`);
            console.log(`[Qwen Vision API]   • Max tokens: ${maxTokens}`);
            console.log(`[Qwen Vision API]   • Image size: ${(imageSize / 1024).toFixed(2)} KB`);
            console.log(`[Qwen Vision API]   • Base64 size: ${imageBase64.length} chars`);
            console.log(`[Qwen Vision API]   • Prompt length: ${prompt.length} chars`);
            console.log(`[Qwen Vision API]   • Timeout: 120000ms (120s)`);
            console.log(`${'─'.repeat(50)}`);
            
            const response = await axios.post(
                QWEN_VL_API_BASE,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${QWEN_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 120000 // 120 秒超时（视觉模型较慢）
                }
            );

            const attemptElapsed = Date.now() - attemptStart;

            if (response.data && response.data.output && response.data.output.choices) {
                const result = response.data.output.choices[0].message.content;
                const usage = response.data.usage || {};
                
                console.log(`[Qwen Vision API] ✅ Success!`);
                console.log(`[Qwen Vision API] ⏱️  API call time: ${attemptElapsed}ms (${(attemptElapsed/1000).toFixed(2)}s)`);
                console.log(`[Qwen Vision API] 📈 Token usage:`);
                console.log(`[Qwen Vision API]   • Input tokens: ${usage.input_tokens || 'N/A'}`);
                console.log(`[Qwen Vision API]   • Output tokens: ${usage.output_tokens || 'N/A'}`);
                console.log(`[Qwen Vision API]   • Total tokens: ${usage.total_tokens || 'N/A'}`);
                console.log(`[Qwen Vision API] 📝 Response preview: ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`);
                console.log(`[Qwen Vision API] 📏 Response length: ${result.length} characters\n`);
                
                return result;
            } else {
                throw new Error('Invalid response format from Qwen Vision API');
            }

        } catch (error) {
            const attemptElapsed = Date.now() - attemptStart;
            console.error(`\n[Qwen Vision API] ❌ Error on attempt ${attempt + 1} (after ${attemptElapsed}ms):`);
            console.error(`[Qwen Vision API]   • Error type: ${error.name}`);
            console.error(`[Qwen Vision API]   • Error message: ${error.message}`);
            
            if (error.code === 'ECONNABORTED') {
                console.error(`[Qwen Vision API]   • Reason: Request timeout (exceeded 120000ms)`);
            } else if (error.code) {
                console.error(`[Qwen Vision API]   • Error code: ${error.code}`);
            }
            
            if (error.response) {
                console.error(`[Qwen Vision API]   • HTTP Status: ${error.response.status} ${error.response.statusText || ''}`);
                console.error(`[Qwen Vision API]   • Response data:`, JSON.stringify(error.response.data, null, 2));
            }
            
            if (attempt < MAX_RETRIES) {
                console.log(`[Qwen Vision API] 🔄 Retrying in ${RETRY_DELAY}ms... (${MAX_RETRIES - attempt} retries left)`);
                await delay(RETRY_DELAY);
            } else {
                console.error(`[Qwen Vision API] ❌ All ${MAX_RETRIES + 1} attempts failed. Giving up.`);
                const errorDetail = error.response ? JSON.stringify(error.response.data) : error.message;
                throw new Error(`Qwen Vision API failed after ${MAX_RETRIES + 1} attempts: ${errorDetail}`);
            }
        }
    }
}

// ============================================================================
// 导出
// ============================================================================

export default {
    callTextModel,
    callVisionModel
};
