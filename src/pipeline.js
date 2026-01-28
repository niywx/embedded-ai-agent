/**
 * @file pipeline.js
 * @brief 主流程管道模块
 * @description 实现从文档解析到代码生成的完整流程
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { callTextModel, callVisionModel } from './qwen_api.js';
import { extractText, extractAsImage, isImage } from './ocr.js';
import { convertPdfToImage, checkAvailableTools } from './pdf_converter.js';

// ES Module 中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 智能截断文本，保留重要内容
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度（字符数）
 * @returns {string} 截断后的文本
 */
function truncateText(text, maxLength = 50000) {
    if (text.length <= maxLength) {
        return text;
    }
    
    console.log(`[Pipeline] Text too long (${text.length} chars), truncating to ${maxLength} chars`);
    
    // 策略：保留开头和结尾，中间截断
    const headLength = Math.floor(maxLength * 0.7); // 70% 保留开头
    const tailLength = Math.floor(maxLength * 0.3); // 30% 保留结尾
    
    const head = text.substring(0, headLength);
    const tail = text.substring(text.length - tailLength);
    
    return head + '\n\n[... 内容已截断 ...]\n\n' + tail;
}

// ============================================================================
// Prompt 加载
// ============================================================================

/**
 * 加载 Prompt 模板
 * @param {string} promptName - Prompt 文件名（不含扩展名）
 * @returns {Promise<string>} Prompt 内容
 */
async function loadPrompt(promptName) {
    const promptPath = path.join(__dirname, '..', 'prompts', `${promptName}.txt`);
    try {
        const content = await fs.readFile(promptPath, 'utf-8');
        return content;
    } catch (error) {
        console.error(`[Pipeline] Error loading prompt ${promptName}:`, error.message);
        throw new Error(`Failed to load prompt: ${promptName}`);
    }
}

// ============================================================================
// 步骤 1: 提取寄存器信息
// ============================================================================

/**
 * 从 Datasheet 提取寄存器信息
 * @param {string} datasheetPath - Datasheet 文件路径
 * @returns {Promise<Object>} 寄存器信息 JSON
 */
