# 🚀 部署工具集使用说明

## 📁 文件清单

本项目提供了完整的部署工具集,适合在**仅终端访问**的Linux服务器上部署:

### 核心部署脚本
- **`deploy.sh`** - 一键自动部署脚本 (推荐)
- **`health_check.sh`** - 系统健康检查脚本
- **`backup.sh`** - 数据备份脚本
- **`restore.sh`** - 数据恢复脚本

### Windows 上传工具
- **`upload_to_server.ps1`** - 从Windows上传项目到服务器

### systemd 服务配置
- **`systemd/embedded-ai.service`** - API服务systemd配置
- **`systemd/embedded-ai-web.service`** - Web服务systemd配置
- **`systemd/INSTALL_SYSTEMD.md`** - systemd安装指南

### 文档
- **`QUICK_START.md`** - 快速开始指南 ⭐
- **`DEPLOYMENT_GUIDE.md`** - 详细部署手册
- **`README.md`** - 项目说明

---

## 🎯 推荐部署流程

### 方案 A: 使用 PowerShell 脚本上传 (Windows → Linux)

**1. 在 Windows 本地执行:**

```powershell
cd "f:\LLM4EDA\公司文件\demo generation\embedded-ai-agent"

# 运行上传脚本
.\upload_to_server.ps1

# 或指定服务器参数
.\upload_to_server.ps1 -ServerUser ubuntu -ServerHost 192.168.1.100
```

脚本会:
- ✅ 自动打包项目 (排除 node_modules, logs 等)
- ✅ 上传到服务器
- ✅ 设置执行权限
- ✅ 可选: 立即运行部署脚本

**2. 脚本会询问是否立即部署,选择 'y' 即可自动完成部署。**

---

### 方案 B: 手动 SSH 上传和部署

**1. 使用 SCP 上传:**

```powershell
# 在 Windows PowerShell 或 Git Bash 中执行
scp -r "f:\LLM4EDA\公司文件\demo generation\embedded-ai-agent" user@server-ip:~/
```

**2. SSH 登录服务器:**

```bash
ssh user@server-ip
```

**3. 运行一键部署:**

```bash
cd ~/embedded-ai-agent
chmod +x deploy.sh health_check.sh backup.sh restore.sh
./deploy.sh
```

---

### 方案 C: 使用 Git (如果有代码仓库)

**1. 在服务器上克隆:**

```bash
git clone https://github.com/your-repo/embedded-ai-agent.git ~/embedded-ai-agent
cd ~/embedded-ai-agent
```

**2. 运行部署脚本:**

```bash
chmod +x *.sh
./deploy.sh
```

---

## 🔧 脚本功能说明

### 1️⃣ deploy.sh - 一键部署 ⭐

**功能:**
- 自动检测操作系统 (Ubuntu/Debian/CentOS)
- 安装系统依赖 (Node.js, Tesseract, ImageMagick)
- 安装 npm 包
- 配置环境变量 (.env)
- 配置防火墙
- 安装和配置 PM2
- 启动服务
- 健康检查

**使用:**
```bash
./deploy.sh
```

**交互式配置:**
- Qwen API Key (必填)
- API 端口 (默认8080)
- Web 端口 (默认3000)
- 是否配置防火墙
- 是否使用国内npm镜像

**预计时间:** 5-10分钟

---

### 2️⃣ health_check.sh - 健康检查

**功能:**
- 检查系统资源 (CPU, 内存, 磁盘)
- 检查 PM2 服务状态
- 检查端口监听
- HTTP 健康检查
- 检查系统依赖
- 检查环境变量
- 显示最近的错误日志
- 综合健康评分

**使用:**
```bash
./health_check.sh
```

**何时使用:**
- 部署完成后验证
- 定期系统巡检
- 故障排查
- 性能监控

---

### 3️⃣ backup.sh - 数据备份

**功能:**
- 备份配置文件 (.env, ecosystem.config.js)
- 备份生成的代码 (out/)
- 备份日志文件 (最近7天)
- 可选备份临时文件 (最近3天)
- 自动压缩
- 保留最近5个备份
- 可选上传到远程服务器

**使用:**
```bash
./backup.sh
```

**备份位置:**
```
~/embedded-ai-backups/embedded-ai-backup_YYYYMMDD_HHMMSS.tar.gz
```

**建议频率:**
- 每天自动备份 (使用 cron)
- 重大更新前手动备份

---

### 4️⃣ restore.sh - 数据恢复

**功能:**
- 列出所有可用备份
- 选择备份文件恢复
- 自动停止服务
- 备份当前数据 (以防万一)
- 恢复配置和数据
- 重启服务
- 验证恢复结果

**使用:**
```bash
./restore.sh
```

