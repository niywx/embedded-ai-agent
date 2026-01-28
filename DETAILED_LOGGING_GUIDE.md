# 详细日志指南 (Detailed Logging Guide)

本文档详细说明了系统中增强的日志功能，帮助您更好地理解和调试代码生成流程。

---

## 📋 目录

1. [日志级别和类型](#日志级别和类型)
2. [各模块日志详解](#各模块日志详解)
3. [日志查看方法](#日志查看方法)
4. [性能分析](#性能分析)
5. [故障排查](#故障排查)
6. [最佳实践](#最佳实践)

---

## 日志级别和类型

### 日志符号说明

| 符号 | 含义 | 使用场景 |
|------|------|----------|
| ✅ | 成功 | 操作成功完成 |
| ❌ | 错误 | 操作失败 |
| ⚠️ | 警告 | 潜在问题或非致命错误 |
| 📊 | 统计 | 数据统计和度量 |
| 📝 | 信息 | 一般性信息 |
| 🔄 | 重试 | 正在重试操作 |
| ⏰ | 时间 | 时间戳 |
| ⏱️ | 耗时 | 执行时间统计 |
| 📈 | 进度 | 进度和百分比 |
| 🔧 | 工具 | 使用的工具或方法 |
| 💾 | 保存 | 文件保存操作 |
| 🚀 | 执行 | 命令或操作执行 |

---

## 各模块日志详解

### 1. API 服务器 (`api_server.js`)

#### 请求接收日志

```
═══════════════════════════════════════════════════════════════════
[API] 📥 New Request Received (ID: 1234567890)
═══════════════════════════════════════════════════════════════════
[API] 📋 Request Details:
[API]   • Client IP: 192.168.1.100
[API]   • Timestamp: 2024-01-15T10:30:45.123Z
[API]   • User-Agent: Mozilla/5.0...
```

**包含信息：**
- 请求唯一 ID（用于追踪）
- 客户端 IP 地址
- 请求时间戳
- 客户端 User-Agent

#### 文件上传日志

```
[API] 📁 Uploaded Files:
[API]   ✓ Datasheet:
[API]     - Name: BF7615CMXX.pdf
[API]     - Size: 2345.67 KB
[API]     - Type: application/pdf
[API]     - Temp path: /path/to/temp/file
[API]   ✓ Schematic:
[API]     - Name: schematic.pdf
[API]     - Size: 1234.56 KB
[API]     - Type: application/pdf
[API]     - Format: .PDF
[API]     - Temp path: /path/to/temp/file
```

**包含信息：**
- 文件名称
- 文件大小（KB）
- MIME 类型
- 文件格式
- 临时存储路径

#### 指令日志

```
[API] 📝 Instruction:
[API]   • Length: 256 characters
[API]   • Preview: 生成一个初始化函数，包括系统时钟配置...
```

**包含信息：**
- 指令长度
- 指令内容预览（前 150 字符）

#### 完成日志

```
═══════════════════════════════════════════════════════════════════
[API] ✅ Request Completed Successfully (ID: 1234567890)
═══════════════════════════════════════════════════════════════════
[API] 📊 Generation Statistics:
[API]   • Total processing time: 45678ms (45.68s)
[API]   • Registers extracted: 15
[API]   • Pin mappings found: 8
[API]   • Generated code size: 3456 characters
[API]   • Generated code lines: 123
[API]   • Output file: generated_1234567890.c
```

**包含信息：**
- 总处理时间
- 提取的寄存器数量
- 找到的引脚映射数量
- 生成代码的大小和行数
- 输出文件名

---

### 2. Pipeline 流水线 (`src/pipeline.js`)

#### Pipeline 启动日志

```
╔════════════════════════════════════════════════════════════════╗
║          Embedded AI Agent Pipeline - START                  ║
╚════════════════════════════════════════════════════════════════╝
[Pipeline] ⏰ Start time: 2024-01-15T10:30:45.123Z
[Pipeline] 📋 Pipeline configuration:
[Pipeline]   • Datasheet: BF7615CMXX.pdf
[Pipeline]   • Schematic: schematic.pdf
[Pipeline]   • Instruction length: 256 chars
[Pipeline]   • Output path: Auto-generated
```

#### 步骤 1: 寄存器提取

```
═══════════════════════════════════════════════════════════════════
[Pipeline] 📦 STEP 1/3: Extract Register Information
═══════════════════════════════════════════════════════════════════
[Pipeline] 📖 Extracting text from datasheet...
[Pipeline]   ✓ Text extraction completed in 2.34s
[Pipeline]   • Original text length: 45678 characters
[Pipeline]   • Estimated pages: ~15
[Pipeline]   • Kept: 100.0% of original
[Pipeline] 📝 Loading prompt templates...
[Pipeline]   ✓ Templates loaded
[Pipeline]   • Total prompt length: 50000 characters
[Pipeline] 🤖 Calling Qwen API to extract registers...
[Pipeline]   • Model: qwen-plus
[Pipeline]   • Temperature: 0.3
[Pipeline]   • MaxTokens: 8000
[Pipeline]   ✓ API call completed in 15.67s
[Pipeline] 📊 Analyzing API response...
[Pipeline]   • Response length: 3456 characters
[Pipeline]   • Response preview: {"registers":[...
[Pipeline]   ✓ JSON parsed successfully
[Pipeline] Successfully extracted 15 registers
[Pipeline] ✅ Step 1 completed in 18234ms (18.23s)
[Pipeline] 📊 Extracted data:
[Pipeline]   • Registers: 15
[Pipeline]   • Data size: 3456 bytes
```

#### 步骤 2: 原理图解析

```
═══════════════════════════════════════════════════════════════════
[Pipeline] 🔌 STEP 2/3: Parse Schematic
═══════════════════════════════════════════════════════════════════
[Pipeline] ⚡ Detected PDF schematic, attempting auto-conversion...
[PDF Converter] 🔧 Using ImageMagick for conversion
[PDF Converter] ⏰ Start time: 2024-01-15T10:31:03.456Z
[PDF Converter] 📊 Input file info:
[PDF Converter]   • Size: 1234.56 KB
[PDF Converter]   • Path: /path/to/schematic.pdf
[PDF Converter] 🎨 Conversion settings:
[PDF Converter]   • DPI: 300
[PDF Converter]   • Output: /path/to/output.png
[PDF Converter] 🚀 Executing command: magick convert -density 300...
[PDF Converter]   ✓ Command completed in 3456ms (3.46s)
[PDF Converter] ✅ Conversion successful!
[PDF Converter] 📊 Output file info:
[PDF Converter]   • Size: 2345.67 KB
[PDF Converter]   • Path: /path/to/output.png
[PDF Converter]   • Compression ratio: 52.6%
[PDF Converter] ⏱️  Total conversion time: 3567ms (3.57s)
[Pipeline] 📊 Schematic Processing Info:
[Pipeline]   - Original path: schematic.pdf
[Pipeline]   - Actual path: output.png
[Pipeline]   - Is image: true
[Pipeline]   - Model to use: Vision (✓ Can see graphics)
[Pipeline] Schematic is an image, using Vision model...
[Pipeline] ✅ Step 2 completed in 25678ms (25.68s)
[Pipeline] 📊 Extracted data:
[Pipeline]   • Pin mappings: 8
[Pipeline]   • Input pins: 3
[Pipeline]   • Output pins: 5
[Pipeline]   • Data size: 1234 bytes
```

#### 步骤 3: 代码生成

```
═══════════════════════════════════════════════════════════════════
[Pipeline] 💻 STEP 3/3: Generate C Code
═══════════════════════════════════════════════════════════════════
[Pipeline] Calling Qwen API to generate code...
[Pipeline] ✅ Step 3 completed in 12345ms (12.35s)
[Pipeline] 📊 Generated code:
[Pipeline]   • Lines: 123
[Pipeline]   • Characters: 3456
[Pipeline]   • Size: 3.38 KB
[Pipeline] 💾 Saving generated code...
[Pipeline]   • Output path: /path/to/output.c
[Pipeline]   • Encoding: UTF-8 with BOM
[Pipeline]   ✓ File saved successfully
```

#### Pipeline 总结

```
═══════════════════════════════════════════════════════════════════
[Pipeline] 📊 PIPELINE SUMMARY
═══════════════════════════════════════════════════════════════════
[Pipeline] ⏱️  Total execution time: 56789ms (56.79s)
[Pipeline] 📈 Step timings:
[Pipeline]   1. Extract Registers: 18234ms (18.23s) - 32.1%
[Pipeline]   2. Parse Schematic: 25678ms (25.68s) - 45.2%
[Pipeline]   3. Generate Code: 12345ms (12.35s) - 21.7%
[Pipeline] 📁 Output file: generated_1234567890.c
[Pipeline] ✅ Status: SUCCESS

╔════════════════════════════════════════════════════════════════╗
║         Pipeline Completed Successfully! 🎉                   ║
╚════════════════════════════════════════════════════════════════╝
```

---

### 3. Qwen API (`src/qwen_api.js`)

#### 文本模型调用

```
──────────────────────────────────────────────────
[Qwen Text API] 🔄 Attempt 1/3
[Qwen Text API] ⏰ Start time: 2024-01-15T10:30:50.123Z
[Qwen Text API] 📊 Request details:
[Qwen Text API]   • Model: qwen-plus
[Qwen Text API]   • Temperature: 0.3
[Qwen Text API]   • Max tokens: 8000
[Qwen Text API]   • Messages: 2
[Qwen Text API]   • Total chars: 45678
[Qwen Text API]   • Timeout: 120000ms (120s)
──────────────────────────────────────────────────
[Qwen Text API] ✅ Success!
[Qwen Text API] ⏱️  API call time: 15678ms (15.68s)
[Qwen Text API] 📈 Token usage:
[Qwen Text API]   • Input tokens: 12345
[Qwen Text API]   • Output tokens: 2345
[Qwen Text API]   • Total tokens: 14690
[Qwen Text API] 📝 Response preview: {"registers":[{"address":"0x4002...
[Qwen Text API] 📏 Response length: 3456 characters
```

#### 视觉模型调用

```
──────────────────────────────────────────────────
[Qwen Vision API] 🔄 Attempt 1/3
[Qwen Vision API] ⏰ Start time: 2024-01-15T10:31:15.456Z
[Qwen Vision API] 📊 Request details:
[Qwen Vision API]   • Model: qwen-vl-plus
[Qwen Vision API]   • Temperature: 0.3
[Qwen Vision API]   • Max tokens: 4000
[Qwen Vision API]   • Image size: 2345.67 KB
[Qwen Vision API]   • Base64 size: 3123456 chars
[Qwen Vision API]   • Prompt length: 1234 chars
[Qwen Vision API]   • Timeout: 120000ms (120s)
──────────────────────────────────────────────────
[Qwen Vision API] ✅ Success!
[Qwen Vision API] ⏱️  API call time: 22345ms (22.35s)
[Qwen Vision API] 📈 Token usage:
[Qwen Vision API]   • Input tokens: 15678
[Qwen Vision API]   • Output tokens: 1234
[Qwen Vision API]   • Total tokens: 16912
[Qwen Vision API] 📝 Response preview: {"pin_mappings":[{"mcu_pin":"PA0"...
[Qwen Vision API] 📏 Response length: 2345 characters
```

#### 错误和重试日志

```
[Qwen Text API] ❌ Error on attempt 1 (after 5678ms):
[Qwen Text API]   • Error type: AxiosError
[Qwen Text API]   • Error message: Request timeout
[Qwen Text API]   • Reason: Request timeout (exceeded 120000ms)
[Qwen Text API]   • HTTP Status: 408 Request Timeout
[Qwen Text API] 🔄 Retrying in 2000ms... (2 retries left)
```

---

### 4. PDF 转换器 (`src/pdf_converter.js`)

#### ImageMagick 转换

```
[PDF Converter] 🔧 Using ImageMagick for conversion
[PDF Converter] ⏰ Start time: 2024-01-15T10:31:03.456Z
[PDF Converter] 📊 Input file info:
[PDF Converter]   • Size: 1234.56 KB
[PDF Converter]   • Path: /path/to/input.pdf
[PDF Converter] 🎨 Conversion settings:
[PDF Converter]   • DPI: 300
[PDF Converter]   • Output: /path/to/output.png
[PDF Converter] 🚀 Executing command: magick convert -density 300...
[PDF Converter]   ✓ Command completed in 3456ms (3.46s)
[PDF Converter] 📄 Multi-page PDF detected:
[PDF Converter]   • Total pages: 3
[PDF Converter]   • Using first page: output-0.png
[PDF Converter] ✅ Conversion successful!
[PDF Converter] 📊 Output file info:
[PDF Converter]   • Size: 2345.67 KB
[PDF Converter]   • Path: /path/to/output-0.png
[PDF Converter]   • Compression ratio: 52.6%
[PDF Converter] ⏱️  Total conversion time: 3567ms (3.57s)
```

---

## 日志查看方法

### 1. 实时查看日志（推荐）

在终端运行 API 服务器时，日志会实时输出：

```powershell
cd embedded-ai-agent
node api_server.js
```

### 2. 使用测试脚本查看完整流程

```powershell
# 测试 Datasheet + Schematic
node test_pdf_detailed.mjs

# 测试 PDF Schematic
node test_pdf_schematic.mjs
```

### 3. 保存日志到文件

```powershell
# 将日志保存到文件
node api_server.js > logs/api_$(Get-Date -Format 'yyyyMMdd_HHmmss').log 2>&1

# 或者使用 PowerShell 的 Tee-Object 同时显示和保存
node api_server.js 2>&1 | Tee-Object -FilePath "logs/api.log"
```

### 4. 过滤特定模块日志

```powershell
# 只查看 Pipeline 日志
node api_server.js 2>&1 | Select-String -Pattern "\[Pipeline\]"

# 只查看错误日志
node api_server.js 2>&1 | Select-String -Pattern "❌|Error|Failed"

# 只查看性能统计
node api_server.js 2>&1 | Select-String -Pattern "⏱️|elapsed|time"
```

---

## 性能分析

### 查看各步骤耗时

Pipeline 总结中会显示每个步骤的耗时和百分比：

```
[Pipeline] 📈 Step timings:
[Pipeline]   1. Extract Registers: 18234ms (18.23s) - 32.1%
[Pipeline]   2. Parse Schematic: 25678ms (25.68s) - 45.2%
[Pipeline]   3. Generate Code: 12345ms (12.35s) - 21.7%
```

**性能优化建议：**

- **寄存器提取（~30-35%）**: 主要取决于 Datasheet 大小和 API 响应时间
  - 优化：压缩 Datasheet 文本
  - 优化：使用更快的模型

- **原理图解析（~40-50%）**: 包含 PDF 转换和 Vision 模型调用
  - 优化：直接提供 PNG/JPG 格式
  - 优化：降低图片 DPI（如 200）
  - 优化：使用 ImageMagick 而非 Ghostscript

- **代码生成（~20-25%）**: 纯文本生成，速度较快
  - 优化：减少 prompt 长度
  - 优化：降低 maxTokens

### Token 使用统计

API 调用日志中会显示 token 使用情况：

```
[Qwen Text API] 📈 Token usage:
[Qwen Text API]   • Input tokens: 12345
[Qwen Text API]   • Output tokens: 2345
[Qwen Text API]   • Total tokens: 14690
```

**成本估算：**
- qwen-plus: ~0.008 元/千tokens
- qwen-vl-plus: ~0.01 元/千tokens

示例：14690 tokens ≈ 0.12 元

---

## 故障排查

### 常见问题和对应日志

#### 1. PDF 转换失败

**日志特征：**
```
[PDF Converter] ❌ ImageMagick conversion failed after 3567ms
[PDF Converter]   • Error: Command failed: magick convert...
[Pipeline] ❌ PDF conversion failed: ImageMagick conversion failed
```

**解决方法：**
1. 检查 ImageMagick 是否正确安装：`magick --version`
2. 检查 Ghostscript 是否正确安装：`gswin64c -version`
3. 参考 `PUBLIC_ACCESS_GUIDE.md` 的安装说明

#### 2. API 超时

**日志特征：**
```
[Qwen Text API] ❌ Error on attempt 1 (after 120000ms):
[Qwen Text API]   • Error type: AxiosError
[Qwen Text API]   • Reason: Request timeout (exceeded 120000ms)
```

**解决方法：**
1. 检查网络连接
2. 增加超时时间（修改 `qwen_api.js` 中的 `API_TIMEOUT`）
3. 减小输入文本长度

#### 3. JSON 解析失败

**日志特征：**
```
[Pipeline] ⚠️  JSON parse error: Unexpected token...
[Pipeline]   • Attempting to fix JSON...
[Pipeline] ✓ Successfully fixed and parsed JSON
```

或：

```
[Pipeline] ✗ Still unable to parse JSON after fixing
[Pipeline] Error: Unexpected token...
[Pipeline] Saved debug files to out/debug_register_*.txt
```

**解决方法：**
1. 检查 `out/debug_register_response.txt` 查看原始响应
2. 检查 `out/debug_register_fixed.txt` 查看修复后的 JSON
3. 调整 prompt 模板，明确要求返回合法 JSON
4. 增加 maxTokens 避免截断

#### 4. 中文乱码

**日志特征：**
```
[Pipeline] 💾 Saving generated code...
[Pipeline]   • Encoding: UTF-8 with BOM
```

如果没有看到 "UTF-8 with BOM"，说明编码可能有问题。

**解决方法：**
参考 `ENCODING_FIX_GUIDE.md` 和 `ENCODING_FIX_SUMMARY.md`

---

## 最佳实践

### 1. 开发和调试时

- ✅ **使用测试脚本**：`test_pdf_detailed.mjs` 等
- ✅ **实时查看日志**：直接在终端运行
- ✅ **保留完整日志**：方便回溯分析
- ✅ **使用日志过滤**：快速定位问题

### 2. 生产环境

- ✅ **启用日志文件**：保存所有日志到文件
- ✅ **设置日志轮转**：防止日志文件过大
- ✅ **监控关键指标**：耗时、token 使用、错误率
- ✅ **设置告警**：错误率超过阈值时通知

### 3. 性能优化

- ✅ **分析 Step timings**：找出性能瓶颈
- ✅ **监控 Token usage**：控制成本
- ✅ **优化输入格式**：使用合适的文件格式和大小
- ✅ **调整超时设置**：根据实际情况调整

### 4. 故障排查

- ✅ **完整保存错误日志**：包括时间戳和上下文
- ✅ **检查 debug 文件**：`out/debug_*.txt`
- ✅ **对比成功案例**：找出差异
- ✅ **逐步缩小范围**：从模块到函数到行

---

## 日志配置（高级）

### 修改日志详细级别

如果需要更详细或更简洁的日志，可以修改各模块的日志输出：

#### 简化日志（只保留关键信息）

编辑 `src/qwen_api.js`，注释掉详细日志：

```javascript
// console.log(`[Qwen Text API] 📊 Request details:`);
// console.log(`[Qwen Text API]   • Model: ${TEXT_MODEL}`);
// ...
```

#### 增加调试日志

在关键位置添加更多日志：

```javascript
console.log(`[DEBUG] Variable value: ${JSON.stringify(myVar)}`);
console.log(`[DEBUG] Function called with args: ${JSON.stringify(arguments)}`);
```

### 集成日志库（可选）

对于大型项目，推荐使用专业日志库如 `winston` 或 `pino`：

```bash
npm install winston
```

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

logger.info('Pipeline started', { datasheet: 'BF7615CMXX.pdf' });
```

---

## 总结

本系统提供了非常详细的日志记录，涵盖：

✅ **请求追踪**：每个请求有唯一 ID  
✅ **性能监控**：每个步骤的耗时统计  
✅ **资源使用**：Token 使用、文件大小等  
✅ **错误诊断**：详细的错误信息和堆栈  
✅ **进度可视化**：清晰的步骤和进度提示  

通过合理使用这些日志，您可以：

- 🔍 快速定位问题
- 📊 分析性能瓶颈
- 💰 优化成本（Token 使用）
- 🚀 持续改进系统

---

## 相关文档

- [日志快速入门](LOGGING_QUICK_START.md)
- [日志完整指南](LOGGING_GUIDE.md)
- [故障排查指南](TROUBLESHOOTING.md)
- [编码修复指南](ENCODING_FIX_GUIDE.md)
- [公共 API 使用指南](PUBLIC_API_USER_GUIDE.md)

---

**最后更新**: 2024-01-15  
**版本**: 2.0  
**维护者**: Embedded AI Agent Team