async function extractRegisters(datasheetPath) {
    console.log('\n========================================');
    console.log('Step 1: Extracting Register Information');
    console.log('========================================\n');

    try {
        // 提取文档文本
        console.log(`[Pipeline] 📖 Extracting text from datasheet...`);
        const extractStart = Date.now();
        let datasheetText = await extractText(datasheetPath);
        const extractElapsed = ((Date.now() - extractStart) / 1000).toFixed(2);
        
        console.log(`[Pipeline]   ✓ Text extraction completed in ${extractElapsed}s`);
        console.log(`[Pipeline]   • Original text length: ${datasheetText.length} characters`);
        console.log(`[Pipeline]   • Estimated pages: ~${Math.ceil(datasheetText.length / 3000)}`);

        // 智能截断过长的文本（保留前后重要部分）
        const originalLength = datasheetText.length;
        datasheetText = truncateText(datasheetText, 50000);
        if (originalLength > 50000) {
            console.log(`[Pipeline]   ⚠️  Text truncated: ${originalLength} → ${datasheetText.length} characters`);
            console.log(`[Pipeline]   • Kept: ${((datasheetText.length / originalLength) * 100).toFixed(1)}% of original`);
        }
        
        // 加载 Prompt 模板
        console.log(`[Pipeline] 📝 Loading prompt templates...`);
        const systemPrompt = await loadPrompt('system');
        const extractPrompt = await loadPrompt('extract_registers');
        console.log(`[Pipeline]   ✓ Templates loaded`);

        // 构建完整 Prompt
        const fullPrompt = `${extractPrompt}\n\n=== Datasheet Content ===\n${datasheetText}`;
        console.log(`[Pipeline]   • Total prompt length: ${fullPrompt.length} characters`);

        // 调用 Qwen API（增加 maxTokens 避免截断）
        console.log(`[Pipeline] 🤖 Calling Qwen API to extract registers...`);
        console.log(`[Pipeline]   • Model: qwen-plus`);
        console.log(`[Pipeline]   • Temperature: 0.3`);
        console.log(`[Pipeline]   • MaxTokens: 8000`);
        
        const apiStart = Date.now();
        const response = await callTextModel(fullPrompt, {
            systemPrompt: systemPrompt,
            temperature: 0.3,
            maxTokens: 8000  // 增加到 8000 以支持大型 datasheet
        });
        const apiElapsed = ((Date.now() - apiStart) / 1000).toFixed(2);
        
        console.log(`[Pipeline]   ✓ API call completed in ${apiElapsed}s`);

        // 解析 JSON 响应（增强容错性）
        const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
        console.log(`[Pipeline] 📊 Analyzing API response...`);
        console.log(`[Pipeline]   • Response length: ${responseStr.length} characters`);
        console.log(`[Pipeline]   • Response preview: ${responseStr.substring(0, 100)}...`);
        
        // 尝试提取 JSON
        const jsonMatch = responseStr.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn(`[Pipeline]   ⚠️  Warning: No JSON found in response`);
            console.warn(`[Pipeline]   • Response preview: ${responseStr.substring(0, 300)}`);
            console.warn(`[Pipeline]   • Returning empty register list`);
            return { registers: [] };
        }

        let registerJson;
        try {
            registerJson = JSON.parse(jsonMatch[0]);
            console.log(`[Pipeline]   ✓ JSON parsed successfully`);
        } catch (parseError) {
            console.warn(`[Pipeline]   ⚠️  JSON parse error: ${parseError.message}`);
            console.warn(`[Pipeline]   • Attempting to fix JSON...`);
            
            // 尝试修复常见的 JSON 错误
            let fixedJson = jsonMatch[0];
            
            // 1. 修复字符串值中的实际换行符（将它们替换为空格）
            fixedJson = fixedJson.replace(/"([^"]*(?:\r?\n|\r)[^"]*)"/g, (match) => {
                return match.replace(/\r?\n|\r/g, ' ');
            });
            
            // 2. 修复尾部逗号
            fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
            
            // 3. 如果 JSON 不完整，尝试补全
            fixedJson = fixedJson.trim();
            if (!fixedJson.endsWith('}')) {
                console.warn(`[Pipeline] JSON appears incomplete, attempting to complete...`);
                const openBraces = (fixedJson.match(/\{/g) || []).length;
                const closeBraces = (fixedJson.match(/\}/g) || []).length;
                const openBrackets = (fixedJson.match(/\[/g) || []).length;
                const closeBrackets = (fixedJson.match(/\]/g) || []).length;
                
                // 移除可能的截断内容（如未完成的字符串）
                if (fixedJson.match(/"[^"]*$/)) {
                    fixedJson = fixedJson.replace(/"[^"]*$/, '');
                    if (fixedJson.endsWith(':')) {
                        fixedJson = fixedJson.slice(0, -1);
                    }
                    if (fixedJson.endsWith(',')) {
                        fixedJson = fixedJson.slice(0, -1);
                    }
                }
                
                for (let i = 0; i < (openBrackets - closeBrackets); i++) {
                    fixedJson += ']';
                }
                for (let i = 0; i < (openBraces - closeBraces); i++) {
                    fixedJson += '}';
                }
            }
            
            // 尝试再次解析
            try {
                registerJson = JSON.parse(fixedJson);
                console.log(`[Pipeline] ✓ Successfully fixed and parsed JSON`);
            } catch (secondError) {
                console.error(`[Pipeline] ✗ Still unable to parse JSON after fixing`);
                console.error(`[Pipeline] Error: ${secondError.message}`);
                // 保存原始响应用于调试
                await fs.writeFile('out/debug_register_response.txt', responseStr);
                await fs.writeFile('out/debug_register_fixed.txt', fixedJson);
                console.log(`[Pipeline] Saved debug files to out/debug_register_*.txt`);
                // 返回空结构而不是抛出错误
                return { registers: [] };
            }
        }
        
        console.log(`[Pipeline] Successfully extracted ${registerJson.registers?.length || 0} registers`);
        return registerJson;

    } catch (error) {
        console.error(`[Pipeline] Error in extractRegisters:`, error.message);
        throw error;
    }
}

