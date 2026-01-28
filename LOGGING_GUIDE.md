# 📊 查看生成代码时的日志输出指南

## 🎯 日志输出位置

### 方法 1：API 服务器控制台（最详细）⭐

**在哪里看**：
- 运行 `.\start_services.ps1` 后的 PowerShell 窗口
- API 服务器会在后台运行并输出实时日志

**看到的内容**：
```
========================================
Step 1: Extracting Register Information
========================================

[Pipeline] Datasheet text length: 45234 characters
[Pipeline] Text too long (50000 chars), truncating to 50000 chars
[Pipeline] Calling Qwen API to extract registers...
[Qwen Text API] Attempt 1/3
[Qwen Text API] Using model: qwen-plus
[Qwen Text API] Temperature: 0.3
[Qwen Text API] MaxTokens: 8000
[Qwen Text API] Success
[Pipeline] API response length: 12345 characters
[Pipeline] Successfully extracted 15 registers

========================================
Step 2: Parsing Schematic
========================================

[Pipeline] ⚡ Detected PDF schematic, attempting auto-conversion...
[PDF Converter] Converting PDF to image...
[PDF Converter] DPI: 300
[PDF Converter] Output: temp/schematic_1234567890.png
[Pipeline] ✓ PDF converted successfully to: temp/schematic_1234567890.png
[Pipeline] ✓ Will use Vision model for schematic analysis

[Pipeline] 📊 Schematic Processing Info:
[Pipeline]   - Original path: Schematic Prints.pdf
[Pipeline]   - Actual path: temp/schematic_1234567890.png
[Pipeline]   - Is image: true
[Pipeline]   - Model to use: Vision (✓ Can see graphics)

[Pipeline] Schematic is an image, using Vision model...
[Qwen Vision API] Attempt 1/3
[Qwen Vision API] Using model: qwen-vl-plus
[Qwen Vision API] Image size: 234567 bytes
[Qwen Vision API] Success
[Pipeline] Successfully parsed 25 pin mappings

========================================
Step 3: Generating Code
========================================

[Pipeline] Generating C code based on extracted data...
[Pipeline] Using final template...
[Qwen Text API] Attempt 1/3
[Qwen Text API] Using model: qwen-plus
[Qwen Text API] Success
[Pipeline] Code generation completed

[Pipeline] Writing code to: out/generated_1234567890.c
[Pipeline] Code written to: out/generated_1234567890.c
[Pipeline] Encoding: UTF-8 with BOM (for proper Chinese character display)

╔════════════════════════════════════════╗
║   Pipeline Completed Successfully!     ║
╚════════════════════════════════════════╝

Total time: 45.23s
```

---

### 方法 2：查看后台运行的日志

如果服务在后台运行，可以通过以下方式查看：

#### 2.1 打开新的 PowerShell 窗口查看进程
```powershell
# 查找 node 进程
Get-Process | Where-Object { $_.ProcessName -eq "node" }

# 输出示例：
# Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName
# -------  ------    -----      -----     ------     --  -- -----------
#     234      45    67890      89012      12.34  12345   1 node
```

#### 2.2 重新附加到 API 服务器
```powershell
# 停止后台服务
.\stop_services.ps1

# 在前台启动（可以看到日志）
npm run api
# 或
node embedded-ai-agent/api_server.js
```

---

### 方法 3：启用详细日志模式

修改 `api_server.js` 添加更详细的日志：

```javascript
// 在文件开头添加
const DEBUG = true;  // 启用调试模式

// 在请求处理中
app.post('/api/v1/generate', upload.fields([...]), async (req, res) => {
    const requestId = Date.now();
    console.log(`\n${'='.repeat(70)}`);
    console.log(`[${requestId}] 🔵 New request received`);
    console.log(`${'='.repeat(70)}`);
    
    if (DEBUG) {
        console.log(`[${requestId}] Request details:`, {
            datasheet: req.files.datasheet?.[0]?.originalname,
            schematic: req.files.schematic?.[0]?.originalname,
            instruction_length: req.body.instruction?.length
        });
    }
    
    // ...existing code...
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`[${requestId}] ✅ Request completed`);
    console.log(`${'='.repeat(70)}\n`);
});
```

