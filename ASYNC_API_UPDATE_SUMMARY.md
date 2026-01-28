# 异步 API 更新总结

## 📋 更新概览

版本：**v2.1**  
更新日期：**2024-01-15**  
更新类型：**新功能 - 异步 API**

---

## 🎯 核心改进

### 问题背景

原同步 API 存在以下问题：
1. ❌ 长时间占用 HTTP 连接（60-180秒）
2. ❌ 容易遇到网关超时（如 Nginx 默认60秒）
3. ❌ 客户端必须一直等待，无法做其他事
4. ❌ 无法查询进度
5. ❌ 无法处理并发任务
6. ❌ 网络断开则任务丢失

### 解决方案

实现了**完整的异步任务系统**：

```
同步模式（旧）:
客户端 → 发送请求 → 等待 60-180秒 → 收到结果

异步模式（新）:
客户端 → 提交任务 → 立即返回 task_id（<1秒）
     → 轮询状态 → 查看进度
     → 任务完成 → 下载结果
```

---

## 📦 新增功能

### 1. 任务管理器 (`src/task_manager.js`)

**核心功能**：
- ✅ 异步任务队列管理
- ✅ 并发控制（最多3个并发任务）
- ✅ 任务状态追踪（pending/processing/completed/failed）
- ✅ 实时进度更新
- ✅ 任务日志记录
- ✅ 自动清理过期任务（24小时）

**特性**：
```javascript
// 支持4种任务状态
TaskStatus.PENDING     // 等待处理
TaskStatus.PROCESSING  // 正在处理  
TaskStatus.COMPLETED   // 已完成
TaskStatus.FAILED      // 失败

// 进度信息
progress: {
  current_step: 2,      // 当前步骤
  total_steps: 3,       // 总步骤
  step_name: "Parsing schematic",
  percentage: 60        // 完成百分比
}
```

### 2. 新增 API 接口

#### 2.1 提交异步任务
```
POST /api/v1/generate/async
上传文件 → 立即返回 task_id
响应时间: <1秒
```

#### 2.2 查询任务状态
```
GET /api/v1/tasks/{task_id}
返回：status, progress, 时间信息
响应时间: <100ms
```

#### 2.3 下载结果
```
GET /api/v1/tasks/{task_id}/result
返回：generated_code + metadata
支持：JSON格式 或 文件下载
```

#### 2.4 任务列表
```
GET /api/v1/tasks
返回：所有任务 + 统计信息
支持：按状态过滤，限制数量
```

#### 2.5 删除任务
```
DELETE /api/v1/tasks/{task_id}
删除任务和结果文件
```

### 3. 完整文档

- **ASYNC_API_GUIDE.md** - 88KB 详细指南
  - API 工作流程图
  - 接口详细说明
  - 多语言示例（PowerShell/Python/JavaScript）
  - 最佳实践
  - 常见问题

### 4. 测试脚本

- **test_async_api.mjs** - 完整测试套件
  - 提交任务测试
  - 进度轮询测试（带进度条）
  - 结果下载测试
  - 任务列表测试

---

## 🔄 API 对比

| 特性 | 同步 API | 异步 API |
|------|---------|----------|
| **接口** | `/api/v1/generate` | `/api/v1/generate/async` |
| **响应时间** | 60-180 秒 | < 1 秒 |
| **超时风险** | ⚠️ 高 | ✅ 无 |
| **进度查询** | ❌ 不支持 | ✅ 支持 |
| **并发处理** | ❌ 有限 | ✅ 最多3个 |
| **任务队列** | ❌ 无 | ✅ 有 |
| **结果保留** | ❌ 立即丢失 | ✅ 保留24小时 |
| **网络断开** | ❌ 任务丢失 | ✅ 可重新查询 |
| **适用场景** | 快速测试 | 生产环境 |

---

## 📝 使用示例

### PowerShell（最简单）

```powershell
# 1. 提交任务
$form = @{
    datasheet = Get-Item "datasheet.pdf"
    schematic = Get-Item "schematic.pdf"
    instruction = "生成初始化代码"
}
$response = Invoke-RestMethod `
    -Uri "http://localhost:8080/api/v1/generate/async" `
    -Method Post -Form $form
$taskId = $response.task_id

# 2. 轮询状态
do {
    Start-Sleep -Seconds 5
    $status = Invoke-RestMethod `
        -Uri "http://localhost:8080/api/v1/tasks/$taskId"
    Write-Host "Progress: $($status.progress.percentage)%"
} while ($status.status -eq "processing")

