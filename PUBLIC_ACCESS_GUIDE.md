# 公网访问部署指南

## 🌐 问题：不在同一网络下如何访问？

如果您的用户**不在同一局域网**，他们无法直接访问 `http://localhost:8080` 或 `http://192.168.x.x:8080`。

需要将服务暴露到公网。以下是三种推荐方案，从简单到专业：

---

## 🚀 方案一：内网穿透（最简单，5分钟搞定）

### 适用场景
- ✅ 快速演示和测试
- ✅ 临时分享给远程用户
- ✅ 无需购买服务器
- ✅ 不需要公网 IP

### 推荐工具

#### 1. ngrok（推荐，最流行）

**步骤：**

1. **下载安装 ngrok**
   ```powershell
   # 访问 https://ngrok.com/download
   # 下载 Windows 版本并解压
   ```

2. **注册并获取 Token**
   ```powershell
   # 访问 https://dashboard.ngrok.com/get-started/your-authtoken
   # 复制你的 authtoken
   
   # 配置 token
   .\ngrok.exe config add-authtoken YOUR_TOKEN_HERE
   ```

3. **启动 API 服务器**
   ```powershell
   # 终端 1
   cd "f:\LLM4EDA\公司文件\demo generation\embedded-ai-agent"
   $env:QWEN_API_KEY = "your-api-key"
   npm run api
   ```

4. **启动 ngrok 穿透**
   ```powershell
   # 终端 2
   .\ngrok.exe http 8080
   ```

5. **获取公网 URL**
   ```
   ngrok by @inconshreveable
   
   Session Status                online
   Account                       your-email@example.com (Plan: Free)
   Version                       3.x.x
   Region                        Asia Pacific (ap)
   Forwarding                    https://abc123.ngrok-free.app -> http://localhost:8080
   
   # 🎉 使用这个 URL: https://abc123.ngrok-free.app
   ```

6. **分享给用户**
   ```python
   # 用户使用公网 URL
   from embedded_ai_client import EmbeddedAIClient
   
   client = EmbeddedAIClient('https://abc123.ngrok-free.app')
   result = client.generate_code('chip.pdf', 'board.png', '生成驱动')
   ```

**优点：**
- ✅ 5 分钟搞定
- ✅ 免费版可用
- ✅ 自动 HTTPS
- ✅ 稳定快速

**缺点：**
- ⚠️ 免费版 URL 每次重启会变
- ⚠️ 每月有流量限制（1GB/月免费）

---

#### 2. cpolar（国内推荐，中文界面）

**步骤：**

1. **下载安装**
   ```powershell
   # 访问 https://www.cpolar.com/
   # 下载 Windows 版本并安装
   ```

2. **注册并登录**
   ```powershell
   cpolar authtoken YOUR_TOKEN
   ```

3. **启动穿透**
   ```powershell
   # 终端 1: 启动 API 服务
   npm run api
   
   # 终端 2: 启动 cpolar
   cpolar http 8080
   ```

4. **获取公网地址**
   ```
   公网地址1: http://abc123.cpolar.cn
   公网地址2: https://abc123.cpolar.cn
   ```

**优点：**
- ✅ 国内访问速度快
- ✅ 中文界面
- ✅ 免费版可用
- ✅ 自动 HTTPS

---

#### 3. 花生壳（老牌工具）

**步骤：**

1. 访问 https://hsk.oray.com/
2. 下载并安装客户端
3. 注册账号并登录
4. 创建内网穿透映射：
   - 内网主机: 127.0.0.1
   - 内网端口: 8080
   - 外网域名: 系统分配

**优点：**
- ✅ 国内老牌，稳定
- ✅ 免费版可用

---

### 内网穿透对比

| 工具 | 速度 | 免费额度 | 稳定性 | 推荐度 |
|------|------|---------|--------|--------|
| **ngrok** | ⭐⭐⭐⭐ | 1GB/月 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **cpolar** | ⭐⭐⭐⭐⭐ | 2GB/月 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **花生壳** | ⭐⭐⭐ | 1GB/月 | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## ☁️ 方案二：云服务器部署（推荐生产环境）

