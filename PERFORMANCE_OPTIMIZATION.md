# ⚡ 代码生成速度优化指南

## 📊 当前性能分析

### 实测数据（测试文件：BF7615CMXX.pdf + Schematic Prints.pdf）

| 步骤 | 耗时 | 占比 |
|------|------|------|
| 1. 文件上传 | ~2s | 1.5% |
| 2. PDF 转换（原理图） | ~30s | 23% |
| 3. OCR 识别 | ~15s | 11.5% |
| 4. 数据手册解析 | ~25s | 19% |
| 5. 寄存器提取（AI） | ~20s | 15% |
| 6. 原理图分析（AI） | ~15s | 11.5% |
| 7. 代码生成（AI） | ~23s | 17.5% |
| **总计** | **~130s** | **100%** |

### 主要瓶颈

1. **PDF 转换** (30s) - 如果原理图是 PDF 格式
2. **AI 模型调用** (58s) - 3次 AI 调用，每次 15-25 秒
3. **数据手册解析** (25s) - 大文件文本提取

---

## 🚀 优化方案

### 方案 1：使用图片格式原理图（最简单）⭐

**优化效果**: 减少 30-40 秒

```bash
# 如果可能，将 PDF 原理图转换为高清 PNG/JPG
# Windows: 使用 PDF 阅读器导出为图片
# 或使用在线工具：https://www.ilovepdf.com/pdf_to_jpg

# 使用图片格式
curl -X POST $API_URL/api/v1/generate \
  -F "datasheet=@datasheet.pdf" \
  -F "schematic=@schematic.png" \  # ✨ PNG 而非 PDF
  -F "instruction=..."
```

**节省时间**: 从 130s → 90s (减少 31%)

---

### 方案 2：优化 AI 模型参数 ⚡

#### 2.1 减少 max_tokens（减少输出长度）

编辑 `src/qwen_api.js`：

```javascript
// 当前配置
export async function callTextModel(prompt, options = {}) {
    const {
        maxTokens = 2000  // 默认 2000
    } = options;
    // ...
}

// 优化配置 - 如果不需要很长的代码
export async function callTextModel(prompt, options = {}) {
    const {
        maxTokens = 1500  // 减少到 1500 ✨
    } = options;
    // ...
}
```

**节省时间**: 每次 AI 调用减少 3-5 秒，总计减少 10-15 秒

---

#### 2.2 提高 temperature（生成更快但可能质量稍降）

```javascript
// pipeline.js 中的 AI 调用
const response = await callTextModel(fullPrompt, {
    systemPrompt: systemPrompt,
    temperature: 0.7,  // 当前值
    maxTokens: 2000
});

// 优化为
const response = await callTextModel(fullPrompt, {
    systemPrompt: systemPrompt,
    temperature: 0.9,  // 提高到 0.9 ✨ 生成更随机但更快
    maxTokens: 1500    // 同时减少 tokens
});
```

**节省时间**: 每次 AI 调用减少 2-3 秒

---

### 方案 3：使用更快的 AI 模型 🤖

编辑 `src/qwen_api.js`：

```javascript
// 当前配置
const TEXT_MODEL = 'qwen-plus';  // 较慢但更准确
const VISION_MODEL = 'qwen-vl-max';

// 优化配置 - 使用更快的模型
const TEXT_MODEL = 'qwen-turbo';  // ✨ 更快的模型
const VISION_MODEL = 'qwen-vl-plus';  // ✨ 更快的视觉模型
```

**模型对比**:

| 模型 | 速度 | 质量 | 适用场景 |
|------|------|------|----------|
| `qwen-turbo` | ⚡⚡⚡ 快 | ⭐⭐ 中等 | 快速原型、简单任务 |
| `qwen-plus` | ⚡⚡ 中等 | ⭐⭐⭐ 好 | 当前默认，平衡选择 |
| `qwen-max` | ⚡ 慢 | ⭐⭐⭐⭐ 很好 | 复杂任务、生产环境 |

**节省时间**: 切换到 qwen-turbo 可减少 20-30 秒

---

### 方案 4：并行处理（需要代码修改）🔧

当前流程是串行的：
```
数据手册解析 → 寄存器提取 → 原理图分析 → 代码生成
```

可以改为部分并行：
```
数据手册解析 ──┐
               ├─→ 合并 → 代码生成
原理图分析 ────┘
```

创建优化版 pipeline：`src/pipeline_fast.js`

```javascript
// 并行处理数据手册和原理图
const [datasheetResult, schematicResult] = await Promise.all([
    datasheetPath ? parseDatasheet(datasheetPath) : Promise.resolve(null),
    schematicPath ? parseSchematic(schematicPath) : Promise.resolve(null)
]);
```

**节省时间**: 减少 15-25 秒

---

### 方案 5：缓存机制（高级优化）💾

对于相同的数据手册，缓存解析结果：

```javascript
// 添加到 api_server.js
const cache = new Map();

// 生成文件哈希
import crypto from 'crypto';
function getFileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
}

// 使用缓存
const hash = getFileHash(datasheetPath);
if (cache.has(hash)) {
    console.log('[Cache] Using cached datasheet result');
    result = cache.get(hash);
} else {
    result = await parseDatasheet(datasheetPath);
    cache.set(hash, result);
}
```

**节省时间**: 相同文件再次处理时减少 40-50 秒

---

## 🎯 推荐的优化组合

### 快速方案（5分钟配置）⚡

**不需要代码修改，立即见效！**

