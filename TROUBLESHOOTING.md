# Troubleshooting Guide

## 快速诊断

如果遇到任何问题，首先运行诊断脚本：

```powershell
# 检查所有服务状态
.\check_services.ps1

# 诊断 ngrok 错误
.\diagnose_ngrok_error.ps1
```

---

## 问题 1: Ngrok ERR_NGROK_3004 错误

### 错误信息
浏览器或 API 调用时显示：
```
ERR_NGROK_3004
The server returned an invalid or incomplete HTTP response
```

### ⚡ 快速诊断

运行诊断脚本：
```powershell
.\diagnose_ngrok_error.ps1
```

这会自动检查：
- ✅ API 服务器是否运行
- ✅ 本地健康检查是否通过
- ✅ Ngrok 隧道是否正常
- ✅ 公网访问是否可用
- ✅ 性能指标是否正常

### 原因分析

ERR_NGROK_3004 表示 **ngrok 隧道已建立，但本地服务未正确响应**。常见原因：

#### 1. 浏览器访问免费版 ngrok URL（最常见）
**症状**: 浏览器显示 ngrok 警告页面，要求点击"Visit Site"

**解决方案**:
- 点击页面上的"Visit Site"按钮
- 或使用 API 时添加请求头避免警告页面：

```powershell
# PowerShell
$headers = @{"ngrok-skip-browser-warning"="true"}
Invoke-RestMethod -Uri "https://your-url.ngrok-free.dev/api/v1/health" -Headers $headers
```

```bash
# curl
curl -H "ngrok-skip-browser-warning: true" https://your-url.ngrok-free.dev/api/v1/health
```

#### 2. 本地服务未运行或崩溃
**症状**: 所有请求都返回 ERR_NGROK_3004，诊断脚本显示服务未运行

**解决方案**:
```powershell
# 重启服务
.\stop_services.ps1
.\start_services.ps1

# 检查状态
.\check_services.ps1
```

#### 3. 请求超时（长时间处理）
**症状**: 
- 小文件/简单请求正常
- PDF 处理或 AI 生成时出现错误
- 诊断脚本显示 P90 延迟 > 30 秒

**解决方案**:
```powershell
# 运行性能优化脚本
.\optimize_performance.ps1

# 这会自动：
# - 切换到更快的 AI 模型（qwen-turbo）
# - 减少 maxTokens（4000 → 2000）
# - 重启服务应用更改
```

#### 4. 端口配置不匹配
**症状**: 服务运行但 ngrok 无法连接

**解决方案**:
确认配置一致：
- API 服务器端口: 8080（在 `api_server.js` 中）
- Ngrok 转发端口: localhost:8080

#### 5. 防火墙或杀毒软件阻止
**症状**: 本地测试正常，公网访问失败

**解决方案**:
1. 检查 Windows 防火墙
2. 临时禁用杀毒软件测试
3. 添加 node.exe 和 ngrok.exe 到白名单

### 📊 实时监控

查看 ngrok 请求历史和详细错误：
```powershell
Start-Process "http://localhost:4040"
```

这个管理界面显示：
- 所有通过 ngrok 的请求/响应
- 完整的请求和响应内容
- 响应时间和状态码
- 详细的错误信息

### 📚 更多帮助

详细的 ngrok 错误排查指南：
- 查看 `NGROK_TROUBLESHOOTING.md`
- 包含所有错误原因、解决方案和性能优化建议

---

## 问题 2: 原理图解析返回空的引脚映射

### 错误信息
```
错误：无法生成代码
原因：pin_mapping_json 中的 pin_mappings 为空，无法获取任何引脚连接信息
说明：用户需求要求根据原理图识别所有MCU引脚的实际连接和功能，但未提供有效的引脚映射数据
建议：请提供完整的原理图引脚连接信息（如 LED、按键、通信接口等的具体连接）
```

### 原因分析
这个问题通常由以下原因导致：

1. **PDF 原理图无法被视觉模型识别**
   - PDF 原理图以扫描图片形式存储
   - Qwen 视觉模型无法直接处理 PDF
   - PDF 转换为文本后，图形信息丢失

2. **原理图质量问题**
   - 分辨率过低
   - 图像模糊或不清晰
   - 引脚标注不明显

3. **AI 模型理解偏差**
   - 原理图格式不标准
   - 引脚命名不规范
   - 连接关系复杂

### ✅ 解决方案

#### 🎯 **NEW! 方案 0: 使用自动 PDF 转换功能（推荐）⭐**

**系统现在支持自动将 PDF 原理图转换为图片！**

```powershell
# 1. 检查系统是否支持自动转换
npm run check-tools

# 2. 如果显示工具已安装，直接使用 PDF 即可
node src/cli.js `
  --datasheet "../BF7615CMXX.pdf" `
  --schematic "../Schematic Prints.pdf" `
  --instruction "生成初始化代码" `
  --output out/bf7615_init.c

# 系统会自动：
# - 检测到 PDF 原理图
# - 转换为 300 DPI 的 PNG 图片
# - 使用视觉模型分析
# - 生成代码
```

**如果工具未安装：**

```powershell
# 安装 ImageMagick（推荐）
# Windows: https://imagemagick.org/script/download.php#windows
# ✅ 安装时勾选 "Install legacy utilities (e.g. convert)"

# 验证安装
magick --version

# 重新运行
npm run check-tools
```

**详细说明：** 参见 [PDF_AUTO_CONVERT_GUIDE.md](PDF_AUTO_CONVERT_GUIDE.md)

---

#### 方案 1: 将 PDF 原理图转换为图片（手动）

**步骤：**

1. **使用 PDF 阅读器打开原理图**
   - 确保原理图清晰可见
   - 放大以检查细节

2. **截图工具设置**
   - 打开截图工具（如 Snipping Tool 或 Greenshot）
   - 设置合适的截图区域，确保包含所有引脚和连接

3. **保存为 PNG/JPEG**
   - 将截图保存为 PNG 或 JPEG 格式
   - 确保图片清晰，便于后续处理

4. **使用视觉模型分析**
   - 将保存的图片拖拽到分析工具中
   - 等待分析完成，查看引脚映射结果

5. **手动修正错误**
   - 根据原理图和分析结果，手动修正引脚映射错误
   - 确保引脚名称和连接正确无误

6. **保存引脚映射文件**
   - 将修正后的引脚映射保存为 JSON 格式
   - 确保文件结构和内容符合要求

7. **生成代码**
   - 使用修正后的引脚映射文件，重新运行代码生成工具
   - 检查生成的代码，确保无错误

**注意：** 手动转换可能会因为人为因素导致错误，建议尽量使用自动转换功能。