### 适用场景
- ✅ 长期稳定运行
- ✅ 固定域名
- ✅ 不限流量
- ✅ 专业对外服务

### 云服务器选择

| 平台 | 最低配置 | 价格 | 推荐度 |
|------|---------|------|--------|
| **阿里云** | 2核2G | ¥60-100/月 | ⭐⭐⭐⭐⭐ |
| **腾讯云** | 2核2G | ¥60-100/月 | ⭐⭐⭐⭐⭐ |
| **AWS** | t2.small | $15-25/月 | ⭐⭐⭐⭐ |
| **Azure** | B1s | $10-20/月 | ⭐⭐⭐⭐ |

### 完整部署步骤

#### 步骤 1: 购买云服务器

**推荐配置：**
- CPU: 2核
- 内存: 2GB 或 4GB
- 硬盘: 40GB
- 操作系统: Ubuntu 20.04 LTS
- 带宽: 1Mbps 或更高

#### 步骤 2: 连接服务器

**Windows:**
```powershell
# 使用 PuTTY 或 PowerShell SSH
ssh root@your-server-ip
```

**Mac/Linux:**
```bash
ssh root@your-server-ip
```

#### 步骤 3: 安装环境

```bash
# 1. 更新系统
sudo apt update && sudo apt upgrade -y

# 2. 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 验证安装
node --version  # 应该显示 v20.x.x
npm --version

# 4. 安装 PM2（进程管理工具）
sudo npm install -g pm2

# 5. 安装 Git
sudo apt install -y git
```

#### 步骤 4: 部署代码

```bash
# 1. 克隆代码（或上传代码）
cd /home
git clone your-repository-url
# 或使用 scp/sftp 上传代码

# 2. 进入项目目录
cd embedded-ai-agent

# 3. 安装依赖
npm install

# 4. 配置环境变量
echo "QWEN_API_KEY=your-api-key" > .env
echo "PORT=8080" >> .env

# 5. 测试运行
npm run api
# Ctrl+C 停止
```

#### 步骤 5: 使用 PM2 管理进程

```bash
# 1. 启动服务
pm2 start api_server.js --name embedded-ai-api

# 2. 查看状态
pm2 status

# 3. 查看日志
pm2 logs embedded-ai-api

# 4. 设置开机自启
pm2 startup
pm2 save

# 5. 常用命令
pm2 restart embedded-ai-api  # 重启
pm2 stop embedded-ai-api     # 停止
pm2 delete embedded-ai-api   # 删除
```

#### 步骤 6: 配置防火墙

```bash
# 开放 8080 端口
sudo ufw allow 8080/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 查看状态
sudo ufw status
```

现在可以通过 `http://your-server-ip:8080` 访问！

#### 步骤 7: 配置域名（可选但推荐）

1. **购买域名**
   - 阿里云：https://wanwang.aliyun.com/
   - 腾讯云：https://dnspod.cloud.tencent.com/

2. **配置 DNS 解析**
   ```
   类型: A
   主机记录: api
   记录值: your-server-ip
   ```

3. **等待生效**（5-30分钟）
   ```bash
   # 测试解析
   ping api.yourdomain.com
   ```

#### 步骤 8: 配置 Nginx 反向代理

```bash
# 1. 安装 Nginx
sudo apt install -y nginx

# 2. 创建配置文件
sudo nano /etc/nginx/sites-available/embedded-ai-api
```

**配置内容：**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # 替换为你的域名

    # 客户端上传文件大小限制
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 3. 启用配置
sudo ln -s /etc/nginx/sites-available/embedded-ai-api /etc/nginx/sites-enabled/

# 4. 测试配置
sudo nginx -t

# 5. 重启 Nginx
sudo systemctl restart nginx

# 6. 设置开机自启
sudo systemctl enable nginx
```

#### 步骤 9: 配置 HTTPS（强烈推荐）

```bash
# 1. 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 2. 获取 SSL 证书
sudo certbot --nginx -d api.yourdomain.com

# 3. 按提示输入邮箱

# 4. 选择是否强制 HTTPS（推荐选择 2）

# 5. 自动续期测试
sudo certbot renew --dry-run
```

现在可以通过 `https://api.yourdomain.com` 访问！

#### 步骤 10: 测试部署

