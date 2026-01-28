# Ngrok 错误排查指南

## ⚠️ 重要提示：获取你的真实 ngrok URL

**文档中的 `https://your-url.ngrok-free.dev` 只是示例地址！**

### 获取你的真实公网地址

运行以下命令查看你的实际 ngrok URL ：
```powershell
.\show_ngrok_url.ps1
```

或者查看诊断信息：
```powershell
.\diagnose_ngrok_error.ps1
```

或者访问 ngrok 管理界面：
```powershell
Start-Process "http://localhost:4040"
```

**你的真实 URL 格式类似**：
- `https://xxxx-yyyy-zzzz.ngrok-free.dev`
- 每次重启 ngrok 时 URL 会变化
- 必须使用真实 URL，不能用示例地址

---

## ERR_NGROK_3200 错误 ⭐

### 错误含义
```
ERR_NGROK_3200
The endpoint xxx.ngrok-free.dev is offline.
```

这个错误表示 **ngrok 隧道未启动或已断开**。

### 常见原因和解决方案

#### 1. 使用了错误的 URL（最常见！）⚠️
**症状**: 访问 `https://your-url.ngrok-free.dev` 显示 offline

**原因**: 这是文档中的**示例地址**，不是你的真实地址！

**解决方案**:
```powershell
# 查看你的真实 ngrok URL
.\show_ngrok_url.ps1
```

然后使用输出的**真实 URL**，例如：
```
https://uncarnivorous-ungeographical-julieta.ngrok-free.dev/api/v1/health
```

#### 2. Ngrok 服务未启动
**症状**: 使用真实 URL 仍显示 offline

**检查方法**:
```powershell
.\check_services.ps1
```

**解决方案**:
```powershell
# 启动所有服务（包括 ngrok）
.\start_services.ps1
```

#### 3. Ngrok 进程崩溃
**症状**: 之前正常，突然显示 offline

**解决方案**:
```powershell
# 重启服务
.\stop_services.ps1
.\start_services.ps1

# 查看新的 URL（可能已改变）
.\show_ngrok_url.ps1
```

#### 4. Ngrok URL 过期
**症状**: 旧的 URL 不能用了

**原因**: 
- Ngrok 免费版 URL 会定期更换
- 重启 ngrok 后 URL 改变
- 长时间未使用自动断开

**解决方案**:
```powershell
# 获取最新的 URL
.\show_ngrok_url.ps1

# 或重启服务获取新 URL
.\stop_services.ps1
.\start_services.ps1
```

#### 5. 网络连接问题
**症状**: 本地服务正常，但 ngrok 无法连接到服务器

**诊断方法**:
```powershell
.\diagnose_ngrok_error.ps1
```

**解决方案**:
- 检查网络连接
- 检查防火墙是否阻止 ngrok.exe
- 尝试重启 ngrok 服务

---

## ERR_NGROK_3004 错误

### 错误含义
这个错误表示 ngrok 隧道已建立，但本地服务未正确响应 HTTP 请求。

### 常见原因和解决方案

#### 1. 浏览器访问免费版 ngrok URL
**症状**: 浏览器显示 ngrok 警告页面，要求点击"Visit Site"

**解决方案**:
- 点击页面上的"Visit Site"按钮继续
- 或使用 API 调用时添加请求头: `ngrok-skip-browser-warning: true`

```powershell
# PowerShell 示例
$headers = @{"ngrok-skip-browser-warning"="true"}
Invoke-RestMethod -Uri "https://your-url.ngrok-free.dev/api/v1/health" -Headers $headers
```

```bash
# curl 示例
curl -H "ngrok-skip-browser-warning: true" https://your-url.ngrok-free.dev/api/v1/health
```

#### 2. 本地服务未运行
**症状**: 所有请求都返回 ERR_NGROK_3004

**检查方法**:
```powershell
.\check_services.ps1
```

**解决方案**:
```powershell
.\start_services.ps1
```

#### 3. 端口配置不匹配
**症状**: 服务运行但 ngrok 无法连接

**检查方法**:
- 确认 API 服务器运行在 8080 端口
- 确认 ngrok 转发到 localhost:8080

**解决方案**:
1. 停止服务: `.\stop_services.ps1`
2. 检查 `api_server.js` 中的端口配置
3. 重新启动: `.\start_services.ps1`

#### 4. 请求超时
**症状**: 长时间处理的请求（如 PDF 转换、AI 生成）超时

**当前配置**:
- ngrok 默认超时: 60 秒
- 建议处理时间: < 30 秒

**解决方案**:
- 使用更快的 AI 模型（见 PERFORMANCE_OPTIMIZATION.md）
- 减少 maxTokens 参数
- 优化 PDF 转换设置

#### 5. 服务崩溃或挂起
**症状**: 某些请求导致服务停止响应

**诊断方法**:
1. 查看 ngrok 管理界面: http://localhost:4040
2. 查看 API 服务器日志
3. 测试健康检查端点

**解决方案**:
```powershell
# 重启服务
.\stop_services.ps1
.\start_services.ps1

# 查看状态
.\check_services.ps1
```

#### 6. 防火墙或杀毒软件阻止
**症状**: 本地测试正常，公网访问失败

**解决方案**:
1. 检查 Windows 防火墙设置
2. 临时禁用杀毒软件测试
3. 添加 node.exe 和 ngrok.exe 到白名单

### 实时监控

#### 查看 ngrok 请求历史
打开浏览器访问: http://localhost:4040

这个管理界面显示:
- 所有通过 ngrok 的请求
- 请求和响应的完整内容
- 响应时间和状态码
- 错误详情

#### 查看服务状态
```powershell
.\check_services.ps1
```

#### 测试端点
```powershell
# 本地测试
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/health"

# 公网测试
$headers = @{"ngrok-skip-browser-warning"="true"}
$url = "https://your-url.ngrok-free.dev/api/v1/health"
Invoke-RestMethod -Uri $url -Headers $headers
```

### 性能指标参考

当前统计（从 ngrok metrics）:
- 连接数: 7
- HTTP 请求数: 4
- P50 延迟: ~6 ms
- P90 延迟: ~42 秒（可能是 PDF 处理）

**建议**:
- 健康检查: < 100ms
- 文本生成: < 10 秒
- JPG 处理: < 20 秒
- PDF 处理: < 30 秒

### 常用命令

```powershell
# 启动所有服务
.\start_services.ps1

# 停止所有服务
.\stop_services.ps1

# 检查服务状态
.\check_services.ps1

# 显示公网 URL
.\show_ngrok_url.ps1

# 测试文件上传
.\test_file_upload.ps1

# 测试公网 API
.\test_public_api.ps1
```

### 获取帮助

如果问题仍未解决:
1. 查看 TROUBLESHOOTING.md 获取更多帮助
2. 检查 ngrok 管理界面 (http://localhost:4040) 的请求详情
3. 查看 API 服务器控制台输出
4. 尝试重启服务

### 升级建议

如果经常遇到 ERR_NGROK_3004:
- 考虑升级到 ngrok 付费版（无警告页面，更长超时时间）
- 使用专业的云服务部署（AWS, Azure, 阿里云等）
- 优化代码性能，减少响应时间
