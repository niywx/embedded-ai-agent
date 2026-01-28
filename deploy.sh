#!/bin/bash

###############################################################################
# 嵌入式AI代码生成系统 - 一键部署脚本
# 用途: 在Linux服务器上自动部署整个系统
# 要求: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
###############################################################################

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

###############################################################################
# 0. 检查运行权限
###############################################################################

if [ "$EUID" -eq 0 ]; then 
    log_warn "建议不要以root身份运行此脚本，请使用普通用户"
    read -p "是否继续? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

###############################################################################
# 1. 系统检查
###############################################################################

log_step "1. 检查系统环境"

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
    log_info "检测到操作系统: $PRETTY_NAME"
else
    log_error "无法检测操作系统类型"
    exit 1
fi

# 检查磁盘空间 (至少2GB)
available_space=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$available_space" -lt 2 ]; then
    log_error "磁盘空间不足! 需要至少2GB，当前可用: ${available_space}GB"
    exit 1
fi
log_info "磁盘空间检查通过: ${available_space}GB 可用"

# 检查内存 (建议至少2GB)
total_mem=$(free -g | awk '/^Mem:/{print $2}')
if [ "$total_mem" -lt 2 ]; then
    log_warn "内存不足2GB，可能影响性能。当前: ${total_mem}GB"
fi

###############################################################################
# 2. 安装系统依赖
###############################################################################

log_step "2. 安装系统依赖"

install_dependencies() {
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        log_info "使用 apt 安装依赖..."
        sudo apt update
        sudo apt install -y curl git tesseract-ocr imagemagick build-essential
    elif [[ "$OS" == "centos" ]] || [[ "$OS" == "rhel" ]] || [[ "$OS" == "rocky" ]]; then
        log_info "使用 yum 安装依赖..."
        sudo yum update -y
        sudo yum install -y curl git tesseract ImageMagick gcc-c++ make
    else
        log_error "不支持的操作系统: $OS"
        exit 1
    fi
}

# 检查是否已安装
if ! command -v tesseract &> /dev/null; then
    log_info "安装 Tesseract OCR..."
    install_dependencies
else
    log_info "系统依赖已安装"
fi

# 验证安装
tesseract --version | head -1
convert --version | head -1

###############################################################################
# 3. 安装 Node.js (使用 nvm)
###############################################################################

log_step "3. 安装 Node.js 18+"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        log_info "Node.js 已安装: $(node --version)"
    else
        log_warn "Node.js 版本过低，需要升级到18+"
    fi
else
    log_info "安装 Node.js 18 via nvm..."
    
    # 安装nvm
    if [ ! -d "$HOME/.nvm" ]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    # 使用nvm安装Node.js 18
    nvm install 18
    nvm use 18
    nvm alias default 18
fi

node --version
npm --version

###############################################################################
# 4. 配置项目目录
###############################################################################

log_step "4. 配置项目目录"

PROJECT_DIR="$HOME/embedded-ai-agent"
log_info "项目目录: $PROJECT_DIR"

# 如果目录不存在，提示用户上传代码
if [ ! -d "$PROJECT_DIR" ]; then
    log_warn "项目目录不存在，请选择上传方式:"
    echo "  1) 从Git仓库克隆"
    echo "  2) 使用scp/rsync上传后继续"
    echo "  3) 退出(手动上传后重新运行)"
    read -p "选择 (1/2/3): " upload_choice
    
    case $upload_choice in
        1)
            read -p "请输入Git仓库URL: " git_url
            git clone "$git_url" "$PROJECT_DIR"
            ;;
        2)
            log_info "请从另一终端执行:"
            echo "  scp -r /path/to/embedded-ai-agent user@$(hostname -I | awk '{print $1}'):~/embedded-ai-agent"
            read -p "上传完成后按回车继续..."
            if [ ! -d "$PROJECT_DIR" ]; then
                log_error "未检测到项目目录，退出"
                exit 1
            fi
            ;;
        3)
            exit 0
            ;;
        *)
            log_error "无效选择"
            exit 1
            ;;
    esac
fi

cd "$PROJECT_DIR"
log_info "当前位置: $(pwd)"

###############################################################################
# 5. 安装 npm 依赖
###############################################################################

log_step "5. 安装 npm 依赖"

# 可选: 使用国内镜像加速
read -p "是否使用淘宝npm镜像加速? (y/N): " use_mirror
if [[ "$use_mirror" =~ ^[Yy]$ ]]; then
    npm config set registry https://registry.npmmirror.com
    log_info "已设置淘宝镜像"
fi

log_info "安装依赖包 (可能需要几分钟)..."
npm install --production

log_info "依赖安装完成"

###############################################################################
# 6. 配置环境变量
###############################################################################

log_step "6. 配置环境变量"

if [ ! -f .env ]; then
    log_info "创建 .env 文件..."
    
    read -p "请输入 Qwen API Key (必填): " api_key
    read -p "API 端口 (默认8080): " api_port
    api_port=${api_port:-8080}
    
    read -p "Web 端口 (默认3000): " web_port
    web_port=${web_port:-3000}
    
    cat > .env << EOF