```powershell
# 在本地测试
Invoke-RestMethod -Uri "https://api.yourdomain.com/api/v1/health"
```

---

### 云服务器完整命令速查

```bash
# === 快速部署脚本 ===

# 1. 安装环境
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx certbot python3-certbot-nginx
sudo npm install -g pm2

# 2. 部署代码
cd /home
git clone your-repo
cd embedded-ai-agent
npm install
echo "QWEN_API_KEY=your-key" > .env

# 3. 启动服务
pm2 start api_server.js --name api
pm2 startup
pm2 save

# 4. 配置防火墙
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 5. 配置 Nginx（创建配置文件后）
sudo nginx -t
sudo systemctl restart nginx

# 6. 配置 SSL
sudo certbot --nginx -d api.yourdomain.com
```

---

## 🐳 方案三：Docker 部署（最专业）

### 适用场景
- ✅ 容器化部署
- ✅ 易于迁移
- ✅ 环境隔离
- ✅ CI/CD 集成

### 部署步骤

#### 1. 创建 Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制所有文件
COPY . .

# 创建必要的目录
RUN mkdir -p temp out

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["node", "api_server.js"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    container_name: embedded-ai-api
    ports:
      - "8080:8080"
    environment:
      - QWEN_API_KEY=${QWEN_API_KEY}
      - PORT=8080
    volumes:
      - ./temp:/app/temp
      - ./out:/app/out
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

#### 3. 创建 .env 文件

```bash
QWEN_API_KEY=your-api-key-here
```

#### 4. 部署到服务器

```bash
# 1. 上传代码到服务器
scp -r embedded-ai-agent root@your-server-ip:/home/

# 2. SSH 连接服务器
ssh root@your-server-ip

# 3. 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl start docker
sudo systemctl enable docker

# 4. 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 5. 进入项目目录
cd /home/embedded-ai-agent

# 6. 构建并启动
docker-compose up -d

# 7. 查看日志
docker-compose logs -f

# 8. 停止服务
docker-compose down
```

---

## 📊 方案对比

| 方案 | 难度 | 成本 | 稳定性 | 速度 | 推荐场景 |
|------|------|------|--------|------|----------|
| **内网穿透** | ⭐ | 免费 | ⭐⭐⭐ | ⭐⭐⭐ | 演示、测试 |
| **云服务器** | ⭐⭐⭐ | ¥60-100/月 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 生产环境 |
| **Docker** | ⭐⭐⭐⭐ | ¥60-100/月 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 专业部署 |

---

## 🎯 推荐选择

### 快速演示（今天就要）
→ **内网穿透（ngrok/cpolar）**
- 5 分钟搞定
- 免费
- 立即可用

### 长期使用（正式环境）
→ **云服务器 + Nginx + HTTPS**
- 稳定可靠
- 固定域名
- 专业形象

### 企业级部署
→ **Docker + 云服务器 + CI/CD**
- 容器化
- 易于扩展
- 自动化部署

---

## 🔒 安全建议

无论使用哪种方案，都建议：

1. **添加 API Key 认证**
   ```javascript
   // api_server.js
   const API_KEYS = new Set(['key1', 'key2']);
   
   app.use((req, res, next) => {
       const apiKey = req.headers['x-api-key'];
       if (!apiKey || !API_KEYS.has(apiKey)) {
           return res.status(401).json({ error: 'Unauthorized' });
       }
       next();
   });
   ```

2. **限制请求频率**
   ```bash
   npm install express-rate-limit
   ```

3. **使用 HTTPS**（生产环境必须）

4. **定期备份数据**

5. **监控日志**
   ```bash
   pm2 logs
   ```

---

## 📞 需要帮助？

- 内网穿透问题：查看工具官方文档
- 云服务器问题：[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- API 问题：[API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- 其他问题：[TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 🎉 总结

**问题**：不在同一网络，用户访问不到本地服务

**解决方案**：
1. **快速方案**：内网穿透（ngrok/cpolar）- 5分钟搞定
2. **正式方案**：云服务器部署 - 长期稳定
3. **专业方案**：Docker 容器化 - 企业级

**立即开始**：选择适合你的方案，让全世界都能访问你的 API！🚀