# 3. 下载结果
$result = Invoke-RestMethod `
    -Uri "http://localhost:8080/api/v1/tasks/$taskId/result"
$result.generated_code | Out-File "generated.c" -Encoding UTF8
```

### Python

```python
import requests, time

# 1. 提交任务
files = {
    'datasheet': open('datasheet.pdf', 'rb'),
    'schematic': open('schematic.pdf', 'rb')
}
response = requests.post(
    'http://localhost:8080/api/v1/generate/async',
    files=files,
    data={'instruction': '生成初始化代码'}
)
task_id = response.json()['task_id']

# 2. 轮询状态
while True:
    time.sleep(5)
    status = requests.get(
        f'http://localhost:8080/api/v1/tasks/{task_id}'
    ).json()
    print(f"Progress: {status['progress']['percentage']}%")
    if status['status'] != 'processing':
        break

# 3. 下载结果
result = requests.get(
    f'http://localhost:8080/api/v1/tasks/{task_id}/result'
).json()
with open('generated.c', 'w', encoding='utf-8') as f:
    f.write(result['generated_code'])
```

---

## 🎯 最佳实践

### 1. 轮询策略

推荐使用**指数退避**：
```javascript
// 前30秒：每5秒
// 30-60秒：每10秒  
// 60秒+：每15秒

let interval = 5000;
if (attempts > 6) interval = 10000;
if (attempts > 12) interval = 15000;
```

### 2. 超时处理

```javascript
// 设置总超时（例如5分钟）
const timeout = 300000;
const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), timeout);
});

await Promise.race([pollUntilComplete(taskId), timeoutPromise]);
```

### 3. 错误重试

```javascript
async function generateWithRetry(files, instruction, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const taskId = await submitTask(files, instruction);
            return await pollAndDownload(taskId);
        } catch (error) {
            if (attempt === maxRetries) throw error;
            await sleep(attempt * 10000); // 指数退避
        }
    }
}
```

### 4. 批量处理

```javascript
// 并行提交多个任务
const taskIds = await Promise.all(
    tasks.map(t => submitTask(t.files, t.instruction))
);

// 并行轮询
const results = await Promise.all(
    taskIds.map(id => pollAndDownload(id))
);
```

---

## 📊 性能优势

### 资源占用对比

**同步模式**：
```
连接时间: 150秒
CPU使用: 中等（持续）
内存占用: 中等（持续）
并发能力: 低（受限于连接数）
```

**异步模式**：
```
连接时间: <1秒（提交） + <0.1秒×N（查询）
CPU使用: 峰值高，平均低
内存占用: 稳定（队列管理）
并发能力: 高（队列 + 3并发）
```

### 用户体验提升

| 指标 | 同步 | 异步 | 改进 |
|------|------|------|------|
| 首次响应 | 150s | <1s | **99.3%↓** |
| 可控性 | 无 | 高 | **100%↑** |
| 可靠性 | 低 | 高 | **显著提升** |
| 进度可见 | ❌ | ✅ | **新增** |

---

## 🔧 系统配置

### 并发控制

在 `src/task_manager.js` 中调整：

```javascript
constructor() {
    this.maxConcurrent = 3;  // ← 最大并发数
}
```

**建议值**：
- 开发环境：1-2
- 测试环境：2-3
- 生产环境：3-5（取决于服务器性能）

### 任务清理

```javascript
// 自动清理策略
const maxAge = 24 * 60 * 60 * 1000; // 24小时

// 清理频率
setInterval(() => {
    taskManager.cleanupOldTasks();
}, 60 * 60 * 1000); // 每小时
```

---

## 📈 监控指标

### 通过 API 获取统计信息

```javascript
GET /api/v1/tasks

{
  "stats": {
    "total": 50,              // 总任务数
    "pending": 5,             // 等待中
    "processing": 2,          // 处理中
    "completed": 40,          // 已完成
    "failed": 3,              // 失败
    "queue_length": 5,        // 队列长度
    "current_processing": 2   // 当前处理数
  }
}
```

### 关键监控指标

1. **queue_length** - 队列积压情况
   - <5: 正常
   - 5-10: 注意
   - >10: 需要增加并发或优化性能

2. **failed / total** - 失败率
   - <5%: 正常
   - 5-10%: 需要关注
   - >10%: 需要排查问题

3. **平均处理时间** - 性能指标
   - <60s: 优秀
   - 60-120s: 正常
   - >120s: 需要优化

