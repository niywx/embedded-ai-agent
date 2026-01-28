# systemd 服务安装指南

如果您不想使用 PM2，可以使用 systemd 来管理服务。

## 📋 安装步骤

### 1. 修改服务文件

编辑 `embedded-ai.service` 和 `embedded-ai-web.service`，替换以下内容:

- `youruser` → 您的实际用户名
- `/home/youruser/embedded-ai-agent` → 项目实际路径
- `/home/youruser/.nvm/versions/node/v18.0.0/bin/node` → Node.js 实际路径

查找 Node.js 路径:
```bash
which node
# 或
type -p node
```

### 2. 复制服务文件

```bash
sudo cp embedded-ai.service /etc/systemd/system/
sudo cp embedded-ai-web.service /etc/systemd/system/
```

### 3. 重新加载 systemd

```bash
sudo systemctl daemon-reload
```

### 4. 启用服务 (开机自启)

```bash
sudo systemctl enable embedded-ai.service
sudo systemctl enable embedded-ai-web.service
```

### 5. 启动服务

```bash
sudo systemctl start embedded-ai.service
sudo systemctl start embedded-ai-web.service
```

### 6. 检查状态

```bash
sudo systemctl status embedded-ai.service
sudo systemctl status embedded-ai-web.service
```

## 🔧 常用命令

```bash
# 查看服务状态
sudo systemctl status embedded-ai

# 启动服务
sudo systemctl start embedded-ai

# 停止服务
sudo systemctl stop embedded-ai

# 重启服务
sudo systemctl restart embedded-ai

# 查看日志
journalctl -u embedded-ai.service -f
journalctl -u embedded-ai.service --since "1 hour ago"

# 查看服务配置
systemctl cat embedded-ai.service

# 禁用开机自启
sudo systemctl disable embedded-ai
```

## 📊 日志位置

- API 服务日志: `logs/api-service.log`
- API 错误日志: `logs/api-error.log`
- Web 服务日志: `logs/web-service.log`
- Web 错误日志: `logs/web-error.log`
- systemd 日志: `journalctl -u embedded-ai.service`

## ⚙️ 高级配置

### 自动重启策略

服务文件中已配置:
- `Restart=on-failure`: 失败时自动重启
- `RestartSec=10s`: 重启前等待10秒

### 资源限制

- API 服务: 最大 2GB 内存, 80% CPU
- Web 服务: 最大 1GB 内存, 50% CPU

可根据实际情况调整 `MemoryMax` 和 `CPUQuota`。

### 安全加固

服务已配置以下安全选项:
- `NoNewPrivileges=true`: 禁止提权
- `PrivateTmp=true`: 使用私有 /tmp
- `ProtectSystem=strict`: 严格保护系统目录
- `ProtectHome=read-only`: 只读访问 home 目录

## 🔍 故障排查

### 服务无法启动

```bash
# 检查详细错误信息
sudo systemctl status embedded-ai.service -l

# 查看最近日志
journalctl -u embedded-ai.service -n 50

# 验证配置文件语法
systemd-analyze verify embedded-ai.service
```

### 权限问题

确保:
1. 用户有权限访问项目目录
2. `temp/`, `out/`, `logs/` 目录可写
3. `.env` 文件权限正确 (600)

```bash
chmod 600 .env
chmod -R 755 temp out logs
```

### Node.js 找不到

如果使用 nvm 安装的 Node.js，需要找到实际路径:

```bash
# 找到 Node.js 路径
~/.nvm/current/bin/node --version

# 更新服务文件中的 ExecStart
ExecStart=/home/youruser/.nvm/current/bin/node api_server.js
```

## 📚 参考资料

- [systemd 官方文档](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
- [systemd for Developers](https://www.freedesktop.org/software/systemd/man/systemd-system.conf.html)
