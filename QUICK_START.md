# 🚀 快速开始 - 服务器部署

> **适用于**: 只能通过终端访问的 Linux 服务器

## 📦 方式一: 一键部署 (推荐)

### 1. 上传项目到服务器

```bash
# 方法A: 使用 scp (从本地Windows)
scp -r "f:\LLM4EDA\公司文件\demo generation\embedded-ai-agent" user@server-ip:~/

# 方法B: 使用 Git
ssh user@server-ip
git clone https://github.com/your-repo/embedded-ai-agent.git ~/embedded-ai-agent
```

### 2. 运行一键部署脚本

```bash
cd ~/embedded-ai-agent
chmod +x deploy.sh health_check.sh backup.sh restore.sh
./deploy.sh
```

脚本会自动完成:
- ✅ 检查系统环境
- ✅ 安装依赖 (Node.js, Tesseract, ImageMagick)
- ✅ 安装 npm 包
- ✅ 配置环境变量
- ✅ 配置防火墙
- ✅ 安装和配置 PM2
- ✅ 启动服务
- ✅ 健康检查

### 3. 验证部署

```bash
# 检查服务状态
pm2 list

# 运行健康检查
./health_check.sh

# 测试 API
curl http://localhost:8080/api/v1/health
```

### 4. 访问服务

```bash
# 获取服务器 IP
hostname -I

# 访问地址:
# API: http://SERVER_IP:8080
# Web: http://SERVER_IP:3000
```

---

## 📋 方式二: 手动部署

### 1. 安装系统依赖

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y curl git tesseract-ocr imagemagick build-essential
```

**CentOS/RHEL:**
```bash
sudo yum update -y
sudo yum install -y curl git tesseract ImageMagick gcc-c++ make
```

### 2. 安装 Node.js 18+

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# 安装 Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# 验证
node --version  # 应该 >= 18.0.0
```

### 3. 上传并配置项目

```bash
# 解压或克隆项目
cd ~/embedded-ai-agent

# 安装依赖
npm install --production

# 创建 .env 文件
cat > .env << 'EOF'
QWEN_API_KEY=sk-your-api-key-here
QWEN_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
PORT=8080
NODE_ENV=production
LOG_LEVEL=info
EOF

chmod 600 .env

# 创建必要目录
mkdir -p temp out logs
```

### 4. 安装和配置 PM2

```bash
# 安装 PM2
npm install -g pm2

# 创建 PM2 配置
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'embedded-ai-api',
      script: 'api_server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production' },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      max_memory_restart: '1G',
      autorestart: true
    },
    {
      name: 'embedded-ai-web',
      script: 'web/app.js',
      instances: 1,
      env: { NODE_ENV: 'production' },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      max_memory_restart: '500M',
      autorestart: true
    }
  ]
};
EOF

# 启动服务
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. 配置防火墙

**UFW (Ubuntu):**
```bash
sudo ufw allow 8080/tcp
sudo ufw allow 3000/tcp
sudo ufw status
```

**firewalld (CentOS):**
```bash
sudo firewall-cmd --add-port=8080/tcp --permanent
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

---

## 🔧 常用管理命令

### PM2 服务管理

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
```

### 健康检查

```bash
# 运行完整健康检查
./health_check.sh

# 快速检查
curl http://localhost:8080/api/v1/health
pm2 list
```

### 备份和恢复

```bash
# 备份数据
./backup.sh

# 恢复数据
./restore.sh

# 查看备份
ls -lh ~/embedded-ai-backups/
```

---

## 🧪 测试部署

### 1. 测试 API 端点

```bash
# 健康检查
curl http://localhost:8080/api/v1/health

# 检查工具
curl http://localhost:8080/api/v1/tools

# 上传 PDF 测试 (需要有 test.pdf 文件)
curl -X POST http://localhost:8080/api/v1/generate \
  -F "datasheet=@test.pdf" \
  -F "schematic=@test.pdf" \
  -F "userPrompt=Generate I2C driver code"
```

### 2. 查看生成的代码

```bash
ls -lh out/
cat out/generated_*.c
```

### 3. 监控资源使用

```bash
# CPU 和内存
htop

# PM2 监控
pm2 monit

# 磁盘空间
df -h

# 日志大小
du -sh logs/
```

---

## 🔍 故障排查

### 服务无法启动

```bash
# 查看详细错误
pm2 logs embedded-ai-api --err --lines 50

# 检查端口占用
netstat -tlnp | grep 8080
ss -tlnp | grep 8080

# 检查环境变量
cat .env
```

### API 返回错误

```bash
# 检查 API Key
grep QWEN_API_KEY .env

# 查看 API 日志
pm2 logs embedded-ai-api --lines 100

# 测试 Qwen API 连接
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://dashscope.aliyuncs.com/compatible-mode/v1/models
```

### 依赖缺失

```bash
# 检查 Tesseract
tesseract --version

# 检查 ImageMagick
convert --version

# 重新安装依赖
npm install
```

### 内存不足

```bash
# 检查内存使用
free -h

# 调整 PM2 内存限制
pm2 restart embedded-ai-api --max-memory-restart 500M
```

---

## 📊 监控和维护

### 日志管理

```bash
# 日志轮转 (使用 logrotate)
sudo tee /etc/logrotate.d/embedded-ai << 'EOF'
/home/user/embedded-ai-agent/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 user user
}
EOF

# 手动轮转
sudo logrotate -f /etc/logrotate.d/embedded-ai
```

### 定期备份

```bash
# 添加到 crontab (每天凌晨2点备份)
crontab -e

# 添加这行
0 2 * * * cd ~/embedded-ai-agent && ./backup.sh >> logs/backup.log 2>&1
```

### 更新代码

```bash
# 拉取最新代码
cd ~/embedded-ai-agent
git pull

# 安装新依赖
npm install

# 重启服务
pm2 restart all
```

---

## 🌐 生产环境建议

### 1. 使用 Nginx 反向代理

```nginx
# /etc/nginx/sites-available/embedded-ai
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. 配置 HTTPS

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com
```

### 3. 设置告警监控

```bash
# 使用 PM2 Plus (可选)
pm2 link <secret> <public>

# 或使用 Prometheus + Grafana
```

---

## 📞 获取帮助

- 📄 查看详细文档: `DEPLOYMENT_GUIDE.md`
- 🐛 报告问题: GitHub Issues
- 💬 技术支持: support@your-company.com

---

**部署成功后，记得:**
1. ✅ 保存 API Key 和服务器信息
2. ✅ 设置定期备份
3. ✅ 配置告警通知
4. ✅ 记录在案，文档归档