---

## 🔄 向后兼容

### 保留同步 API

原同步接口 `POST /api/v1/generate` **完全保留**，不影响现有集成。

### 迁移建议

1. **逐步迁移**
   ```
   阶段1: 新功能使用异步API
   阶段2: 测试环境切换到异步API
   阶段3: 生产环境逐步切换
   ```

2. **双模式并存**
   ```javascript
   // 根据需求选择
   if (quickTest) {
       await callSyncAPI();  // 快速测试
   } else {
       await callAsyncAPI(); // 生产使用
   }
   ```

---

## 🐛 故障排查

### 问题1：任务一直pending

**原因**：达到最大并发数  
**解决**：
1. 检查 `GET /api/v1/tasks` 的 `current_processing`
2. 等待正在处理的任务完成
3. 或增加 `maxConcurrent` 值

### 问题2：轮询获取不到任务

**原因**：任务可能被清理或task_id错误  
**解决**：
1. 检查 task_id 是否正确
2. 确认任务未超过24小时
3. 使用 `GET /api/v1/tasks` 查看所有任务

### 问题3：结果下载失败

**原因**：任务尚未完成或失败  
**解决**：
1. 先查询状态确认 `status === 'completed'`
2. 检查是否有错误信息
3. 查看服务器日志

---

## 📦 文件清单

### 新增文件

1. **src/task_manager.js** (12.5 KB)
   - 任务管理器核心实现
   - 队列、状态、进度管理

2. **ASYNC_API_GUIDE.md** (88 KB)
   - 完整的异步API使用指南
   - 多语言示例
   - 最佳实践

3. **test_async_api.mjs** (10.2 KB)
   - 完整的测试套件
   - 带进度条的演示

### 修改文件

1. **api_server.js** (+320 行)
   - 添加5个新接口
   - 集成任务管理器

2. **README.md** (+80 行)
   - 更新版本说明
   - 添加异步API介绍
   - 更新文档索引

---

## ✅ 测试验证

### 测试命令

```bash
# 1. 启动API服务器
cd embedded-ai-agent
node api_server.js

# 2. 运行异步API测试
cd ..
node test_async_api.mjs
```

### 预期输出

```
╔════════════════════════════════════════════════════════════════╗
║          🧪 Async API Complete Test Suite                     ║
╚════════════════════════════════════════════════════════════════╝

[1/4] Checking test files...
   ✓ Datasheet: BF7615CMXX.pdf
   ✓ Schematic: Schematic Prints.pdf

[2/4] Preparing request...
   ✓ Form data prepared

[3/4] Submitting task to async API...
   ✓ Task submitted in 456ms (0.46s)

[4/4] Task info:
   • Task ID: task_1705312845123_abc123
   • Status: accepted
   • Estimated time: 60-180 seconds

╔════════════════════════════════════════════════════════════════╗
║          🔄 Polling Task Status                               ║
╚════════════════════════════════════════════════════════════════╝

[████████████████████████████████████░░░░░░░░░░░░░░] 75% [2/3] Parsing schematic

✅ Task completed
   • Total polling time: 125678ms (125.68s)
   • Poll attempts: 25
   • Processing time: 124s

✅ Async API Test Passed!
```

---

## 🎉 总结

### 主要成就

1. ✅ **实现了完整的异步任务系统**
2. ✅ **解决了所有同步API的痛点**
3. ✅ **提供了详细的文档和示例**
4. ✅ **保持了向后兼容性**
5. ✅ **提升了用户体验和系统可靠性**

### 适用场景

**使用异步API当**：
- 生产环境部署
- 需要处理多个任务
- 需要实时进度反馈
- 网络环境不稳定
- 集成到复杂系统

**使用同步API当**：
- 快速测试
- 简单脚本
- 网络环境稳定且延迟低

### 下一步建议

1. **WebSocket支持** - 实时推送进度（未来版本）
2. **任务优先级** - 支持优先任务（未来版本）
3. **持久化存储** - 任务重启后恢复（未来版本）
4. **更多监控指标** - Prometheus集成（未来版本）

---

## 📚 相关文档

- [异步API完整指南](ASYNC_API_GUIDE.md)
- [API参考文档](API_REFERENCE.md)
- [详细日志指南](DETAILED_LOGGING_GUIDE.md)
- [故障排查指南](TROUBLESHOOTING.md)

---

**最后更新**: 2024-01-15  
**版本**: v2.1  
**维护者**: Embedded AI Agent Team
