# 异步 API 使用指南

本文档介绍如何使用异步模式的代码生成 API，适合需要处理长时间任务、避免超时问题的场景。

---

## 📋 目录

1. [为什么使用异步 API](#为什么使用异步-api)
2. [API 工作流程](#api-工作流程)
3. [接口详细说明](#接口详细说明)
4. [使用示例](#使用示例)
5. [最佳实践](#最佳实践)
6. [与同步 API 对比](#与同步-api-对比)

---

## 为什么使用异步 API

### 同步 API 的问题

```
客户端 → 发送请求 → 等待 60-180 秒 → 收到完整代码
              ↓
        HTTP 连接保持打开
```

**痛点：**
- ❌ 长时间占用 HTTP 连接（60-180秒）
- ❌ 可能遇到网关超时（如 Nginx默认60秒）
- ❌ 客户端必须一直等待，无法做其他事
- ❌ 无法查询进度
- ❌ 无法处理多个并发任务
- ❌ 网络断开则任务丢失

### 异步 API 的优势

```
客户端 → 提交任务 → 立即返回 task_id (< 1秒)
              ↓
        后台处理 60-180 秒
              ↓
客户端 → 轮询状态 → 查看进度
              ↓
        任务完成
              ↓
客户端 → 下载结果
```

**优势：**
- ✅ 立即返回，不阻塞（< 1秒响应）
- ✅ 可以实时查询进度
- ✅ 支持并发处理多个任务
- ✅ 避免超时问题
- ✅ 更好的用户体验（可显示进度条）
- ✅ 网络断开后可重新连接查询
- ✅ 任务结果可保留24小时供下载

---

## API 工作流程

### 标准流程

```
┌─────────────────────────────────────────────────────────────┐
│  步骤 1: 提交任务                                          │
│  POST /api/v1/generate/async                               │
│                                                             │
│  上传：datasheet.pdf + schematic.pdf + instruction          │
│  返回：task_id = "task_1705312845123_abc123"              │
│  耗时：< 1 秒                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  步骤 2: 轮询状态（每 5-10 秒查询一次）                   │
│  GET /api/v1/tasks/{task_id}                               │
│                                                             │
│  返回：status = "processing"                                │
│        progress = { step: 2/3, percentage: 60% }           │
│  耗时：< 100 ms                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                     (等待任务完成)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  步骤 3: 下载结果                                          │
│  GET /api/v1/tasks/{task_id}/result                        │
│                                                             │
│  返回：generated_code + metadata                            │
│  耗时：< 500 ms                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 接口详细说明

### 1. 提交任务

**接口**: `POST /api/v1/generate/async`

**请求参数**:
```
multipart/form-data:
  - datasheet: 数据手册文件 (PDF)
  - schematic: 原理图文件 (PNG/JPG/PDF)
  - instruction: 代码生成需求 (文本)
```

**响应示例**:
```json
{
  "status": "accepted",
  "task_id": "task_1705312845123_abc123",
  "message": "Task accepted and queued for processing",
  "estimated_time": "60-180 seconds",
  "poll_url": "/api/v1/tasks/task_1705312845123_abc123",
  "result_url": "/api/v1/tasks/task_1705312845123_abc123/result",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

**HTTP 状态码**:
- `202 Accepted` - 任务已接受
- `400 Bad Request` - 参数错误
- `500 Internal Server Error` - 服务器错误

---

### 2. 查询任务状态

**接口**: `GET /api/v1/tasks/{task_id}`

**响应示例 - 处理中**:
```json
{
  "task_id": "task_1705312845123_abc123",
  "status": "processing",
  "progress": {
    "current_step": 2,
    "total_steps": 3,
    "step_name": "Parsing schematic",
    "percentage": 60
  },
  "created_at": "2024-01-15T10:30:45.123Z",
  "updated_at": "2024-01-15T10:31:30.456Z",
  "started_at": "2024-01-15T10:30:46.789Z",
  "completed_at": null
}
```

**响应示例 - 已完成**:
```json
{
  "task_id": "task_1705312845123_abc123",
  "status": "completed",
  "progress": {
    "current_step": 3,
    "total_steps": 3,
    "step_name": "Completed",
    "percentage": 100
  },
  "created_at": "2024-01-15T10:30:45.123Z",
  "updated_at": "2024-01-15T10:33:15.789Z",
  "started_at": "2024-01-15T10:30:46.789Z",
  "completed_at": "2024-01-15T10:33:15.789Z",
  "result_available": true,
  "result_url": "/api/v1/tasks/task_1705312845123_abc123/result",
  "result_summary": {
    "registers_count": 15,
    "pin_mappings_count": 8,
    "code_lines": 145,
    "processing_time": "150s"
  }
}
```

**响应示例 - 失败**:
```json
{
  "task_id": "task_1705312845123_abc123",
  "status": "failed",
  "progress": {
    "current_step": 1,
    "total_steps": 3,
    "step_name": "Extract registers",
    "percentage": 10
  },
  "created_at": "2024-01-15T10:30:45.123Z",
  "updated_at": "2024-01-15T10:31:00.456Z",
  "started_at": "2024-01-15T10:30:46.789Z",
  "completed_at": "2024-01-15T10:31:00.456Z",
  "error": {
    "message": "API timeout",
    "stack": "..."
  }
}
```

**HTTP 状态码**:
- `200 OK` - 查询成功
- `404 Not Found` - 任务不存在

**任务状态枚举**:
- `pending` - 等待处理（在队列中）
- `processing` - 正在处理
- `completed` - 已完成
- `failed` - 失败

---

### 3. 下载结果

**接口**: `GET /api/v1/tasks/{task_id}/result`

**查询参数**:
- `download=file` - 下载为文件（可选）

**响应示例 - JSON 格式** (默认):
```json
{
  "status": "success",
  "task_id": "task_1705312845123_abc123",
  "generated_code": "/**\n * @file generated.c\n * ...\n */\n\n#include <stdint.h>\n...",
  "metadata": {
    "output_filename": "generated_1705312845123.c",
    "registers_count": 15,
    "pin_mappings_count": 8,
    "code_lines": 145,
    "code_size": 3654,
    "processing_time": "150s",
    "created_at": "2024-01-15T10:30:45.123Z",
    "completed_at": "2024-01-15T10:33:15.789Z"
  }
}
```

**响应示例 - 文件下载**:
```
GET /api/v1/tasks/{task_id}/result?download=file

Content-Type: text/plain; charset=utf-8
Content-Disposition: attachment; filename="generated_1705312845123.c"

/**
 * @file generated.c
 * ...
 */
...
```

**HTTP 状态码**:
- `200 OK` - 成功获取结果
- `404 Not Found` - 任务不存在
- `425 Too Early` - 任务尚未完成
- `500 Internal Server Error` - 任务失败

---

### 4. 获取任务列表

**接口**: `GET /api/v1/tasks`

**查询参数**:
- `status` - 过滤状态（pending/processing/completed/failed）
- `limit` - 限制数量（默认 20）

**响应示例**:
```json
{
  "tasks": [
    {
      "task_id": "task_1705312845123_abc123",
      "status": "completed",
      "progress": { "current_step": 3, "total_steps": 3, "percentage": 100 },
      "created_at": "2024-01-15T10:30:45.123Z",
      "updated_at": "2024-01-15T10:33:15.789Z",
      "completed_at": "2024-01-15T10:33:15.789Z",
      "duration": "150s"
    },
    {
      "task_id": "task_1705312800000_xyz789",
      "status": "processing",
      "progress": { "current_step": 2, "total_steps": 3, "percentage": 60 },
      "created_at": "2024-01-15T10:28:00.000Z",
      "updated_at": "2024-01-15T10:30:30.456Z",
      "completed_at": null,
      "duration": null
    }
  ],
  "stats": {
    "total": 10,
    "pending": 2,
    "processing": 1,
    "completed": 6,
    "failed": 1,
    "queue_length": 2,
    "current_processing": 1
  },
  "timestamp": "2024-01-15T10:33:20.000Z"
}
```

---

### 5. 删除任务

**接口**: `DELETE /api/v1/tasks/{task_id}`

**响应示例**:
```json
{
  "status": "success",
  "message": "Task deleted",
  "task_id": "task_1705312845123_abc123",
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

**HTTP 状态码**:
- `200 OK` - 删除成功
- `400 Bad Request` - 无法删除（如正在处理中）
- `404 Not Found` - 任务不存在

**注意**: 正在处理中的任务不能删除。

---

## 使用示例

### PowerShell 示例

```powershell
# 步骤 1: 提交任务
$form = @{
    datasheet = Get-Item -Path "BF7615CMXX.pdf"
    schematic = Get-Item -Path "Schematic Prints.pdf"
    instruction = "生成初始化代码"
}

$response = Invoke-RestMethod `
    -Uri "http://localhost:8080/api/v1/generate/async" `
    -Method Post `
    -Form $form

$taskId = $response.task_id
Write-Host "Task submitted: $taskId"
Write-Host "Estimated time: $($response.estimated_time)"

# 步骤 2: 轮询状态
do {
    Start-Sleep -Seconds 5
    
    $status = Invoke-RestMethod `
        -Uri "http://localhost:8080/api/v1/tasks/$taskId" `
        -Method Get
    
    Write-Host "Status: $($status.status) - Progress: $($status.progress.percentage)%"
    
} while ($status.status -eq "pending" -or $status.status -eq "processing")

# 步骤 3: 下载结果
if ($status.status -eq "completed") {
    $result = Invoke-RestMethod `
        -Uri "http://localhost:8080/api/v1/tasks/$taskId/result" `
        -Method Get
    
    $result.generated_code | Out-File "generated.c" -Encoding UTF8
    Write-Host "✅ Code generated successfully!"
    Write-Host "Registers: $($result.metadata.registers_count)"
    Write-Host "Pin mappings: $($result.metadata.pin_mappings_count)"
} else {
    Write-Host "❌ Task failed: $($status.error.message)"
}
```

---

### Python 示例

```python
import requests
import time

# 步骤 1: 提交任务
files = {
    'datasheet': open('BF7615CMXX.pdf', 'rb'),
    'schematic': open('Schematic Prints.pdf', 'rb')
}
data = {
    'instruction': '生成初始化代码'
}

response = requests.post(
    'http://localhost:8080/api/v1/generate/async',
    files=files,
    data=data
)

task_id = response.json()['task_id']
print(f"Task submitted: {task_id}")
print(f"Estimated time: {response.json()['estimated_time']}")

# 步骤 2: 轮询状态
while True:
    time.sleep(5)
    
    status_response = requests.get(
        f'http://localhost:8080/api/v1/tasks/{task_id}'
    )
    status = status_response.json()
    
    print(f"Status: {status['status']} - Progress: {status['progress']['percentage']}%")
    
    if status['status'] in ['completed', 'failed']:
        break

# 步骤 3: 下载结果
if status['status'] == 'completed':
    result_response = requests.get(
        f'http://localhost:8080/api/v1/tasks/{task_id}/result'
    )
    result = result_response.json()
    
    with open('generated.c', 'w', encoding='utf-8') as f:
        f.write(result['generated_code'])
    
    print("✅ Code generated successfully!")
    print(f"Registers: {result['metadata']['registers_count']}")
    print(f"Pin mappings: {result['metadata']['pin_mappings_count']}")
else:
    print(f"❌ Task failed: {status['error']['message']}")
```

---

### JavaScript (Node.js) 示例

```javascript
import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';

async function generateCodeAsync() {
    // 步骤 1: 提交任务
    const form = new FormData();
    form.append('datasheet', fs.createReadStream('BF7615CMXX.pdf'));
    form.append('schematic', fs.createReadStream('Schematic Prints.pdf'));
    form.append('instruction', '生成初始化代码');

    const submitResponse = await fetch('http://localhost:8080/api/v1/generate/async', {
        method: 'POST',
        body: form
    });
    
    const submitResult = await submitResponse.json();
    const taskId = submitResult.task_id;
    
    console.log(`Task submitted: ${taskId}`);
    console.log(`Estimated time: ${submitResult.estimated_time}`);

    // 步骤 2: 轮询状态
    let status;
    do {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const statusResponse = await fetch(`http://localhost:8080/api/v1/tasks/${taskId}`);
        status = await statusResponse.json();
        
        console.log(`Status: ${status.status} - Progress: ${status.progress.percentage}%`);
        
    } while (status.status === 'pending' || status.status === 'processing');

    // 步骤 3: 下载结果
    if (status.status === 'completed') {
        const resultResponse = await fetch(`http://localhost:8080/api/v1/tasks/${taskId}/result`);
        const result = await resultResponse.json();
        
        fs.writeFileSync('generated.c', result.generated_code, 'utf-8');
        
        console.log('✅ Code generated successfully!');
        console.log(`Registers: ${result.metadata.registers_count}`);
        console.log(`Pin mappings: ${result.metadata.pin_mappings_count}`);
    } else {
        console.log(`❌ Task failed: ${status.error.message}`);
    }
}

generateCodeAsync().catch(console.error);
```

---

## 最佳实践

### 1. 轮询间隔

推荐轮询间隔：
- **前 30 秒**: 每 5 秒查询一次（快速反馈）
- **30-60 秒**: 每 10 秒查询一次
- **60 秒以上**: 每 15 秒查询一次

```javascript
async function pollWithBackoff(taskId) {
    let attempts = 0;
    while (true) {
        // 动态调整间隔
        let interval = 5000; // 默认 5 秒
        if (attempts > 6) interval = 10000; // 30秒后改为 10秒
        if (attempts > 12) interval = 15000; // 60秒后改为 15秒
        
        await new Promise(resolve => setTimeout(resolve, interval));
        
        const status = await checkTaskStatus(taskId);
        attempts++;
        
        if (status.status !== 'pending' && status.status !== 'processing') {
            return status;
        }
    }
}
```

### 2. 错误处理

```javascript
async function generateWithRetry(files, instruction, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const taskId = await submitTask(files, instruction);
            const status = await pollUntilComplete(taskId);
            
            if (status.status === 'completed') {
                return await downloadResult(taskId);
            } else if (status.status === 'failed') {
                console.error(`Attempt ${attempt} failed: ${status.error.message}`);
                if (attempt < maxRetries) {
                    console.log(`Retrying in ${attempt * 10} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, attempt * 10000));
                }
            }
        } catch (error) {
            console.error(`Attempt ${attempt} error: ${error.message}`);
            if (attempt === maxRetries) throw error;
        }
    }
    throw new Error('All retry attempts failed');
}
```

### 3. 进度显示

```javascript
// 控制台进度条
function displayProgress(progress) {
    const bar = '█'.repeat(Math.floor(progress.percentage / 2)) + 
                '░'.repeat(50 - Math.floor(progress.percentage / 2));
    
    process.stdout.write(`\r[${bar}] ${progress.percentage}% - ${progress.step_name}`);
}

// 使用
while (status.status === 'processing') {
    displayProgress(status.progress);
    await sleep(5000);
    status = await checkTaskStatus(taskId);
}
```

### 4. 超时处理

```javascript
async function generateWithTimeout(files, instruction, timeoutMs = 300000) {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
    });
    
    const generationPromise = generateCodeAsync(files, instruction);
    
    return Promise.race([generationPromise, timeoutPromise]);
}
```

### 5. 批量处理

```javascript
async function processBatch(tasks) {
    // 同时提交多个任务
    const taskIds = await Promise.all(
        tasks.map(task => submitTask(task.files, task.instruction))
    );
    
    console.log(`Submitted ${taskIds.length} tasks`);
    
    // 并行轮询所有任务
    const results = await Promise.all(
        taskIds.map(taskId => pollAndDownload(taskId))
    );
    
    return results;
}
```

---

## 与同步 API 对比

| 特性 | 同步 API | 异步 API |
|------|---------|----------|
| **接口** | `POST /api/v1/generate` | `POST /api/v1/generate/async` |
| **响应时间** | 60-180 秒 | < 1 秒 |
| **超时风险** | ⚠️ 高（可能被网关中断） | ✅ 无（立即返回） |
| **进度查询** | ❌ 不支持 | ✅ 支持 |
| **并发处理** | ❌ 有限 | ✅ 最多 3 个并发 |
| **任务队列** | ❌ 无 | ✅ 有 |
| **结果保留** | ❌ 立即返回后丢失 | ✅ 保留 24 小时 |
| **网络断开** | ❌ 任务丢失 | ✅ 可重新查询 |
| **适用场景** | 快速测试、简单集成 | 生产环境、长时间任务 |

---

## 系统配置

### 任务管理器配置

在 `src/task_manager.js` 中可以调整参数：

```javascript
constructor() {
    super();
    this.tasks = new Map();
    this.maxConcurrent = 3;  // ← 最大并发任务数
    this.currentProcessing = 0;
    this.queue = [];
}
```

### 任务清理策略

- 自动清理：每小时自动删除超过 24 小时的已完成/失败任务
- 手动清理：调用 `DELETE /api/v1/tasks/{task_id}`

---

## 常见问题

### Q1: 为什么任务一直处于 pending 状态？

**原因**: 达到最大并发数（默认3个），任务在队列中等待。

**解决**: 
- 等待前面的任务完成
- 增加 `maxConcurrent` 值
- 删除不需要的任务

---

### Q2: 如何知道任务是否真的在处理？

**方法**: 
1. 查看 `started_at` 字段（不为 null 表示已开始）
2. 监控 `updated_at` 字段（持续更新表示在处理）
3. 观察 `progress.percentage` 是否增加

---

### Q3: 任务失败后如何重试？

**方法 1**: 删除失败的任务，重新提交
```javascript
await fetch(`/api/v1/tasks/${taskId}`, { method: 'DELETE' });
const newTaskId = await submitTask(files, instruction);
```

**方法 2**: 实现自动重试逻辑（见最佳实践）

---

### Q4: 如何监控系统整体状态？

**方法**: 定期查询任务列表和统计信息
```javascript
const stats = await fetch('/api/v1/tasks').then(r => r.json());
console.log(`Total: ${stats.stats.total}`);
console.log(`Processing: ${stats.stats.processing}`);
console.log(`Queue: ${stats.stats.queue_length}`);
```

---

## 总结

异步 API 是**生产环境的推荐方案**，提供：

✅ **可靠性** - 避免超时，任务不会丢失  
✅ **可监控性** - 实时查看进度  
✅ **可扩展性** - 支持并发和队列  
✅ **更好的用户体验** - 立即响应 + 进度显示  

同步 API 适合：
- 快速测试
- 简单脚本
- 网络环境稳定且延迟低的场景

---

## 相关文档

- [API 完整文档](API_REFERENCE.md)
- [集成指南](INTEGRATION_GUIDE.md)
- [详细日志指南](DETAILED_LOGGING_GUIDE.md)

---

**最后更新**: 2024-01-15  
**版本**: 1.0  
**维护者**: Embedded AI Agent Team