---

### 方法 4：使用日志文件

创建一个日志记录脚本：

```powershell
# log_api_server.ps1
# 启动 API 服务器并记录日志到文件

$logFile = "api_server_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"
Write-Host "Starting API server with logging to: $logFile" -ForegroundColor Yellow

# 启动并重定向输出
node api_server.js 2>&1 | Tee-Object -FilePath $logFile

# 使用方法：
# cd embedded-ai-agent
# .\log_api_server.ps1
```

---

## 📋 关键日志说明

### 寄存器提取阶段
```
[Pipeline] Datasheet text length: XXX characters
```
- 显示数据手册文本长度
- 如果太长会自动截断

```
[Pipeline] Successfully extracted X registers
```
- X = 提取的寄存器数量
- 0 表示未找到寄存器（可能需要更好的 datasheet）

### 原理图解析阶段
```
[Pipeline] Model to use: Vision (✓) / Text (⚠️)
```
- **Vision** ✅ - 使用视觉模型，能"看到"原理图图形
- **Text** ⚠️ - 使用文本模型，只能分析文本（会导致引脚映射为空）

```
[Pipeline] Successfully parsed X pin mappings
```
- X = 识别的引脚数量
- 0 表示原理图解析失败（检查是否使用了 Vision 模型）

### 代码生成阶段
```
[Pipeline] Code generation completed
```
- 表示 AI 成功生成代码

```
[Pipeline] Encoding: UTF-8 with BOM
```
- 确认文件使用 UTF-8 BOM 编码
- 保证中文注释正确显示

---

## 🔍 诊断问题

### 问题 1：看不到日志
**原因**：服务在后台运行

**解决**：
```powershell
# 停止后台服务
.\stop_services.ps1

# 前台启动查看日志
cd embedded-ai-agent
npm run api
```

### 问题 2：日志太多太快
**解决**：记录到文件
```powershell
npm run api 2>&1 | Tee-Object -FilePath "api.log"
```

### 问题 3：想看更详细的 AI 响应
**修改 `src/qwen_api.js`**：
```javascript
// 在 callTextModel 函数中添加
console.log(`[Qwen] Response preview:`, result.substring(0, 200));

// 在 callVisionModel 函数中添加
console.log(`[Qwen Vision] Response preview:`, result.substring(0, 200));
```

---

## 🛠️ 实用命令

### 查看实时日志
```powershell
# 方法 A：前台运行
cd "f:\LLM4EDA\公司文件\demo generation\embedded-ai-agent"
npm run api

# 方法 B：记录到文件并实时显示
npm run api 2>&1 | Tee-Object -FilePath "api_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"

# 方法 C：只记录到文件
npm run api > api.log 2>&1
```

### 过滤特定日志
```powershell
# 只看 Pipeline 日志
npm run api 2>&1 | Select-String "Pipeline"

# 只看错误
npm run api 2>&1 | Select-String "error|Error|ERROR"

# 只看成功消息
npm run api 2>&1 | Select-String "Success|✓|✅"
```

### 监控日志文件
```powershell
# 实时查看日志文件（类似 tail -f）
Get-Content -Path "api.log" -Wait
```

---

## 📊 日志级别说明

| 前缀 | 含义 | 示例 |
|------|------|------|
| `[Pipeline]` | 主流程日志 | `[Pipeline] Step 1: Extracting...` |
| `[Qwen API]` | AI 模型调用 | `[Qwen Text API] Success` |
| `[API]` | API 服务器 | `[API] New request received` |
| `[PDF Converter]` | PDF 转换 | `[PDF Converter] Converting...` |
| `✓` | 成功 | `✓ Health check passed` |
| `✗` / `❌` | 失败 | `✗ File not found` |
| `⚠️` | 警告 | `⚠️ Using text model` |
| `ℹ️` | 信息 | `ℹ️ Waiting for response...` |

---

## 🎯 推荐做法

### 开发/调试时
```powershell
# 前台运行，看到所有日志
cd embedded-ai-agent
npm run api
```

