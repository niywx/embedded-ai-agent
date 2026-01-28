# 日志输出示例 (Log Examples)

本文档展示系统在不同场景下的实际日志输出示例，帮助您理解和使用日志系统。

---

## 📋 目录

1. [完整成功案例](#完整成功案例)
2. [PDF 转换场景](#pdf-转换场景)
3. [错误处理场景](#错误处理场景)
4. [性能分析示例](#性能分析示例)

---

## 完整成功案例

### 场景：使用 Datasheet (PDF) + Schematic (PDF) 生成代码

```
═══════════════════════════════════════════════════════════════════
[API] 📥 New Request Received (ID: 1705312845123)
═══════════════════════════════════════════════════════════════════
[API] 📋 Request Details:
[API]   • Client IP: ::1
[API]   • Timestamp: 2024-01-15T10:30:45.123Z
[API]   • User-Agent: node-fetch/2.6.1

[API] 📁 Uploaded Files:
[API]   ✓ Datasheet:
[API]     - Name: BF7615CMXX.pdf
[API]     - Size: 2345.67 KB
[API]     - Type: application/pdf
[API]     - Temp path: F:\LLM4EDA\公司文件\demo generation\embedded-ai-agent\temp\1705312845123-abc123.pdf
[API]   ✓ Schematic:
[API]     - Name: Schematic Prints.pdf
[API]     - Size: 1234.56 KB
[API]     - Type: application/pdf
[API]     - Format: .PDF
[API]     - Temp path: F:\LLM4EDA\公司文件\demo generation\embedded-ai-agent\temp\1705312845124-xyz789.pdf

[API] 📝 Instruction:
[API]   • Length: 256 characters
[API]   • Preview: 生成一个初始化函数，包括系统时钟配置、GPIO 配置、以及根据原理图配置所需的引脚功能和电平状态。确保代码包含中文注释。

═══════════════════════════════════════════════════════════════════

╔════════════════════════════════════════════════════════════════╗
║          Embedded AI Agent Pipeline - START                  ║
╚════════════════════════════════════════════════════════════════╝
[Pipeline] ⏰ Start time: 2024-01-15T10:30:45.456Z
[Pipeline] 📋 Pipeline configuration:
[Pipeline]   • Datasheet: BF7615CMXX.pdf
[Pipeline]   • Schematic: Schematic Prints.pdf
[Pipeline]   • Instruction length: 256 chars
[Pipeline]   • Output path: Auto-generated


═══════════════════════════════════════════════════════════════════
[Pipeline] 📦 STEP 1/3: Extract Register Information
═══════════════════════════════════════════════════════════════════

========================================
Step 1: Extracting Register Information
========================================

[Pipeline] 📖 Extracting text from datasheet...
[Pipeline]   ✓ Text extraction completed in 2.34s
[Pipeline]   • Original text length: 45678 characters
[Pipeline]   • Estimated pages: ~15
[Pipeline]   • Kept: 100.0% of original
[Pipeline] 📝 Loading prompt templates...
[Pipeline]   ✓ Templates loaded
[Pipeline]   • Total prompt length: 50234 characters
[Pipeline] 🤖 Calling Qwen API to extract registers...
[Pipeline]   • Model: qwen-plus
[Pipeline]   • Temperature: 0.3
[Pipeline]   • MaxTokens: 8000

──────────────────────────────────────────────────
[Qwen Text API] 🔄 Attempt 1/3
[Qwen Text API] ⏰ Start time: 2024-01-15T10:30:48.123Z
[Qwen Text API] 📊 Request details:
[Qwen Text API]   • Model: qwen-plus
[Qwen Text API]   • Temperature: 0.3
[Qwen Text API]   • Max tokens: 8000
[Qwen Text API]   • Messages: 2
[Qwen Text API]   • Total chars: 52145
[Qwen Text API]   • Timeout: 120000ms (120s)
──────────────────────────────────────────────────
[Qwen Text API] ✅ Success!
[Qwen Text API] ⏱️  API call time: 15678ms (15.68s)
[Qwen Text API] 📈 Token usage:
[Qwen Text API]   • Input tokens: 12845
[Qwen Text API]   • Output tokens: 2567
[Qwen Text API]   • Total tokens: 15412
[Qwen Text API] 📝 Response preview: {"registers":[{"address":"0x40021000","name":"RCC_CR","description":"时钟控制寄存器","fields":[{"bit_range":"0","name":"HSION","description":"内部高速时钟使能","value":"0x1"},{"bit_range":"1","name":"HSIRDY","description":"内部高速时钟就绪标志...
[Qwen Text API] 📏 Response length: 4321 characters

[Pipeline]   ✓ API call completed in 15.68s
[Pipeline] 📊 Analyzing API response...
[Pipeline]   • Response length: 4321 characters
[Pipeline]   • Response preview: {"registers":[{"address":"0x40021000","name":"RCC_CR","description":"时钟控制寄存器"...
[Pipeline]   ✓ JSON parsed successfully
[Pipeline] Successfully extracted 15 registers

[Pipeline] ✅ Step 1 completed in 18234ms (18.23s)
[Pipeline] 📊 Extracted data:
[Pipeline]   • Registers: 15
[Pipeline]   • Data size: 4321 bytes


═══════════════════════════════════════════════════════════════════
[Pipeline] 🔌 STEP 2/3: Parse Schematic
═══════════════════════════════════════════════════════════════════

========================================
Step 2: Parsing Schematic
========================================

[Pipeline] ⚡ Detected PDF schematic, attempting auto-conversion...

[PDF Converter] 🔧 Using ImageMagick for conversion
[PDF Converter] ⏰ Start time: 2024-01-15T10:31:03.901Z
[PDF Converter] 📊 Input file info:
[PDF Converter]   • Size: 1234.56 KB
[PDF Converter]   • Path: F:\LLM4EDA\公司文件\demo generation\embedded-ai-agent\temp\1705312845124-xyz789.pdf
[PDF Converter] 🎨 Conversion settings:
[PDF Converter]   • DPI: 300
[PDF Converter]   • Output: F:\LLM4EDA\公司文件\demo generation\embedded-ai-agent\temp\Schematic Prints_1705312863901.png
[PDF Converter] 🚀 Executing command: magick convert -density 300 "F:\LLM4EDA\公司文件\demo generation\embedded-ai...
[PDF Converter]   ✓ Command completed in 3456ms (3.46s)
[PDF Converter] ✅ Conversion successful!
[PDF Converter] 📊 Output file info:
[PDF Converter]   • Size: 2345.67 KB
[PDF Converter]   • Path: F:\LLM4EDA\公司文件\demo generation\embedded-ai-agent\temp\Schematic Prints_1705312863901.png
[PDF Converter]   • Compression ratio: 52.6%
[PDF Converter] ⏱️  Total conversion time: 3567ms (3.57s)

[Pipeline] ✓ PDF converted successfully to: F:\LLM4EDA\公司文件\demo generation\embedded-ai-agent\temp\Schematic Prints_1705312863901.png
[Pipeline] ✓ Will use Vision model for schematic analysis
[Pipeline] 📊 Schematic Processing Info:
[Pipeline]   - Original path: Schematic Prints.pdf
[Pipeline]   - Actual path: Schematic Prints_1705312863901.png
[Pipeline]   - Is image: true
[Pipeline]   - Model to use: Vision (✓ Can see graphics)
[Pipeline] Schematic is an image, using Vision model...

──────────────────────────────────────────────────
[Qwen Vision API] 🔄 Attempt 1/3
[Qwen Vision API] ⏰ Start time: 2024-01-15T10:31:07.567Z
[Qwen Vision API] 📊 Request details:
[Qwen Vision API]   • Model: qwen-vl-plus
[Qwen Vision API]   • Temperature: 0.3
[Qwen Vision API]   • Max tokens: 4000
[Qwen Vision API]   • Image size: 2345.67 KB
[Qwen Vision API]   • Base64 size: 3123456 chars
[Qwen Vision API]   • Prompt length: 1567 chars
[Qwen Vision API]   • Timeout: 120000ms (120s)
──────────────────────────────────────────────────
[Qwen Vision API] ✅ Success!
[Qwen Vision API] ⏱️  API call time: 22345ms (22.35s)
[Qwen Vision API] 📈 Token usage:
[Qwen Vision API]   • Input tokens: 15678
[Qwen Vision API]   • Output tokens: 1456
[Qwen Vision API]   • Total tokens: 17134
[Qwen Vision API] 📝 Response preview: {"pin_mappings":[{"mcu_pin":"PA0","component_pin":"LED1","description":"LED 指示灯1"},{"mcu_pin":"PA1","component_pin":"LED2","description":"LED 指示灯2"},{"mcu_pin":"PA2","component_pin":"KEY1","descrip...
[Qwen Vision API] 📏 Response length: 2456 characters

[Pipeline] Successfully parsed 8 pin mappings

[Pipeline] ✅ Step 2 completed in 26234ms (26.23s)
[Pipeline] 📊 Extracted data:
[Pipeline]   • Pin mappings: 8
[Pipeline]   • Input pins: 3
[Pipeline]   • Output pins: 5
[Pipeline]   • Data size: 2456 bytes


═══════════════════════════════════════════════════════════════════
[Pipeline] 💻 STEP 3/3: Generate C Code
═══════════════════════════════════════════════════════════════════

========================================
Step 3: Generating C Code
========================================

[Pipeline] Calling Qwen API to generate code...

──────────────────────────────────────────────────
[Qwen Text API] 🔄 Attempt 1/3
[Qwen Text API] ⏰ Start time: 2024-01-15T10:31:33.901Z
[Qwen Text API] 📊 Request details:
[Qwen Text API]   • Model: qwen-plus
[Qwen Text API]   • Temperature: 0.5
[Qwen Text API]   • Max tokens: 4000
[Qwen Text API]   • Messages: 2
[Qwen Text API]   • Total chars: 8234
[Qwen Text API]   • Timeout: 120000ms (120s)
──────────────────────────────────────────────────
[Qwen Text API] ✅ Success!
[Qwen Text API] ⏱️  API call time: 12345ms (12.35s)
[Qwen Text API] 📈 Token usage:
[Qwen Text API]   • Input tokens: 2345
[Qwen Text API]   • Output tokens: 1567
[Qwen Text API]   • Total tokens: 3912
[Qwen Text API] 📝 Response preview: ```c
/**
 * @file    system_init.c
 * @brief   系统初始化代码
 * @author  AI Generated
 * @date    2024-01-15
 */

#include "stm32f10x.h"

/**
 * @brief  系统初始化函数
 * @note   包括系统时钟配置、GPIO 配置...
[Qwen Text API] 📏 Response length: 3789 characters

[Pipeline] Successfully generated 145 lines of code

[Pipeline] ✅ Step 3 completed in 12456ms (12.46s)
[Pipeline] 📊 Generated code:
[Pipeline]   • Lines: 145
[Pipeline]   • Characters: 3654
[Pipeline]   • Size: 3.57 KB

[Pipeline] 💾 Saving generated code...
[Pipeline]   • Output path: F:\LLM4EDA\公司文件\demo generation\embedded-ai-agent\out\generated_1705312845123.c
[Pipeline]   • Encoding: UTF-8 with BOM
[Pipeline]   ✓ File saved successfully


═══════════════════════════════════════════════════════════════════
[Pipeline] 📊 PIPELINE SUMMARY
═══════════════════════════════════════════════════════════════════
[Pipeline] ⏱️  Total execution time: 56924ms (56.92s)
[Pipeline] 📈 Step timings:
[Pipeline]   1. Extract Registers: 18234ms (18.23s) - 32.0%
[Pipeline]   2. Parse Schematic: 26234ms (26.23s) - 46.1%
[Pipeline]   3. Generate Code: 12456ms (12.46s) - 21.9%
[Pipeline] 📁 Output file: generated_1705312845123.c
[Pipeline] ✅ Status: SUCCESS

╔════════════════════════════════════════════════════════════════╗
║         Pipeline Completed Successfully! 🎉                   ║
╚════════════════════════════════════════════════════════════════╝


[API] 🧹 Cleaning up temporary files...
[API]   ✓ Removed: F:\LLM4EDA\公司文件\demo generation\embedded-ai-agent\temp\1705312845123-abc123.pdf
[API]   ✓ Removed: F:\LLM4EDA\公司文件\demo generation\embedded-ai-agent\temp\1705312845124-xyz789.pdf

═══════════════════════════════════════════════════════════════════
[API] ✅ Request Completed Successfully (ID: 1705312845123)
═══════════════════════════════════════════════════════════════════
[API] 📊 Generation Statistics:
[API]   • Total processing time: 56924ms (56.92s)
[API]   • Registers extracted: 15
[API]   • Pin mappings found: 8
[API]   • Generated code size: 3654 characters
[API]   • Generated code lines: 145
[API]   • Output file: generated_1705312845123.c
[API]   • Token usage total: 36458 tokens
[API]   • Estimated cost: ¥0.29
```

**关键指标：**
- 总耗时：56.92 秒
- 主要瓶颈：原理图解析（46.1%）
- Token 使用：36458 tokens
- 预估成本：¥0.29

---

## PDF 转换场景

### 场景 1：成功转换（ImageMagick）

```
[Pipeline] ⚡ Detected PDF schematic, attempting auto-conversion...

[PDF Converter] 🔧 Using ImageMagick for conversion
[PDF Converter] ⏰ Start time: 2024-01-15T10:31:03.901Z
[PDF Converter] 📊 Input file info:
[PDF Converter]   • Size: 1234.56 KB
[PDF Converter]   • Path: F:\...\temp\schematic.pdf
[PDF Converter] 🎨 Conversion settings:
[PDF Converter]   • DPI: 300
[PDF Converter]   • Output: F:\...\temp\schematic_1705312863901.png
[PDF Converter] 🚀 Executing command: magick convert -density 300 "F:\...\temp\schematic.pdf" "F:\...\temp\schematic_1705312863901.png"
[PDF Converter]   ✓ Command completed in 3456ms (3.46s)
[PDF Converter] ✅ Conversion successful!
[PDF Converter] 📊 Output file info:
[PDF Converter]   • Size: 2345.67 KB
[PDF Converter]   • Path: F:\...\temp\schematic_1705312863901.png
[PDF Converter]   • Compression ratio: 52.6%
[PDF Converter] ⏱️  Total conversion time: 3567ms (3.57s)

[Pipeline] ✓ PDF converted successfully
[Pipeline] ✓ Will use Vision model for schematic analysis
```

### 场景 2：多页 PDF 处理

```
[PDF Converter] 🔧 Using ImageMagick for conversion
[PDF Converter] 📊 Input file info:
[PDF Converter]   • Size: 3456.78 KB
[PDF Converter]   • Path: F:\...\temp\multipage.pdf
[PDF Converter] 🎨 Conversion settings:
[PDF Converter]   • DPI: 300
[PDF Converter]   • Output: F:\...\temp\multipage_1705312863901.png
[PDF Converter] 🚀 Executing command: magick convert -density 300...
[PDF Converter]   ✓ Command completed in 5678ms (5.68s)
[PDF Converter] 📄 Multi-page PDF detected:
[PDF Converter]   • Total pages: 5
[PDF Converter]   • Using first page: multipage_1705312863901-0.png
[PDF Converter] ✅ Conversion successful!
[PDF Converter] 📊 Output file info:
[PDF Converter]   • Size: 1234.56 KB
[PDF Converter]   • Path: F:\...\temp\multipage_1705312863901-0.png
[PDF Converter]   • Compression ratio: 35.7%
[PDF Converter] ⏱️  Total conversion time: 5789ms (5.79s)
```

### 场景 3：转换失败（回退到 Ghostscript）

```
[Pipeline] ⚡ Detected PDF schematic, attempting auto-conversion...

[PDF Converter] 🔧 Using ImageMagick for conversion
[PDF Converter] 📊 Input file info:
[PDF Converter]   • Size: 1234.56 KB
[PDF Converter]   • Path: F:\...\temp\schematic.pdf
[PDF Converter] 🚀 Executing command: magick convert -density 300...
[PDF Converter] ❌ ImageMagick conversion failed after 1234ms
[PDF Converter]   • Error: Command failed: 'magick' is not recognized

[PDF Converter] 👻 Using Ghostscript for conversion
[PDF Converter] ⏰ Start time: 2024-01-15T10:31:05.123Z
[PDF Converter] 📊 Input file info:
[PDF Converter]   • Size: 1234.56 KB
[PDF Converter]   • Path: F:\...\temp\schematic.pdf
[PDF Converter] 🎨 Conversion settings:
[PDF Converter]   • DPI: 300
[PDF Converter]   • Device: png16m (24-bit color)
[PDF Converter]   • Pages: First page only
[PDF Converter]   • Output: F:\...\temp\schematic_1705312865123.png
[PDF Converter] 🚀 Executing command: gswin64c -dSAFER -dBATCH -dNOPAUSE...
[PDF Converter]   ✓ Command completed in 4567ms (4.57s)
[PDF Converter] ✅ Conversion successful!
[PDF Converter] 📊 Output file info:
[PDF Converter]   • Size: 2456.78 KB
[PDF Converter]   • Path: F:\...\temp\schematic_1705312865123.png
[PDF Converter]   • Compression ratio: 50.3%
[PDF Converter] ⏱️  Total conversion time: 4678ms (4.68s)

[Pipeline] ✓ PDF converted successfully using Ghostscript
```

### 场景 4：转换完全失败

```
[Pipeline] ⚡ Detected PDF schematic, attempting auto-conversion...
[PDF Converter] ImageMagick not found, trying Ghostscript...
[PDF Converter] Ghostscript not found.

[Pipeline] ❌ PDF conversion failed: Cannot convert PDF to image. Please install one of the following tools:
1. ImageMagick: https://imagemagick.org/script/download.php
2. Ghostscript: https://www.ghostscript.com/download/gsdnld.html

Or manually convert the PDF to PNG using an online tool:
- https://www.ilovepdf.com/pdf_to_jpg
- https://smallpdf.com/pdf-to-jpg

[Pipeline] ❌ This means schematic graphics CANNOT be analyzed!
[Pipeline] 💡 Suggestion: Upload PNG/JPG format or install pdf-poppler tools
[Pipeline] ⚠️  Falling back to text extraction (will lose graphic info)...
```

---

## 错误处理场景

### 场景 1：API 超时后重试成功

```
──────────────────────────────────────────────────
[Qwen Text API] 🔄 Attempt 1/3
[Qwen Text API] ⏰ Start time: 2024-01-15T10:30:48.123Z
[Qwen Text API] 📊 Request details:
[Qwen Text API]   • Model: qwen-plus
[Qwen Text API]   • Temperature: 0.3
[Qwen Text API]   • Max tokens: 8000
[Qwen Text API]   • Timeout: 120000ms (120s)
──────────────────────────────────────────────────

[Qwen Text API] ❌ Error on attempt 1 (after 120000ms):
[Qwen Text API]   • Error type: AxiosError
[Qwen Text API]   • Error message: timeout of 120000ms exceeded
[Qwen Text API]   • Reason: Request timeout (exceeded 120000ms)
[Qwen Text API] 🔄 Retrying in 2000ms... (2 retries left)

──────────────────────────────────────────────────
[Qwen Text API] 🔄 Attempt 2/3
[Qwen Text API] ⏰ Start time: 2024-01-15T10:32:50.234Z
[Qwen Text API] 📊 Request details:
[Qwen Text API]   • Model: qwen-plus
[Qwen Text API]   • Temperature: 0.3
[Qwen Text API]   • Max tokens: 8000
[Qwen Text API]   • Timeout: 120000ms (120s)
──────────────────────────────────────────────────
[Qwen Text API] ✅ Success!
[Qwen Text API] ⏱️  API call time: 15678ms (15.68s)
[Qwen Text API] 📈 Token usage:
[Qwen Text API]   • Input tokens: 12845
[Qwen Text API]   • Output tokens: 2567
[Qwen Text API]   • Total tokens: 15412
```

**分析：**
- 第一次尝试超时（120秒）
- 自动重试
- 第二次尝试成功（15.68秒）
- 总共耗时：~137 秒

### 场景 2：API 配额不足

```
──────────────────────────────────────────────────
[Qwen Text API] 🔄 Attempt 1/3
[Qwen Text API] ⏰ Start time: 2024-01-15T10:30:48.123Z
──────────────────────────────────────────────────

[Qwen Text API] ❌ Error on attempt 1 (after 567ms):
[Qwen Text API]   • Error type: AxiosError
[Qwen Text API]   • Error message: Request failed with status code 429
[Qwen Text API]   • HTTP Status: 429 Too Many Requests
[Qwen Text API]   • Response data: {
  "code": "Throttling.RateQuota",
  "message": "API rate limit exceeded. Please try again later.",
  "request_id": "abc123-def456-ghi789"
}
[Qwen Text API] 🔄 Retrying in 2000ms... (2 retries left)

[Qwen Text API] ❌ Error on attempt 2 (after 678ms):
[Qwen Text API]   • Error type: AxiosError
[Qwen Text API]   • Error message: Request failed with status code 429
[Qwen Text API]   • HTTP Status: 429 Too Many Requests
[Qwen Text API] 🔄 Retrying in 2000ms... (1 retry left)

[Qwen Text API] ❌ Error on attempt 3 (after 589ms):
[Qwen Text API]   • Error type: AxiosError
[Qwen Text API]   • Error message: Request failed with status code 429
[Qwen Text API] ❌ All 3 attempts failed. Giving up.

[Pipeline] ❌ PIPELINE FAILED
═══════════════════════════════════════════════════════════════════
[Pipeline] 💥 Error in Step 1
[Pipeline] ⏱️  Time before failure: 7234ms (7.23s)
[Pipeline] 🐛 Error type: Error
[Pipeline] 📝 Error message: Qwen Text API failed after 3 attempts: API rate limit exceeded
```

**解决方法：**
- 等待几分钟后重试
- 升级 API 配额
- 减少请求频率

### 场景 3：JSON 解析失败（自动修复成功）

```
[Pipeline] 📊 Analyzing API response...
[Pipeline]   • Response length: 4321 characters
[Pipeline]   • Response preview: {"registers":[{"address":"0x40021000","name":"RCC_CR"...
[Pipeline]   ⚠️  JSON parse error: Unexpected token } in JSON at position 4120
[Pipeline]   • Attempting to fix JSON...
[Pipeline]   • Removed trailing commas
[Pipeline]   • Fixed incomplete arrays
[Pipeline]   • Closed 2 unclosed braces
[Pipeline] ✓ Successfully fixed and parsed JSON
[Pipeline] Successfully extracted 15 registers
```

### 场景 4：JSON 解析完全失败

```
[Pipeline] 📊 Analyzing API response...
[Pipeline]   • Response length: 234 characters
[Pipeline]   • Response preview: 抱歉，我无法从提供的文档中提取出寄存器信息...
[Pipeline]   ⚠️  Warning: No JSON found in response
[Pipeline]   • Response preview: 抱歉，我无法从提供的文档中提取出寄存器信息。提供的文档可能不包含寄存器相关的内容，或者格式不符合要求。请提供正确的数据手册文档。
[Pipeline]   • Returning empty register list

[Pipeline] ⚠️  Warning: No registers extracted
[Pipeline]   • This may cause issues in code generation
[Pipeline]   • Please check if the datasheet is correct

[Pipeline] ✅ Step 1 completed in 15678ms (15.68s)
[Pipeline] 📊 Extracted data:
[Pipeline]   • Registers: 0
[Pipeline]   • Data size: 16 bytes
```

---

## 性能分析示例

### 最佳性能案例（全部使用图片格式）

```
═══════════════════════════════════════════════════════════════════
[Pipeline] 📊 PIPELINE SUMMARY
═══════════════════════════════════════════════════════════════════
[Pipeline] ⏱️  Total execution time: 42345ms (42.35s)
[Pipeline] 📈 Step timings:
[Pipeline]   1. Extract Registers: 15234ms (15.23s) - 36.0%
[Pipeline]   2. Parse Schematic: 18567ms (18.57s) - 43.8%
[Pipeline]   3. Generate Code: 8544ms (8.54s) - 20.2%
[Pipeline] 📁 Output file: generated_1705312845123.c
[Pipeline] ✅ Status: SUCCESS

[API] 📊 Generation Statistics:
[API]   • Total processing time: 42345ms (42.35s)
[API]   • Token usage total: 32145 tokens
[API]   • Estimated cost: ¥0.26
```

**性能分析：**
- 无 PDF 转换开销（直接使用图片）
- 各步骤耗时均衡
- Token 使用较少
- 总耗时最优

### 最慢性能案例（PDF 转换 + 超时重试）

```
═══════════════════════════════════════════════════════════════════
[Pipeline] 📊 PIPELINE SUMMARY
═══════════════════════════════════════════════════════════════════
[Pipeline] ⏱️  Total execution time: 185678ms (185.68s)
[Pipeline] 📈 Step timings:
[Pipeline]   1. Extract Registers: 135234ms (135.23s) - 72.8%
[Pipeline]   2. Parse Schematic: 35678ms (35.68s) - 19.2%
[Pipeline]   3. Generate Code: 14766ms (14.77s) - 8.0%
[Pipeline] 📁 Output file: generated_1705312845123.c
[Pipeline] ✅ Status: SUCCESS

[API] 📊 Generation Statistics:
[API]   • Total processing time: 185678ms (185.68s)
[API]   • Token usage total: 45678 tokens
[API]   • Estimated cost: ¥0.37
```

**性能瓶颈：**
- 步骤 1 占 72.8%（包含超时重试）
- PDF 转换耗时长
- 多次 API 重试
- Token 使用较多

**优化建议：**
1. 使用更小的 Datasheet 文件
2. 直接提供图片格式原理图
3. 增加 API 超时时间
4. 检查网络连接质量

---

## 日志过滤示例

### 只看错误和警告

```powershell
node api_server.js 2>&1 | Select-String -Pattern "❌|⚠️|Error|Warning|Failed"
```

输出：
```
[Pipeline]   ⚠️  Text truncated: 75432 → 50000 characters
[Pipeline]   ⚠️  Warning: No JSON found in response
[Qwen Text API] ❌ Error on attempt 1 (after 120000ms):
```

### 只看性能统计

```powershell
node api_server.js 2>&1 | Select-String -Pattern "⏱️|elapsed|completed in|Total"
```

输出：
```
[Pipeline]   ✓ Text extraction completed in 2.34s
[Pipeline]   ✓ API call completed in 15.68s
[Qwen Text API] ⏱️  API call time: 15678ms (15.68s)
[Pipeline] ✅ Step 1 completed in 18234ms (18.23s)
[PDF Converter] ⏱️  Total conversion time: 3567ms (3.57s)
[Pipeline] ✅ Step 2 completed in 26234ms (26.23s)
[Pipeline] ✅ Step 3 completed in 12456ms (12.46s)
[Pipeline] ⏱️  Total execution time: 56924ms (56.92s)
```

### 只看 Token 使用

```powershell
node api_server.js 2>&1 | Select-String -Pattern "Token usage|tokens"
```

输出：
```
[Qwen Text API] 📈 Token usage:
[Qwen Text API]   • Input tokens: 12845
[Qwen Text API]   • Output tokens: 2567
[Qwen Text API]   • Total tokens: 15412
[Qwen Vision API] 📈 Token usage:
[Qwen Vision API]   • Input tokens: 15678
[Qwen Vision API]   • Output tokens: 1456
[Qwen Vision API]   • Total tokens: 17134
[API]   • Token usage total: 36458 tokens
```

---

## 总结

通过这些日志示例，您可以：

✅ **快速理解系统运行状态**  
✅ **定位性能瓶颈**  
✅ **诊断错误原因**  
✅ **优化配置和使用方式**  
✅ **控制 API 成本**  

---

## 相关文档

- [详细日志指南](DETAILED_LOGGING_GUIDE.md)
- [日志快速入门](LOGGING_QUICK_START.md)
- [故障排查指南](TROUBLESHOOTING.md)

---

**最后更新**: 2024-01-15  
**版本**: 1.0