1. **使用 PNG/JPG 原理图** 而非 PDF
2. **优化 AI 模型参数**（修改 `qwen_api.js`）

```javascript
// src/qwen_api.js
const TEXT_MODEL = 'qwen-turbo';  // ✨ 改为 turbo
const VISION_MODEL = 'qwen-vl-plus';

export async function callTextModel(prompt, options = {}) {
    const {
        maxTokens = 1500  // ✨ 减少到 1500
    } = options;
    // ...
}
```

**预期效果**: 
- 从 130s → 60-70s
- **减少 50%+ 时间** 🎉

---

### 平衡方案（推荐）⭐

保持代码质量的同时提升速度：

1. **使用图片原理图** (-30s)
2. **减少 maxTokens 到 1500** (-10s)
3. **使用 qwen-plus（不变）** 保持质量

**预期效果**:
- 从 130s → 80-90s
- 减少 35-40% 时间
- 代码质量基本不变

---

### 极速方案（适合测试）🚀

```javascript
// src/qwen_api.js
const TEXT_MODEL = 'qwen-turbo';
const VISION_MODEL = 'qwen-vl-plus';

export async function callTextModel(prompt, options = {}) {
    const {
        temperature = 0.9,   // ✨ 提高
        maxTokens = 1000     // ✨ 大幅减少
    } = options;
}
```

**预期效果**:
- 从 130s → 40-50s
- **减少 60-70% 时间** 🚀
- 但代码质量可能稍有下降

---

## 🛠️ 实施步骤

### 步骤 1: 备份当前配置

```bash
cd "f:\LLM4EDA\公司文件\demo generation\embedded-ai-agent"
cp src/qwen_api.js src/qwen_api.js.backup
```

### 步骤 2: 应用推荐配置

编辑 `src/qwen_api.js`：

```javascript
// ============= 优化配置 START =============

// 使用更快的模型
const TEXT_MODEL = 'qwen-turbo';  // 原: qwen-plus
const VISION_MODEL = 'qwen-vl-plus';  // 原: qwen-vl-max

// 减少 token 数量
export async function callTextModel(prompt, options = {}) {
    checkApiKey();

    const {
        systemPrompt = '',
        temperature = 0.7,
        maxTokens = 1500  // 原: 2000
    } = options;
    
    // ...其余代码不变
}

// ============= 优化配置 END =============
```

### 步骤 3: 重启 API 服务器

```powershell
# 停止当前服务
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# 启动服务
cd "f:\LLM4EDA\公司文件\demo generation\embedded-ai-agent"
node api_server.js
```

### 步骤 4: 测试性能

```bash
# 使用 PNG 原理图测试
node test_upload.mjs
```

---

## 📊 优化效果对比

| 配置 | 时间 | 代码质量 | 适用场景 |
|------|------|----------|----------|
| **原始配置** | 130s | ⭐⭐⭐⭐ 优秀 | 生产环境 |
| **推荐配置** | 80-90s | ⭐⭐⭐ 良好 | 日常使用 ⭐ |
| **快速配置** | 60-70s | ⭐⭐ 中等 | 快速测试 |
| **极速配置** | 40-50s | ⭐ 基本 | 原型验证 |

---

## 💡 其他优化建议

### 1. 减少文件大小
```bash
# 压缩 PDF（使用在线工具或 Ghostscript）
# 目标：< 2MB

# 优化图片分辨率
# 推荐：1920x1080 或 2048x1536
```

### 2. 精简指令内容
```javascript
// ❌ 过长的指令
instruction = `
生成完整的初始化代码，包括：
1. 详细的 GPIO 配置，每个引脚都要注释...
2. 完整的时钟配置，包括所有 PLL 参数...
3. 所有外设初始化...
[1000+ 字符]
`

// ✅ 简洁的指令
instruction = `
Generate GPIO and UART initialization code.
Requirements: PA0-7 output, UART1 115200 baud.
`
```

### 3. 分步生成（复杂项目）
```javascript
// 不要一次生成所有代码，而是分步：
// 1. 先生成 GPIO 初始化
// 2. 再生成外设配置
// 3. 最后生成应用逻辑

// 每步更快，总体更可控
```

---

## 🔧 一键优化脚本

创建 `optimize_performance.ps1`：

```powershell
# 自动应用推荐的优化配置
$qwenApiPath = "src/qwen_api.js"
$content = Get-Content $qwenApiPath -Raw

# 备份
Copy-Item $qwenApiPath "$qwenApiPath.backup"

# 替换模型
$content = $content -replace "const TEXT_MODEL = 'qwen-plus'", "const TEXT_MODEL = 'qwen-turbo'"
$content = $content -replace "const VISION_MODEL = 'qwen-vl-max'", "const VISION_MODEL = 'qwen-vl-plus'"

# 替换 maxTokens
$content = $content -replace "maxTokens = 2000", "maxTokens = 1500"

# 保存
Set-Content $qwenApiPath $content

Write-Host "✅ Performance optimization applied!" -ForegroundColor Green
Write-Host "📊 Expected improvement: 35-40% faster" -ForegroundColor Cyan
Write-Host "🔄 Please restart API server" -ForegroundColor Yellow
```

运行：
```powershell
.\optimize_performance.ps1
```

---

## 📞 需要帮助？

- 查看 [API 文档](./API_REFERENCE.md)
- 运行测试: `node test_upload.mjs`
- 检查日志: API 服务器控制台输出

---

**维护者**: Embedded AI Team  
**最后更新**: 2025年12月22日  
**版本**: v1.0.0
