# 🤖 Embedded AI Agent - Intelligent Code Generator

> 📢 **最新更新 (v2.2)**: 
> - **🚀 一键部署** - 完整的服务器部署工具集，支持 Linux 终端部署！查看 [快速开始](QUICK_START.md)
> - **📦 Windows 上传工具** - 从 Windows 直接上传到服务器！使用 [upload_to_server.ps1](upload_to_server.ps1)
> - **🔧 运维脚本** - 健康检查、备份恢复、一键部署，开箱即用！
> - **异步 API** - 支持长时间任务，避免超时，实时进度查询！查看 [异步API指南](ASYNC_API_GUIDE.md) 🆕
> - **详细日志** - 增强日志功能，提供详细的性能统计、Token使用、错误诊断！查看 [详细日志指南](DETAILED_LOGGING_GUIDE.md)

**基于大语言模型的嵌入式代码自动生成工具**

## 📋 目录

- [项目简介](#项目简介)
- [快速开始](#快速开始)
- [服务器部署](#服务器部署) ⭐ 新增
- [本地开发](#本地开发)
- [文档导航](#文档导航)
- [功能特性](#功能特性)

---

## 项目简介

这是一个基于 Qwen API 的嵌入式开发自动化系统，能够：

1. **文档解析**：自动从 Datasheet（PDF/文本）中提取寄存器信息
2. **原理图解析**：解析原理图（PDF/PNG/JPG），提取 MCU 引脚映射和信号连接
   - ✨ **原理图现已支持 PDF 格式**，适配 OpenWebUI 等平台
3. **代码生成**：根据文档信息 + 原理图解析结果 + 用户需求自动生成嵌入式 C 代码

---

## 🚀 快速开始

### 本地开发（Windows/Linux/Mac）

```bash
# 1. 克隆或下载项目
cd embedded-ai-agent

# 2. 安装依赖
npm install

# 3. 配置 API Key
# Windows PowerShell:
$env:QWEN_API_KEY="your_api_key_here"
# Linux/Mac:
export QWEN_API_KEY="your_api_key_here"

# 4. 启动服务
npm start  # Web UI (端口 3000)
# 或
npm run api  # API 服务 (端口 8080)
```

**详细使用说明**: 继续阅读本文档下方的 [本地开发](#本地开发) 部分

---

## 🌐 服务器部署

### 方案一: Windows → Linux 一键部署 (推荐) ⭐

**1. 从 Windows 上传项目:**

```powershell
# 在项目根目录运行
.\upload_to_server.ps1
```

脚本会自动:
- ✅ 打包项目并上传到服务器
- ✅ 设置脚本执行权限
- ✅ 可选: 立即运行部署

**2. 脚本会询问是否立即部署，选择 'y' 即可自动完成部署！**

**需要**: Git for Windows 或 OpenSSH

---

### 方案二: 在服务器上直接部署

**1. 上传项目到服务器:**

```bash
# 方法A: 使用 Git
git clone https://github.com/your-repo/embedded-ai-agent.git
cd embedded-ai-agent

# 方法B: 使用 scp 从本地上传
scp -r /path/to/embedded-ai-agent user@server:/home/user/
```

**2. 运行一键部署脚本:**

```bash
chmod +x deploy.sh health_check.sh backup.sh restore.sh
./deploy.sh
```

部署脚本会自动:
- ✅ 检测系统环境（Ubuntu/Debian/CentOS）
- ✅ 安装依赖（Node.js, Tesseract, ImageMagick）
- ✅ 配置环境变量
- ✅ 安装和配置 PM2
- ✅ 启动服务
- ✅ 配置开机自启
- ✅ 运行健康检查

**预计时间**: 5-10 分钟

---

### 方案三: 手动部署

如果您想了解每一步的细节，请查看:
- 📘 **[快速开始指南](QUICK_START.md)** - 分步骤说明
- 📗 **[详细部署手册](DEPLOYMENT_GUIDE.md)** - 完整部署文档
- 📙 **[部署工具说明](DEPLOYMENT_TOOLS.md)** - 所有脚本的功能说明

---

### 部署后管理

```bash
# 查看服务状态
pm2 list

# 查看日志
pm2 logs

# 运行健康检查
./health_check.sh

# 备份数据
./backup.sh

# 测试 API
curl http://localhost:8080/api/v1/health
```

**完整的运维命令**: 查看 [DEPLOYMENT_TOOLS.md](DEPLOYMENT_TOOLS.md)

---

### 部署检查清单

使用我们提供的检查清单确保部署完整:
- 📋 **[部署检查清单](DEPLOYMENT_CHECKLIST.md)** - 逐项验证部署

---

## 📚 文档导航

### 服务器部署文档 (新增)

| 文档 | 说明 | 适用场景 |
|------|------|---------|
| **[QUICK_START.md](QUICK_START.md)** | 🚀 快速开始 - 分步骤部署指南 | 首次部署 ⭐ |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | 📖 详细部署手册 - 完整部署文档 | 详细了解 |
| **[DEPLOYMENT_TOOLS.md](DEPLOYMENT_TOOLS.md)** | 🔧 部署工具说明 - 脚本功能介绍 | 运维管理 |
| **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** | ✅ 部署检查清单 - 逐项验证 | 质量保证 |
| `upload_to_server.ps1` | 📤 Windows 上传脚本 | Windows → Linux |
| `deploy.sh` | 🚀 一键部署脚本 | Linux 服务器 |
| `health_check.sh` | 🏥 健康检查脚本 | 运维监控 |
| `backup.sh` | 💾 备份脚本 | 数据备份 |
| `restore.sh` | 🔄 恢复脚本 | 数据恢复 |
| `systemd/` | ⚙️ systemd 服务配置 | systemd 部署 |

### API 使用文档

| 文档 | 说明 | 适用场景 |
|------|------|---------|
| **[API_QUICKSTART.md](API_QUICKSTART.md)** | 🚀 API 快速开始（3 步启动） | API 用户 |
| **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** | 📋 完整 API 参考文档 | API 开发者 |
| **[ASYNC_API_GUIDE.md](ASYNC_API_GUIDE.md)** | ⏱️ 异步 API 使用指南 | 长时间任务 |
| **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** | 🔌 第三方集成完整指南 | 集成开发者 |

### 高级功能文档

| 文档 | 说明 | 适用场景 |
|------|------|---------|
| **[PUBLIC_ACCESS_GUIDE.md](PUBLIC_ACCESS_GUIDE.md)** | 🌐 公网访问部署指南 | 不在同一网络的用户 |
| **[PDF_AUTO_CONVERT_GUIDE.md](PDF_AUTO_CONVERT_GUIDE.md)** | 🖼️ PDF 自动转换配置 | 需要 PDF 功能的用户 |
| **[DETAILED_LOGGING_GUIDE.md](DETAILED_LOGGING_GUIDE.md)** | 📊 详细日志使用指南 | 性能优化、问题诊断 |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | 🐛 故障排除指南 | 遇到问题的用户 |

### 项目文档

| 文档 | 说明 | 适用场景 |
|------|------|---------|
| **[PROJECT_COMPREHENSIVE_REPORT.md](PROJECT_COMPREHENSIVE_REPORT.md)** | 📈 项目综合报告 | 了解项目全貌 |
| **[SYSTEM_WORKFLOW_EXPLAINED.md](SYSTEM_WORKFLOW_EXPLAINED.md)** | 🔍 系统工作流程详解 | 深入理解原理 |

---

## 本地开发

### 1. 运行示例

```bash
npm run example
```

这将使用 `examples/` 目录下的示例文件生成代码，输出到 `out/default_set_io.c`。

### 2. 命令行使用

#### 基本用法

```bash
node src/cli.js --datasheet examples/sample_datasheet.txt --schematic examples/sample_schematic.png --instruction "初始化所有 IO 为输出"
```

### 3. HTTP API 服务 ⭐ NEW!

**启动 API 服务器：**
```bash
npm run api
```

启动后将看到美化的界面：
```
╔═══════════════════════════════════════════════════════════════════════╗
║              🤖 AI-Powered Embedded Code Generator API 🚀             ║
╚═══════════════════════════════════════════════════════════════════════╝

✨ Server ready! Press Ctrl+C to stop.
```

> 💡 **特色**: ASCII 艺术标题、彩色信息面板、实时系统状态、快速开始示例！详见 [API_STARTUP_FEATURES.md](API_STARTUP_FEATURES.md)

#### 3.1 同步 API（快速测试）

**调用 API：**
```powershell
# PowerShell
$form = @{
    datasheet = Get-Item -Path "datasheet.pdf"
    schematic = Get-Item -Path "schematic.png"
    instruction = "生成GPIO初始化代码"
}

$response = Invoke-RestMethod `
    -Uri "http://localhost:8080/api/v1/generate" `
    -Method Post `
    -Form $form

$response.generated_code | Out-File "generated.c"
```

**特点**：
- ✅ 简单直接，一次请求返回结果
- ⚠️ 需要等待 60-180 秒
- ⚠️ 可能遇到超时问题

#### 3.2 异步 API（生产推荐）🆕

**步骤 1: 提交任务（立即返回）**
```powershell
$form = @{
    datasheet = Get-Item -Path "datasheet.pdf"
    schematic = Get-Item -Path "schematic.png"
    instruction = "生成GPIO初始化代码"
}

$response = Invoke-RestMethod `
    -Uri "http://localhost:8080/api/v1/generate/async" `
    -Method Post `
    -Form $form

$taskId = $response.task_id
Write-Host "Task ID: $taskId"
```

**步骤 2: 查询进度**
```powershell
$status = Invoke-RestMethod `
    -Uri "http://localhost:8080/api/v1/tasks/$taskId" `
    -Method Get

Write-Host "Status: $($status.status) - Progress: $($status.progress.percentage)%"
```

**步骤 3: 下载结果**
```powershell
$result = Invoke-RestMethod `
    -Uri "http://localhost:8080/api/v1/tasks/$taskId/result" `
    -Method Get

$result.generated_code | Out-File "generated.c" -Encoding UTF8
```

**优势**：
- ✅ 立即返回（< 1秒），不阻塞
- ✅ 实时查询进度
- ✅ 避免超时问题
- ✅ 支持并发任务
- ✅ 结果保留24小时

> 📖 **详细文档**: [异步API完整指南](ASYNC_API_GUIDE.md)

**API 端点：**

| 端点 | 方法 | 说明 | 模式 |
|------|------|------|------|
| `/api/v1/generate` | POST | 同步生成代码 | 同步 |
| `/api/v1/generate/async` | POST | 异步提交任务 🆕 | 异步 |
| `/api/v1/tasks/{id}` | GET | 查询任务状态 🆕 | 异步 |
| `/api/v1/tasks/{id}/result` | GET | 下载结果 🆕 | 异步 |
| `/api/v1/tasks` | GET | 任务列表 🆕 | 异步 |
| `/api/v1/health` | GET | 健康检查 | 通用 |
| `/api/v1/docs` | GET | API 文档 | 通用 |

**第三方集成：** 🔌
- ✅ 支持任何语言调用（Python、JavaScript、Java、C#等）
- ✅ 提供 SDK 和示例代码
- ✅ 支持局域网和公网部署
- ✅ 可集成到现有工具链

> ⚠️ **重要**：如果用户**不在同一局域网**，需要使用内网穿透或云服务器将服务暴露到公网。详见 [PUBLIC_ACCESS_GUIDE.md](PUBLIC_ACCESS_GUIDE.md) ⭐

详见：
- 📖 **快速开始**: [API_QUICKSTART.md](API_QUICKSTART.md)
- 📚 **完整文档**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- 🔌 **集成指南**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- 🌐 **公网访问**: [PUBLIC_ACCESS_GUIDE.md](PUBLIC_ACCESS_GUIDE.md) ⭐
- 🔄 **异步API**: [ASYNC_API_GUIDE.md](ASYNC_API_GUIDE.md) ⭐ NEW!
- ✅ **测试报告**: [ASYNC_API_TEST_REPORT.md](ASYNC_API_TEST_REPORT.md) ⭐ NEW!

### 4. Web UI 使用

```bash
npm start
```

然后在浏览器打开 `http://localhost:3000`

## 项目结构

```
embedded-ai-agent/
├── package.json              # 项目配置
├── README.md                 # 本文档
├── .gitignore               # Git 忽略文件
├── prompts/                 # Prompt 模板目录
│   ├── system.txt           # 系统提示词
│   ├── intent_router.txt    # 意图路由
│   ├── extract_registers.txt # 寄存器提取模板
│   ├── parse_schematic.txt  # 原理图解析模板
│   ├── generate_code.txt    # 代码生成模板
│   └── final_template.txt   # 最终输出模板
├── src/                     # 源代码目录
│   ├── qwen_api.js          # Qwen API 封装
│   ├── ocr.js               # OCR 功能模块
│   ├── pipeline.js          # 主流程管道
│   ├── cli.js               # 命令行接口
│   └── examples.js          # 示例运行脚本
├── examples/                # 示例文件目录
│   ├── sample_datasheet.txt # 示例 Datasheet
│   ├── sample_schematic.png # 示例原理图
│   ├── pdf_example.js       # PDF 处理示例脚本
│   ├── process_pdf_schematic.ps1 # PDF 自动转换脚本
│   ├── run_example.sh       # 运行示例脚本（Linux/Mac）
│   └── run_example.ps1      # 运行示例脚本（Windows）
├── out/                     # 输出目录（生成的 C 代码）
└── web/                     # Web UI
    ├── index.html           # 前端页面
    ├── app.js               # 前端逻辑
    └── server.js            # 后端服务器

```

## Prompt 模板修改指南

所有 Prompt 模板位于 `prompts/` 目录下，你可以根据需要修改：

### 1. extract_registers.txt
控制如何从文档中提取寄存器信息，输出格式为 JSON：
```json
{
  "registers": [
    {
      "name": "TRISC",
      "address": "0x19",
      "fields": [...]
    }
  ]
}
```

### 2. parse_schematic.txt
控制如何解析原理图，输出格式为 JSON：
```json
{
  "pin_mappings": [...],
  "input_pins": [...],
  "output_pins": [...],
  "special_requirements": [...]
}
```

### 3. generate_code.txt
控制最终代码生成的风格和规则，包括：
- 寄存器操作规范
- 低电平/高电平有效处理
- 代码注释风格

## 生成代码示例

```c
/**
 * @file default_set_io.c
 * @brief 自动生成的 GPIO 初始化代码
 * @date 2025-12-10
 */

#include <stdint.h>

// TRISC 寄存器定义 - 端口方向控制
#define TRISC (*((volatile uint8_t*)0x19))

/**
 * @brief 初始化所有 IO 为输出
 */
void init_gpio(void) {
    // 设置 PORTC 所有引脚为输出
    TRISC = 0x00;  // 0=输出, 1=输入
}
```

## 常见问题

### Q: 提示 "QWEN_API_KEY not configured"
A: 请按照上述配置章节设置环境变量或修改源代码中的 API Key。

### Q: OCR 识别效果不佳
A: 
1. 确保图片清晰度足够
2. 可以考虑安装更好的 Tesseract 语言包
3. 对于复杂原理图，建议使用 Qwen Vision 模型直接解析

### Q: 生成的代码不正确
A: 
1. 检查 Datasheet 是否完整包含寄存器定义
2. 检查原理图是否清晰标注引脚信息
3. 修改 `prompts/generate_code.txt` 调整生成规则

## 技术架构

1. **OCR 层**: pdf-parse + tesseract-ocr 提取文本内容
2. **AI 层**: Qwen API（文本模型 + 视觉模型）
3. **Pipeline 层**: 串联文档解析 → 原理图解析 → 代码生成
4. **输出层**: 生成标准 C 代码文件

## License

MIT

## 📚 文档导航

### 核心文档

| 文档 | 描述 | 受众 |
|------|------|------|
| **README.md** | 📖 项目介绍和基础使用（本文件） | 所有用户 |
| **API_QUICKSTART.md** | 🚀 API 快速开始（3 步启动） | API 用户 |
| **API_DOCUMENTATION.md** | 📋 完整 API 参考文档 | API 开发者 |
| **INTEGRATION_GUIDE.md** | 🔌 第三方集成完整指南 | 集成开发者 |
| **PDF_AUTO_CONVERT_GUIDE.md** | 🖼️ PDF 自动转换配置 | 需要 PDF 功能的用户 |
| **TROUBLESHOOTING.md** | 🐛 故障排除指南 | 遇到问题的用户 |

### 客户端 SDK

| SDK | 语言 | 描述 |
|-----|------|------|
| **embedded_ai_client.py** | 🐍 Python | Python 客户端库 |
| **embedded-ai-client.js** | 📜 JavaScript | Node.js 客户端库 |

### 📚 文档索引

精简后的文档结构，只保留核心文档：

| 文档 | 说明 | 适用对象 |
|------|------|----------|
| **README.md** | 项目介绍和快速开始 | 所有用户 |
| **API_REFERENCE.md** | 完整 API 参考文档 | API 用户 |
| **OPENWEBUI_INTEGRATION.md** | OpenWebUI 集成指南 | OpenWebUI 用户 |
| **PUBLIC_ACCESS_GUIDE.md** | 公网访问配置 | 远程访问用户 |
| **PERFORMANCE_OPTIMIZATION.md** | 性能优化指南 | 需要优化速度的用户 |
| **TROUBLESHOOTING.md** | 故障排查和常见问题 ⭐ | 遇到问题的用户 |
| **NGROK_TROUBLESHOOTING.md** | Ngrok 错误详细排查 🔧 | ERR_NGROK_3004 等问题 |
| **DETAILED_LOGGING_GUIDE.md** | 🆕 详细日志功能指南 | 需要调试和性能分析 |
| **LOG_EXAMPLES.md** | 🆕 日志输出示例 | 理解日志含义 |
| **DETAILED_LOGGING_SUMMARY.md** | 🆕 日志增强更新总结 | 了解最新日志功能 |
| **ASYNC_API_GUIDE.md** | 🆕 异步API完整指南 | 生产环境、长时间任务 |

### 🚀 快速开始路径

- **新用户**: 从 README.md 开始
- **API 调用**: 查看 API_REFERENCE.md
- **异步API**: 阅读 ASYNC_API_GUIDE.md 🆕
- **OpenWebUI 集成**: 阅读 OPENWEBUI_INTEGRATION.md
- **公网部署**: 参考 PUBLIC_ACCESS_GUIDE.md（不在同一网络必看！）
- **提升速度**: 使用 PERFORMANCE_OPTIMIZATION.md
- **遇到问题**: 查阅 TROUBLESHOOTING.md
- **Ngrok 错误**: 查看 NGROK_TROUBLESHOOTING.md（ERR_NGROK_3004 等）
- **调试和日志**: 查看 DETAILED_LOGGING_GUIDE.md 🆕
- **理解日志**: 参考 LOG_EXAMPLES.md 🆕

### 🛠️ 实用脚本

| 脚本 | 用途 |
|------|------|
| **start_services.ps1** | 一键启动 API 服务器和 ngrok |
| **stop_services.ps1** | 停止所有服务 |
| **check_services.ps1** | 检查服务状态 |
| **diagnose_ngrok_error.ps1** | 🆕 诊断 ngrok 错误（ERR_NGROK_3004） |
| **optimize_performance.ps1** | 性能优化向导 |
| **show_ngrok_url.ps1** | 显示 ngrok 公网地址 |

## 贡献

欢迎提交 Issue 和 Pull Request！
