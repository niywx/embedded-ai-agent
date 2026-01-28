# 🚀 服务器部署指南

> **项目**: Embedded AI Agent - MCU代码生成系统  
> **部署环境**: Linux服务器 (仅终端访问)  
> **更新日期**: 2026年1月28日

---

## 📋 目录

1. [前置准备](#1-前置准备)
2. [方案对比](#2-部署方案对比)
3. [推荐方案：使用PM2部署](#3-推荐方案使用pm2部署)
4. [替代方案：Docker部署](#4-替代方案docker部署)
5. [安全配置](#5-安全配置)
6. [监控与日志](#6-监控与日志)
7. [故障排查](#7-故障排查)

---

## 1. 前置准备

### 1.1 检查服务器环境

```bash
# 连接到服务器
ssh user@your-server-ip

# 检查系统信息
cat /etc/os-release
uname -a

# 检查磁盘空间 (至少需要2GB空闲)
df -h

# 检查内存 (建议至少2GB)
free -h
```

### 1.2 必需的系统依赖

```bash
# 更新包管理器
sudo apt update  # Ubuntu/Debian
# 或
sudo yum update  # CentOS/RHEL

# 安装Node.js 18+ (推荐使用nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
node --version  # 确认版本 >= 18.0.0

# 安装Git
sudo apt install git -y  # Ubuntu/Debian
# 或
sudo yum install git -y  # CentOS/RHEL

# 安装Tesseract OCR (用于图片识别)
sudo apt install tesseract-ocr -y
tesseract --version

# 可选: 安装ImageMagick (用于PDF转图片)
sudo apt install imagemagick -y
convert --version
```

### 1.3 配置防火墙

```bash
# 开放API端口 (8080) 和 Web端口 (3000)
sudo ufw allow 8080/tcp
sudo ufw allow 3000/tcp
sudo ufw status

# 如果使用firewalld (CentOS)
sudo firewall-cmd --add-port=8080/tcp --permanent
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

---

## 2. 部署方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|-----|------|---------|
| **PM2** | • 简单快速<br>• 自动重启<br>• 日志管理<br>• 负载均衡 | • 需手动配置环境 | ✅ 推荐用于生产环境 |
| **systemd** | • 系统原生<br>• 开机自启 | • 配置较复杂 | 适合Linux专家 |
| **Docker** | • 环境隔离<br>• 易迁移 | • 需要Docker知识<br>• 占用资源多 | 适合容器化环境 |
| **nohup** | • 最简单 | • 无监控<br>• 无自动重启 | ❌ 仅用于测试 |

---

## 3. 推荐方案：使用PM2部署

### 3.1 上传项目到服务器

**方法1: 使用Git (推荐)**

```bash
# 在服务器上克隆项目
cd ~
git clone https://github.com/your-repo/embedded-ai-agent.git
cd embedded-ai-agent

# 或者如果是私有仓库
git clone https://<token>@github.com/your-repo/embedded-ai-agent.git
```

**方法2: 使用SCP上传**

```bash
# 在本地执行 (Windows上使用PowerShell或Git Bash)
scp -r "f:\LLM4EDA\公司文件\demo generation\embedded-ai-agent" user@your-server:/home/user/

# 连接到服务器
ssh user@your-server
cd ~/embedded-ai-agent
```

**方法3: 使用rsync (增量同步)**

```bash
# 从本地同步到服务器
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude 'temp/*' \
  --exclude 'out/*' \
  "f:/LLM4EDA/公司文件/demo generation/embedded-ai-agent/" \
  user@your-server:~/embedded-ai-agent/
```

### 3.2 安装依赖

```bash
cd ~/embedded-ai-agent

# 安装npm依赖
npm install

# 如果网络慢，使用国内镜像
npm config set registry https://registry.npmmirror.com
npm install
```

### 3.3 配置环境变量

```bash
# 创建.env文件
cat > .env << 'EOF'
# Qwen API配置
QWEN_API_KEY=sk-your-actual-api-key-here
QWEN_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1

# 服务器配置
PORT=8080
NODE_ENV=production

# 日志配置
LOG_LEVEL=info

# 文件限制
MAX_FILE_SIZE=50mb
EOF

# 设置文件权限
chmod 600 .env
```

### 3.4 安装和配置PM2

```bash
# 全局安装PM2
npm install -g pm2

# 创建PM2配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'embedded-ai-api',
      script: 'api_server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'embedded-ai-web',
      script: 'web/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '500M',
      autorestart: true,
      watch: false
    }
  ]
};
EOF

# 创建日志目录
mkdir -p logs
```

### 3.5 启动服务

```bash
# 使用PM2启动所有服务
pm2 start ecosystem.config.js

# 查看服务状态
pm2 list
pm2 status

# 查看日志
pm2 logs embedded-ai-api --lines 50
pm2 logs embedded-ai-web --lines 50

# 保存PM2配置，实现开机自启
pm2 save
pm2 startup  # 按照提示执行生成的命令
```

### 3.6 常用PM2命令

```bash
# 重启服务
pm2 restart embedded-ai-api
pm2 restart all

# 停止服务
pm2 stop embedded-ai-api
pm2 stop all

# 重新加载 (零停机)
pm2 reload embedded-ai-api

# 删除服务
pm2 delete embedded-ai-api

# 查看详细信息
pm2 show embedded-ai-api

# 实时监控
pm2 monit

# 查看日志
pm2 logs
pm2 logs embedded-ai-api --err  # 仅错误日志
pm2 flush  # 清空日志
```

---

## 4. 替代方案：Docker部署

### 4.1 创建Dockerfile

```bash
cd ~/embedded-ai-agent

cat > Dockerfile << 'EOF'
# 使用官方Node.js镜像
FROM node:18-alpine

# 安装系统依赖
RUN apk add --no-cache \
    tesseract-ocr \
    imagemagick \
    ghostscript \
    bash

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制项目文件
COPY . .

# 创建必要的目录
RUN mkdir -p temp out logs

# 暴露端口
EXPOSE 8080 3000

# 设置环境变量
ENV NODE_ENV=production

# 启动命令
CMD ["node", "api_server.js"]
EOF
```

### 4.2 创建docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  api:
    build: .
    container_name: embedded-ai-api
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
      - QWEN_API_KEY=${QWEN_API_KEY}
    volumes:
      - ./temp:/app/temp
      - ./out:/app/out
      - ./logs:/app/logs
    command: node api_server.js
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  web:
    build: .
    container_name: embedded-ai-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./logs:/app/logs
    command: node web/server.js
    depends_on:
      - api
EOF
```

### 4.3 使用Docker Compose部署

```bash
# 安装Docker和Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 构建并启动
docker-compose up -d

# 查看状态
docker-compose ps
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 5. 安全配置

### 5.1 使用Nginx反向代理

```bash
# 安装Nginx
sudo apt install nginx -y

# 创建配置文件
sudo nano /etc/nginx/sites-available/embedded-ai
```

```nginx
# Nginx配置
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或IP

    client_max_body_size 50M;

    # API服务
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置 (AI推理可能较长)
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Web界面
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://localhost:3000;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/embedded-ai /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl restart nginx
```

### 5.2 配置HTTPS (使用Let's Encrypt)

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 5.3 限流配置

在Nginx配置中添加：

```nginx
# 限制请求频率
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    # ...existing config...
    
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        # ...existing proxy config...
    }
}
```

---

## 6. 监控与日志

### 6.1 日志管理

```bash
# 配置logrotate防止日志过大
sudo nano /etc/logrotate.d/embedded-ai
```

```
/home/user/embedded-ai-agent/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 user user
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 6.2 性能监控

```bash
# 安装PM2监控工具
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# 使用PM2 Plus (可选，需要注册)
pm2 link <secret> <public>
```

### 6.3 健康检查脚本

```bash
cat > healthcheck.sh << 'EOF'
#!/bin/bash
# 健康检查脚本

API_URL="http://localhost:8080/api/v1/health"

response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $response -eq 200 ]; then
    echo "[$(date)] ✅ API服务正常"
    exit 0
else
    echo "[$(date)] ❌ API服务异常 (HTTP $response)"
    pm2 restart embedded-ai-api
    exit 1
fi
EOF

chmod +x healthcheck.sh

# 添加到crontab，每5分钟检查一次
crontab -e
# 添加: */5 * * * * /home/user/embedded-ai-agent/healthcheck.sh >> /home/user/embedded-ai-agent/logs/healthcheck.log 2>&1
```

---

## 7. 故障排查

### 7.1 常见问题

**问题1: 端口被占用**
```bash
# 查看端口占用
sudo lsof -i :8080
sudo netstat -tulpn | grep 8080

# 杀死占用进程
sudo kill -9 <PID>
```

**问题2: Tesseract OCR未安装**
```bash
# 检查Tesseract
which tesseract
tesseract --version

# 重新安装
sudo apt install tesseract-ocr tesseract-ocr-eng -y
```

**问题3: 内存不足**
```bash
# 查看内存使用
free -h
pm2 list  # 查看每个进程的内存

# 调整PM2配置中的max_memory_restart
pm2 restart ecosystem.config.js --update-env
```

**问题4: API密钥错误**
```bash
# 检查环境变量
cat .env | grep QWEN_API_KEY

# 测试API连接
curl -X POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
  -H "Authorization: Bearer $QWEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-max","messages":[{"role":"user","content":"test"}]}'
```

### 7.2 调试模式

```bash
# 停止PM2服务
pm2 stop all

# 直接运行查看详细日志
NODE_ENV=development node api_server.js

# 或使用debug模式
DEBUG=* node api_server.js
```

### 7.3 性能分析

```bash
# 查看进程详情
pm2 show embedded-ai-api

# 生成性能报告
pm2 profile embedded-ai-api

# 查看慢日志
grep "slow" logs/api-out.log
```

---

## 8. 更新部署

### 8.1 滚动更新

```bash
# 拉取最新代码
cd ~/embedded-ai-agent
git pull origin main

# 安装新依赖
npm install

# 零停机重启
pm2 reload ecosystem.config.js
```

### 8.2 备份策略

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份代码
tar -czf $BACKUP_DIR/code_$DATE.tar.gz embedded-ai-agent/ --exclude='node_modules' --exclude='temp/*'

# 备份输出文件
tar -czf $BACKUP_DIR/output_$DATE.tar.gz embedded-ai-agent/out/

# 保留最近7天的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "[$(date)] Backup completed: $BACKUP_DIR"
EOF

chmod +x backup.sh

# 添加到每日备份计划
crontab -e
# 添加: 0 2 * * * /home/user/embedded-ai-agent/backup.sh
```

---

## 9. 快速部署脚本

```bash
# 保存为 deploy.sh
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 开始部署 Embedded AI Agent..."

# 1. 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到Node.js, 请先安装"
    exit 1
fi

# 2. 安装依赖
echo "📦 安装npm依赖..."
npm install

# 3. 检查环境变量
if [ ! -f .env ]; then
    echo "⚠️  未找到.env文件，请手动创建"
    echo "示例: QWEN_API_KEY=your-key-here"
fi

# 4. 安装PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装PM2..."
    npm install -g pm2
fi

# 5. 创建必要目录
mkdir -p logs temp out

# 6. 启动服务
echo "🎬 启动服务..."
pm2 start ecosystem.config.js
pm2 save

echo "✅ 部署完成!"
echo "查看状态: pm2 list"
echo "查看日志: pm2 logs"
EOF

chmod +x deploy.sh
./deploy.sh
```

---

## 10. 总结与检查清单

### 部署完成检查

- [ ] Node.js 18+ 已安装
- [ ] Tesseract OCR 已安装
- [ ] 项目代码已上传
- [ ] npm依赖已安装
- [ ] .env文件已配置
- [ ] PM2已安装并配置
- [ ] 服务已启动 (`pm2 list`)
- [ ] 防火墙端口已开放
- [ ] 健康检查可通过: `curl http://localhost:8080/api/v1/health`
- [ ] 日志正常: `pm2 logs`
- [ ] 开机自启已配置: `pm2 startup`

### 访问地址

```
API服务:  http://your-server-ip:8080
Web界面:  http://your-server-ip:3000
健康检查: http://your-server-ip:8080/api/v1/health
```

### 紧急联系

如遇问题，查看日志:
```bash
pm2 logs embedded-ai-api --err
tail -f logs/api-error.log
```

---

**祝部署顺利！** 🎉

如有问题，请查看故障排查章节或联系技术支持。