### 生产环境
```powershell
# 后台运行，日志记录到文件
npm run api > logs/api_$(Get-Date -Format 'yyyy-MM-dd').log 2>&1 &
```

### 测试时
```powershell
# 同时看客户端和服务器日志
# 终端 1：启动服务器（前台）
cd embedded-ai-agent
npm run api

# 终端 2：运行测试
cd ..
node test_upload.mjs
```

---

## 📝 完整示例

**终端 1 - 启动 API 服务器（可看到日志）**：
```powershell
PS> cd "f:\LLM4EDA\公司文件\demo generation\embedded-ai-agent"
PS> npm run api

> embedded-ai-agent@1.0.0 api
> node api_server.js

╔═══════════════════════════════════════════════════════════════════════╗
║              🤖 AI-Powered Embedded Code Generator API 🚀             ║
╚═══════════════════════════════════════════════════════════════════════╝

✅ Server Configuration:
   • Port: 8080
   • Mode: Production
   • Max File Size: 50 MB
   • Supported Formats: PDF, PNG, JPG, JPEG

🌐 Server Status:
   ✓ HTTP server listening on port 8080
   ✓ API endpoint: http://localhost:8080/api/v1/generate
   ✓ Health check: http://localhost:8080/api/v1/health
   ✓ API docs: http://localhost:8080/api/v1/docs

✨ Server ready! Press Ctrl+C to stop.

# 等待请求...
```

**终端 2 - 运行测试（触发代码生成）**：
```powershell
PS> cd "f:\LLM4EDA\公司文件\demo generation"
PS> node test_upload.mjs

╔════════════════════════════════════════════════════════════════╗
║          🧪 API File Upload Test - Real Files                 ║
╚════════════════════════════════════════════════════════════════╝

[1/6] Getting ngrok public URL...
   ✓ Public URL: https://xxx.ngrok-free.dev

[2/6] Checking test files...
   ✓ Datasheet: BF7615CMXX.pdf (234.56 KB)
   ✓ Schematic: Schematic Prints.jpg (128.90 KB)

[3/6] Preparing API request...
   ✓ Files ready for upload

[4/6] Uploading files and generating code...
   ⏳ This may take 1-3 minutes...
```

**同时，终端 1 会显示详细的处理日志**：
```
[API] 📥 New request received
[API] Datasheet: BF7615CMXX.pdf
[API] Schematic: Schematic Prints.jpg

========================================
Step 1: Extracting Register Information
========================================

[Pipeline] Datasheet text length: 45234 characters
[Pipeline] Calling Qwen API to extract registers...
[Qwen Text API] Success
[Pipeline] Successfully extracted 15 registers

========================================
Step 2: Parsing Schematic
========================================

[Pipeline] Schematic is an image, using Vision model...
[Qwen Vision API] Success
[Pipeline] Successfully parsed 25 pin mappings

========================================
Step 3: Generating Code
========================================

[Pipeline] Code generation completed
[Pipeline] Code written to: out/generated_xxx.c
[Pipeline] Encoding: UTF-8 with BOM

╔════════════════════════════════════════╗
║   Pipeline Completed Successfully!     ║
╚════════════════════════════════════════╝

Total time: 45.23s

[API] ✅ Request completed
```

---

## ✅ 总结

**查看日志的最佳方式**：

1. **开发/测试**：前台运行 API 服务器
   ```powershell
   cd embedded-ai-agent
   npm run api
   ```

2. **生产环境**：后台运行 + 日志文件
   ```powershell
   npm run api > api.log 2>&1
   ```

3. **详细诊断**：启用 DEBUG 模式并记录日志

4. **实时监控**：使用 `Get-Content -Wait` 查看日志文件

**日志包含的信息**：
- ✅ 每个步骤的进度
- ✅ 文件大小和处理时间
- ✅ 使用的 AI 模型（Text/Vision）
- ✅ 提取的寄存器和引脚数量
- ✅ 错误和警告信息
- ✅ 编码和文件保存信息

现在你可以完整地看到代码生成的整个过程！🎉