# Qwen API 配置
QWEN_API_KEY=${api_key}
QWEN_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1

# 服务器配置
PORT=${api_port}
WEB_PORT=${web_port}
NODE_ENV=production

# 日志配置
LOG_LEVEL=info

# 文件限制
MAX_FILE_SIZE=50mb
EOF
    
    chmod 600 .env
    log_info ".env 文件已创建"
else
    log_info ".env 文件已存在，跳过创建"
fi

###############################################################################
# 7. 创建必要目录
###############################################################################

log_step "7. 创建必要目录"

mkdir -p temp out logs
log_info "目录结构:"
ls -lh | grep -E "temp|out|logs"

###############################################################################
# 8. 配置防火墙
###############################################################################

log_step "8. 配置防火墙 (可选)"

source .env 2>/dev/null || true
API_PORT=${PORT:-8080}
WEB_PORT=${WEB_PORT:-3000}

read -p "是否配置防火墙开放端口 $API_PORT 和 $WEB_PORT? (y/N): " setup_firewall

if [[ "$setup_firewall" =~ ^[Yy]$ ]]; then
    if command -v ufw &> /dev/null; then
        sudo ufw allow $API_PORT/tcp
        sudo ufw allow $WEB_PORT/tcp
        sudo ufw status
        log_info "ufw 防火墙已配置"
    elif command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --add-port=$API_PORT/tcp --permanent
        sudo firewall-cmd --add-port=$WEB_PORT/tcp --permanent
        sudo firewall-cmd --reload
        sudo firewall-cmd --list-ports
        log_info "firewalld 防火墙已配置"
    else
        log_warn "未检测到防火墙管理工具，请手动配置"
    fi
fi

###############################################################################
# 9. 安装和配置 PM2
###############################################################################

log_step "9. 安装和配置 PM2"

if ! command -v pm2 &> /dev/null; then
    log_info "安装 PM2..."
    npm install -g pm2
else
    log_info "PM2 已安装: $(pm2 --version)"
fi

# 创建 PM2 配置文件
if [ ! -f ecosystem.config.js ]; then
    log_info "创建 PM2 配置文件..."
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
      script: 'web/app.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
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
    log_info "PM2 配置文件已创建"
fi

###############################################################################
# 10. 启动服务
###############################################################################

log_step "10. 启动服务"

log_info "使用 PM2 启动服务..."
pm2 start ecosystem.config.js

# 等待服务启动
sleep 3

# 检查服务状态
pm2 list

# 保存 PM2 配置
pm2 save

# 配置开机自启
log_info "配置 PM2 开机自启..."
pm2 startup | tail -1 | bash || true

###############################################################################
# 11. 健康检查
###############################################################################

log_step "11. 健康检查"

log_info "等待服务就绪..."
sleep 5

# 检查 API 服务
API_URL="http://localhost:$API_PORT/api/v1/health"
if curl -s "$API_URL" | grep -q "ok"; then
    log_info "✓ API 服务运行正常: $API_URL"
else
    log_warn "✗ API 服务可能未就绪，请检查日志: pm2 logs embedded-ai-api"
fi

# 检查 Web 服务
WEB_URL="http://localhost:$WEB_PORT"
if curl -s -o /dev/null -w "%{http_code}" "$WEB_URL" | grep -qE "^(200|301|302)"; then
    log_info "✓ Web 服务运行正常: $WEB_URL"
else
    log_warn "✗ Web 服务可能未就绪，请检查日志: pm2 logs embedded-ai-web"
fi

###############################################################################
# 12. 部署完成
###############################################################################

log_step "🎉 部署完成!"

cat << EOF

${GREEN}部署信息:${NC}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  项目目录: $PROJECT_DIR
  API 地址: http://$(hostname -I | awk '{print $1}'):$API_PORT
  Web 地址: http://$(hostname -I | awk '{print $1}'):$WEB_PORT
  日志目录: $PROJECT_DIR/logs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${YELLOW}常用命令:${NC}
  查看服务状态:  pm2 list
  查看日志:      pm2 logs
  重启服务:      pm2 restart all
  停止服务:      pm2 stop all
  查看监控:      pm2 monit
  
  健康检查:      ./health_check.sh
  备份数据:      ./backup.sh
  
${BLUE}测试 API:${NC}
  curl http://localhost:$API_PORT/api/v1/health
  curl http://localhost:$API_PORT/api/v1/tools

${RED}重要提示:${NC}
  1. 请确保 .env 文件中的 QWEN_API_KEY 有效
  2. 定期备份 out/ 目录中的生成代码
  3. 监控 logs/ 目录的日志文件大小
  4. 生产环境建议配置 Nginx 反向代理和 HTTPS

详细文档: https://github.com/your-repo/embedded-ai-agent
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

log_info "如有问题，请查看部署日志或执行 pm2 logs"