**何时使用:**
- 数据丢失或损坏
- 配置文件错误
- 回滚到之前版本
- 迁移到新服务器

---

### 5️⃣ upload_to_server.ps1 - Windows 上传工具

**功能:**
- 从 Windows 上传项目到 Linux
- 自动排除不必要的文件
- 支持 scp 或 rsync
- 测试服务器连接
- 设置脚本权限
- 可选立即部署

**使用:**
```powershell
# 交互式
.\upload_to_server.ps1

# 指定参数
.\upload_to_server.ps1 -ServerUser ubuntu -ServerHost 192.168.1.100

# 使用 rsync (如果已安装)
.\upload_to_server.ps1 -UseRsync
```

**前提条件:**
- 已安装 Git for Windows 或 OpenSSH
- 可以 SSH 连接到服务器

---

## 📊 部署后管理

### 日常运维命令

```bash
# 查看服务状态
pm2 list
pm2 status

# 查看日志
pm2 logs
pm2 logs embedded-ai-api --lines 100

# 重启服务
pm2 restart all
pm2 restart embedded-ai-api

# 停止服务
pm2 stop all

# 实时监控
pm2 monit

# 健康检查
./health_check.sh

# 备份数据
./backup.sh
```

### 测试 API

```bash
# 健康检查
curl http://localhost:8080/api/v1/health

# 检查工具
curl http://localhost:8080/api/v1/tools

# 上传文件测试
curl -X POST http://localhost:8080/api/v1/generate \
  -F "datasheet=@test.pdf" \
  -F "schematic=@test.pdf" \
  -F "userPrompt=Generate I2C driver code"
```

### 定期维护

```bash
# 添加到 crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * cd ~/embedded-ai-agent && ./backup.sh >> logs/backup.log 2>&1

# 每小时健康检查 (可选)
0 * * * * cd ~/embedded-ai-agent && ./health_check.sh >> logs/health.log 2>&1
```

---

## 🔍 故障排查

### 部署失败

```bash
# 查看详细错误
cat /tmp/deploy-error.log

# 检查系统依赖
node --version
npm --version
tesseract --version
```

### 服务无法启动

```bash
# 查看 PM2 日志
pm2 logs embedded-ai-api --err --lines 50

# 检查端口占用
netstat -tlnp | grep 8080
ss -tlnp | grep 8080

# 检查环境变量
cat .env
```

### 内存或性能问题

```bash
# 检查资源使用
./health_check.sh

# 调整 PM2 内存限制
pm2 restart embedded-ai-api --max-memory-restart 500M

# 查看系统资源
htop
df -h
free -h
```

---

## 📚 相关文档

- **`QUICK_START.md`** - 快速开始,适合第一次部署
- **`DEPLOYMENT_GUIDE.md`** - 详细部署手册,包含所有细节
- **`systemd/INSTALL_SYSTEMD.md`** - systemd 服务配置 (高级)
- **`README.md`** - 项目功能说明

---

## 🎓 最佳实践

### ✅ 部署前
1. 准备好 Qwen API Key
2. 确认服务器配置 (≥2GB 内存, ≥2GB 磁盘)
3. 记录服务器 IP 和登录信息

### ✅ 部署中
1. 使用 `upload_to_server.ps1` 或 scp 上传
2. 运行 `./deploy.sh` 一键部署
3. 按提示输入配置信息

### ✅ 部署后
1. 运行 `./health_check.sh` 验证
2. 测试 API 端点
3. 配置定期备份 (cron)
4. 记录部署信息

### ✅ 生产环境
1. 配置 Nginx 反向代理
2. 启用 HTTPS (Certbot)
3. 设置日志轮转 (logrotate)
4. 配置监控告警
5. 定期更新和备份

---

## 💡 常见问题

**Q: 如何更新代码?**
```bash
cd ~/embedded-ai-agent
git pull  # 如果使用 Git
npm install  # 安装新依赖
pm2 restart all  # 重启服务
```

**Q: 如何修改 API Key?**
```bash
nano .env  # 编辑环境变量
pm2 restart all  # 重启生效
```

**Q: 如何查看生成的代码?**
```bash
ls -lh out/
cat out/generated_*.c
```

**Q: 如何清理临时文件?**
```bash
rm -rf temp/*  # 清理上传的临时文件
pm2 flush  # 清理 PM2 日志
```

**Q: 如何卸载?**
```bash
pm2 delete all  # 删除 PM2 进程
pm2 unstartup  # 移除开机自启
rm -rf ~/embedded-ai-agent  # 删除项目
```

---

## 📞 技术支持

如遇问题:
1. 查看日志: `pm2 logs`
2. 运行健康检查: `./health_check.sh`
3. 查看详细文档: `DEPLOYMENT_GUIDE.md`
4. 联系技术支持

---

**祝您部署顺利! 🎉**