// ============================================================================
// 步骤 2: 解析原理图
// ============================================================================

/**
 * 解析原理图，提取引脚映射
 * @param {string} schematicPath - 原理图文件路径
 * @returns {Promise<Object>} 引脚映射信息 JSON
 */
async function parseSchematic(schematicPath) {
    console.log('\n========================================');
    console.log('Step 2: Parsing Schematic');
    console.log('========================================\n');

    try {
        // 加载 Prompt 模板
        const parsePrompt = await loadPrompt('parse_schematic');

        let response;
        let actualSchematicPath = schematicPath;

        // 🎯 自动检测并转换 PDF 原理图
        if (schematicPath.toLowerCase().endsWith('.pdf')) {
            console.log(`[Pipeline] ⚡ Detected PDF schematic, attempting auto-conversion...`);
            
            try {
                // 尝试自动转换为图片
                actualSchematicPath = await convertPdfToImage(schematicPath, {
                    dpi: 300,  // 高分辨率
                    outputDir: path.join(__dirname, '..', 'temp')
                });
                console.log(`[Pipeline] ✓ PDF converted successfully to: ${actualSchematicPath}`);
                console.log(`[Pipeline] ✓ Will use Vision model for schematic analysis`);
            } catch (conversionError) {
                console.error(`[Pipeline] ❌ PDF conversion failed: ${conversionError.message}`);
                console.error(`[Pipeline] ❌ This means schematic graphics CANNOT be analyzed!`);
                console.error(`[Pipeline] 💡 Suggestion: Upload PNG/JPG format or install pdf-poppler tools`);
                console.warn(`[Pipeline] ⚠️  Falling back to text extraction (will lose graphic info)...`);
                // 转换失败，回退到文本提取（但会丢失图形信息）
                actualSchematicPath = schematicPath;
            }
        }

        // 诊断日志
        console.log(`[Pipeline] 📊 Schematic Processing Info:`);
        console.log(`[Pipeline]   - Original path: ${path.basename(schematicPath)}`);
        console.log(`[Pipeline]   - Actual path: ${path.basename(actualSchematicPath)}`);
        console.log(`[Pipeline]   - Is image: ${isImage(actualSchematicPath)}`);
        console.log(`[Pipeline]   - Model to use: ${isImage(actualSchematicPath) ? 'Vision (✓ Can see graphics)' : 'Text (⚠️ Cannot see graphics)'}`);

        if (isImage(actualSchematicPath)) {
            // 如果是图片，使用视觉模型
            console.log(`[Pipeline] Schematic is an image, using Vision model...`);
            const imageBuffer = await extractAsImage(actualSchematicPath);
            response = await callVisionModel(imageBuffer, parsePrompt, {
                temperature: 0.3,
                maxTokens: 4000  // 增加到 4000 以支持复杂原理图
            });
        } else {
            // 如果是 PDF 或文本，先提取文本再用文本模型
            console.log(`[Pipeline] Schematic is a document, extracting text...`);
            console.warn(`[Pipeline] ⚠️  WARNING: Using text model for schematic!`);
            console.warn(`[Pipeline] ⚠️  Graphics information will be lost!`);
            let schematicText = await extractText(actualSchematicPath);
            schematicText = truncateText(schematicText, 30000); // 原理图文本较短
            const fullPrompt = `${parsePrompt}\n\n=== Schematic Content ===\n${schematicText}`;
            response = await callTextModel(fullPrompt, {
                temperature: 0.3,
                maxTokens: 4000  // 增加到 4000
            });
        }

        // 解析 JSON 响应（增强容错性）
        const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
        console.log(`[Pipeline] 📊 Analyzing API response...`);
        console.log(`[Pipeline]   • Response length: ${responseStr.length} characters`);
        
        const jsonMatch = responseStr.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn(`[Pipeline]   ⚠️  Warning: No JSON found in response`);
            console.warn(`[Pipeline]   • Response preview: ${responseStr.substring(0, 200)}`);
            return {
                pin_mappings: [],
                input_pins: [],
                output_pins: [],
                special_requirements: []
            };
        }

        let schematicJson;
        try {
            schematicJson = JSON.parse(jsonMatch[0]);
            console.log(`[Pipeline]   ✓ JSON parsed successfully`);
        } catch (parseError) {
            console.warn(`[Pipeline]   ⚠️  JSON parse error: ${parseError.message}`);
            console.warn(`[Pipeline]   • Attempting to fix JSON...`);
            
            let fixedJson = jsonMatch[0];
            
            // 1. 修复尾部逗号
            fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
            
            // 2. 如果 JSON 不完整，尝试补全
            fixedJson = fixedJson.trim();
            
            // 3. 移除可能的截断内容（如未完成的字符串或对象）
            if (fixedJson.match(/"[^"]*$/)) {
                // 未闭合的字符串
                console.warn(`[Pipeline]   • Detected unclosed string, removing...`);
                fixedJson = fixedJson.replace(/,?\s*"[^"]*$/, '');
            }
            if (fixedJson.match(/,\s*\{\s*"[^}]*$/)) {
                // 未完成的对象
                console.warn(`[Pipeline]   • Detected incomplete object, removing...`);
                fixedJson = fixedJson.replace(/,\s*\{\s*"[^}]*$/, '');
            }
            
            // 4. 补全缺失的括号
            const openBraces = (fixedJson.match(/\{/g) || []).length;
            const closeBraces = (fixedJson.match(/\}/g) || []).length;
            const openBrackets = (fixedJson.match(/\[/g) || []).length;
            const closeBrackets = (fixedJson.match(/\]/g) || []).length;
            
            console.warn(`[Pipeline]   • Bracket balance: { ${openBraces}/${closeBraces}, [ ${openBrackets}/${closeBrackets}`);
            
            for (let i = 0; i < (openBrackets - closeBrackets); i++) {
                fixedJson += ']';
            }
            for (let i = 0; i < (openBraces - closeBraces); i++) {
                fixedJson += '}';
            }
            
            // 5. 尝试再次解析
            try {
                schematicJson = JSON.parse(fixedJson);
                console.log(`[Pipeline]   ✓ Successfully fixed and parsed JSON`);
                console.log(`[Pipeline]   • Recovered ${schematicJson.pin_mappings?.length || 0} pin mappings`);
            } catch (secondError) {
                console.error(`[Pipeline]   ✗ Still unable to parse JSON after fixing`);
                console.error(`[Pipeline]   • Error: ${secondError.message}`);
                
                // 保存原始响应用于调试
                const debugPath = path.join(__dirname, '..', 'out', 'debug_schematic_response.txt');
                await fs.writeFile(debugPath, responseStr);
                const debugFixedPath = path.join(__dirname, '..', 'out', 'debug_schematic_fixed.txt');
                await fs.writeFile(debugFixedPath, fixedJson);
                console.log(`[Pipeline]   • Saved debug files to out/debug_schematic_*.txt`);
                
                // 返回空结构而不是抛出错误
                return {
                    pin_mappings: [],
                    input_pins: [],
                    output_pins: [],
                    special_requirements: []
                };
            }
        }
        
        console.log(`[Pipeline] Successfully parsed ${schematicJson.pin_mappings?.length || 0} pin mappings`);

        return schematicJson;

    } catch (error) {
        console.error(`[Pipeline] Error in parseSchematic:`, error.message);
        throw error;
    }
}

// ============================================================================
// 步骤 3: 生成代码
// ============================================================================

/**
 * 生成嵌入式 C 代码
 * @param {Object} registerJson - 寄存器信息
 * @param {Object} schematicJson - 原理图信息
 * @param {string} instruction - 用户指令
 * @returns {Promise<string>} 生成的 C 代码
 */
async function generateCode(registerJson, schematicJson, instruction) {
    console.log('\n========================================');
    console.log('Step 3: Generating C Code');
    console.log('========================================\n');

    try {
        // 🔍 诊断：检查输入数据
        console.log(`[Pipeline] 🔍 Input data verification:`);
        console.log(`[Pipeline]   • Register JSON type: ${typeof registerJson}`);
        console.log(`[Pipeline]   • Register JSON keys: ${registerJson ? Object.keys(registerJson).join(', ') : 'null'}`);
        console.log(`[Pipeline]   • Registers count: ${registerJson?.registers?.length || 0}`);
        console.log(`[Pipeline]   • Schematic JSON type: ${typeof schematicJson}`);
        console.log(`[Pipeline]   • Schematic JSON keys: ${schematicJson ? Object.keys(schematicJson).join(', ') : 'null'}`);
        console.log(`[Pipeline]   • Pin mappings count: ${schematicJson?.pin_mappings?.length || 0}`);
        console.log(`[Pipeline]   • Instruction length: ${instruction?.length || 0}`);
        
        // 如果数据为空，提供警告
        if (!registerJson || !registerJson.registers || registerJson.registers.length === 0) {
            console.warn(`[Pipeline]   ⚠️  WARNING: No register information provided!`);
        }
        if (!schematicJson || !schematicJson.pin_mappings || schematicJson.pin_mappings.length === 0) {
            console.warn(`[Pipeline]   ⚠️  WARNING: No pin mapping information provided!`);
        }

        // 加载 Prompt 模板
        const systemPrompt = await loadPrompt('system');
        const generatePrompt = await loadPrompt('generate_code');

        // 构建完整 Prompt
        const fullPrompt = `${generatePrompt}

=== Register Information ===
${JSON.stringify(registerJson, null, 2)}

=== Pin Mapping Information ===
${JSON.stringify(schematicJson, null, 2)}

=== User Instruction ===
${instruction}

Now generate the C code:`;

        // 调用 Qwen API
        console.log(`[Pipeline] Calling Qwen API to generate code...`);
        const cCode = await callTextModel(fullPrompt, {
            systemPrompt: systemPrompt,
            temperature: 0.5,
            maxTokens: 4000
        });

        // 提取代码块（如果被包裹在 ```c ... ``` 中）
        let cleanCode = cCode;
        const codeBlockMatch = cCode.match(/```c?\n?([\s\S]*?)\n?```/);
        if (codeBlockMatch) {
            cleanCode = codeBlockMatch[1];
        }

        console.log(`[Pipeline] Successfully generated ${cleanCode.split('\n').length} lines of code`);

        return cleanCode;

    } catch (error) {
        console.error(`[Pipeline] Error in generateCode:`, error.message);
        throw error;
    }
}

// ============================================================================
// 主流程
// ============================================================================

/**
 * 运行完整流程
 * @param {Object} params - 参数对象
 * @param {string} params.datasheet - Datasheet 文件路径
 * @param {string} params.schematic - 原理图文件路径
 * @param {string} params.instruction - 用户指令
 * @param {string} params.outputPath - 输出文件路径（可选）
 * @returns {Promise<Object>} 流程结果
 */
export async function runPipeline({ datasheet, schematic, instruction, outputPath }) {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║          Embedded AI Agent Pipeline - START                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`[Pipeline] ⏰ Start time: ${new Date().toISOString()}`);
    console.log(`[Pipeline] 📋 Pipeline configuration:`);
    console.log(`[Pipeline]   • Datasheet: ${datasheet ? path.basename(datasheet) : 'Not provided'}`);
    console.log(`[Pipeline]   • Schematic: ${schematic ? path.basename(schematic) : 'Not provided'}`);
    console.log(`[Pipeline]   • Instruction length: ${instruction?.length || 0} chars`);
    console.log(`[Pipeline]   • Output path: ${outputPath || 'Auto-generated'}`);
    console.log('');

    const startTime = Date.now();
    let step = 0;
    const stepTimings = [];

    // 初始化结果变量（在整个 try 块中可见）
    let registerJson = { registers: [] };
    let schematicJson = { pin_mappings: [], input_pins: [], output_pins: [] };

    try {
        // 步骤 1: 提取寄存器
        if (datasheet) {
            step = 1;
            const step1Start = Date.now();
            console.log(`\n${'═'.repeat(70)}`);
            console.log(`[Pipeline] 📦 STEP ${step}/3: Extract Register Information`);
            console.log(`${'═'.repeat(70)}`);
            
            registerJson = await extractRegisters(datasheet);
            
            const step1Elapsed = Date.now() - step1Start;
            stepTimings.push({ step: 'Extract Registers', time: step1Elapsed });
            
            console.log(`\n[Pipeline] ✅ Step ${step} completed in ${step1Elapsed}ms (${(step1Elapsed/1000).toFixed(2)}s)`);
            console.log(`[Pipeline] 📊 Extracted data:`);
            console.log(`[Pipeline]   • Registers: ${registerJson.registers?.length || 0}`);
            console.log(`[Pipeline]   • Data size: ${JSON.stringify(registerJson).length} bytes`);
        } else {
            console.log(`[Pipeline] ⏭️  Skipping Step 1: No datasheet provided`);
        }

        // 步骤 2: 解析原理图
        if (schematic) {
            step = 2;
            const step2Start = Date.now();
            console.log(`\n${'═'.repeat(70)}`);
            console.log(`[Pipeline] 🔌 STEP ${step}/3: Parse Schematic`);
            console.log(`${'═'.repeat(70)}`);
            
            schematicJson = await parseSchematic(schematic);
            
            const step2Elapsed = Date.now() - step2Start;
            stepTimings.push({ step: 'Parse Schematic', time: step2Elapsed });
            
            console.log(`\n[Pipeline] ✅ Step ${step} completed in ${step2Elapsed}ms (${(step2Elapsed/1000).toFixed(2)}s)`);
            console.log(`[Pipeline] 📊 Extracted data:`);
            console.log(`[Pipeline]   • Pin mappings: ${schematicJson.pin_mappings?.length || 0}`);
            console.log(`[Pipeline]   • Input pins: ${schematicJson.input_pins?.length || 0}`);
            console.log(`[Pipeline]   • Output pins: ${schematicJson.output_pins?.length || 0}`);
            console.log(`[Pipeline]   • Data size: ${JSON.stringify(schematicJson).length} bytes`);
        } else {
            console.log(`[Pipeline] ⏭️  Skipping Step 2: No schematic provided`);
        }

        // 步骤 3: 生成代码
        step = 3;
        const step3Start = Date.now();
        console.log(`\n${'═'.repeat(70)}`);
        console.log(`[Pipeline] 💻 STEP ${step}/3: Generate C Code`);
        console.log(`${'═'.repeat(70)}`);
        
        const cCode = await generateCode(registerJson, schematicJson, instruction);
        
        const step3Elapsed = Date.now() - step3Start;
        stepTimings.push({ step: 'Generate Code', time: step3Elapsed });
        
        console.log(`\n[Pipeline] ✅ Step ${step} completed in ${step3Elapsed}ms (${(step3Elapsed/1000).toFixed(2)}s)`);
        console.log(`[Pipeline] 📊 Generated code:`);
        console.log(`[Pipeline]   • Lines: ${cCode.split('\n').length}`);
        console.log(`[Pipeline]   • Characters: ${cCode.length}`);
        console.log(`[Pipeline]   • Size: ${(cCode.length / 1024).toFixed(2)} KB`);

        // 确定输出路径
        const finalOutputPath = outputPath || path.join(__dirname, '..', 'out', 'default_set_io.c');

        // 确保输出目录存在
        await fs.ensureDir(path.dirname(finalOutputPath));

        // 写入文件 (添加 UTF-8 BOM 以确保 Windows 编辑器正确显示中文)
        console.log(`\n[Pipeline] 💾 Saving generated code...`);
        console.log(`[Pipeline]   • Output path: ${finalOutputPath}`);
        console.log(`[Pipeline]   • Encoding: UTF-8 with BOM`);
        
        const BOM = '\uFEFF';
        await fs.writeFile(finalOutputPath, BOM + cCode, 'utf-8');
        
        console.log(`[Pipeline]   ✓ File saved successfully`);

        // 计算总耗时
        const totalElapsed = Date.now() - startTime;
        const totalSeconds = (totalElapsed / 1000).toFixed(2);

        // 生成详细的结果报告
        console.log(`\n${'═'.repeat(70)}`);
        console.log(`[Pipeline] 📊 PIPELINE SUMMARY`);
        console.log(`${'═'.repeat(70)}`);
        console.log(`[Pipeline] ⏱️  Total execution time: ${totalElapsed}ms (${totalSeconds}s)`);
        console.log(`[Pipeline] 📈 Step timings:`);
        stepTimings.forEach((timing, index) => {
            const percentage = ((timing.time / totalElapsed) * 100).toFixed(1);
            console.log(`[Pipeline]   ${index + 1}. ${timing.step}: ${timing.time}ms (${(timing.time/1000).toFixed(2)}s) - ${percentage}%`);
        });
        console.log(`[Pipeline] 📁 Output file: ${path.basename(finalOutputPath)}`);
        console.log(`[Pipeline] ✅ Status: SUCCESS`);

        const result = {
            status: 'success',
            timestamp: new Date().toISOString(),
            elapsed_ms: totalElapsed,
            elapsed: `${totalSeconds}s`,
            step_timings: stepTimings,
            inputs: {
                datasheet: datasheet ? path.basename(datasheet) : null,
                schematic: schematic ? path.basename(schematic) : null,
                instruction: instruction
            },
            extracted_data: {
                registers: registerJson,
                pin_mappings: schematicJson
            },
            generated_code_path: finalOutputPath,
            generated_code_lines: cCode.split('\n').length,
            generated_code_size: cCode.length
        };

        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║         Pipeline Completed Successfully! 🎉                   ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');

        return result;

    } catch (error) {
        const totalElapsed = Date.now() - startTime;
        
        console.error(`\n${'═'.repeat(70)}`);
        console.error(`[Pipeline] ❌ PIPELINE FAILED`);
        console.error(`${'═'.repeat(70)}`);
        console.error(`[Pipeline] 💥 Error in Step ${step}`);
        console.error(`[Pipeline] ⏱️  Time before failure: ${totalElapsed}ms (${(totalElapsed/1000).toFixed(2)}s)`);
        console.error(`[Pipeline] 🐛 Error type: ${error.name}`);
        console.error(`[Pipeline] 📝 Error message: ${error.message}`);
        console.error(`[Pipeline] 📍 Stack trace:`);
        console.error(error.stack);
        
        if (stepTimings.length > 0) {
            console.error(`\n[Pipeline] 📈 Completed steps before failure:`);
            stepTimings.forEach((timing, index) => {
                console.error(`[Pipeline]   ${index + 1}. ${timing.step}: ${timing.time}ms (${(timing.time/1000).toFixed(2)}s)`);
            });
        }

        console.error('\n╔════════════════════════════════════════════════════════════════╗');
        console.error('║            Pipeline Failed with Error ❌                       ║');
        console.error('╚════════════════════════════════════════════════════════════════╝\n');

        const result = {
            status: 'error',
            timestamp: new Date().toISOString(),
            elapsed_ms: totalElapsed,
            failed_at_step: step,
            step_timings: stepTimings,
            error_message: error.message,
            error_type: error.name,
            stack: error.stack
        };

        return result;
    }
}

// ============================================================================
// 导出
// ============================================================================

export default {
    runPipeline,
    extractRegisters,
    parseSchematic,
    generateCode
};
