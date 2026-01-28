#!/bin/bash

###############################################################################
# 嵌入式AI代码生成系统 - 健康检查脚本
# 用途: 检查所有服务的运行状态、资源使用情况
###############################################################################

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 加载环境变量
if [ -f .env ]; then
    source .env
fi

API_PORT=${PORT:-8080}
WEB_PORT=${WEB_PORT:-3000}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    嵌入式AI代码生成系统 - 健康检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

###############################################################################
# 1. 系统资源检查
###############################################################################

echo -e "${YELLOW}[1] 系统资源使用情况${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# CPU使用率
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
echo -e "CPU使用率: ${cpu_usage}%"

# 内存使用
mem_total=$(free -h | awk '/^Mem:/ {print $2}')
mem_used=$(free -h | awk '/^Mem:/ {print $3}')
mem_percent=$(free | awk '/^Mem:/ {printf("%.1f"), $3/$2 * 100}')
echo -e "内存使用: ${mem_used} / ${mem_total} (${mem_percent}%)"

# 磁盘使用
disk_usage=$(df -h . | tail -1 | awk '{print $5}')
disk_avail=$(df -h . | tail -1 | awk '{print $4}')
echo -e "磁盘使用: ${disk_usage} (可用: ${disk_avail})"

# 资源警告
if (( $(echo "$mem_percent > 80" | bc -l) )); then
    echo -e "${RED}⚠ 内存使用率超过80%!${NC}"
fi

if [[ "${disk_usage%\%}" -gt 85 ]]; then
    echo -e "${RED}⚠ 磁盘使用率超过85%!${NC}"
fi

echo ""

###############################################################################
# 2. PM2 服务状态
###############################################################################

echo -e "${YELLOW}[2] PM2 服务状态${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}✗ PM2 未安装${NC}"
    exit 1
fi

# 检查服务是否运行
api_status=$(pm2 jlist | jq -r '.[] | select(.name=="embedded-ai-api") | .pm2_env.status' 2>/dev/null || echo "not_found")
web_status=$(pm2 jlist | jq -r '.[] | select(.name=="embedded-ai-web") | .pm2_env.status' 2>/dev/null || echo "not_found")

if [ "$api_status" == "online" ]; then
    echo -e "${GREEN}✓ API服务: 运行中${NC}"
else
    echo -e "${RED}✗ API服务: $api_status${NC}"
fi

if [ "$web_status" == "online" ]; then
    echo -e "${GREEN}✓ Web服务: 运行中${NC}"
else
    echo -e "${RED}✗ Web服务: $web_status${NC}"
fi

# 显示详细状态
echo ""
pm2 list

echo ""

###############################################################################
# 3. 端口监听检查
###############################################################################

echo -e "${YELLOW}[3] 端口监听检查${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_port() {
    local port=$1
    local service=$2
    
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✓ $service (端口 $port): 监听中${NC}"
        return 0
    elif ss -tlnp 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✓ $service (端口 $port): 监听中${NC}"
        return 0
    else
        echo -e "${RED}✗ $service (端口 $port): 未监听${NC}"
        return 1
    fi
}

check_port $API_PORT "API服务"
check_port $WEB_PORT "Web服务"

echo ""

###############################################################################
# 4. HTTP 健康检查
###############################################################################

echo -e "${YELLOW}[4] HTTP 健康检查${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查 API Health Endpoint
api_health_url="http://localhost:$API_PORT/api/v1/health"
api_response=$(curl -s -o /dev/null -w "%{http_code}" "$api_health_url" 2>/dev/null)

if [ "$api_response" == "200" ]; then
    echo -e "${GREEN}✓ API健康检查: 正常 (HTTP 200)${NC}"
    curl -s "$api_health_url" | jq '.' 2>/dev/null || echo "  响应: OK"
else
    echo -e "${RED}✗ API健康检查: 失败 (HTTP $api_response)${NC}"
fi

# 检查 API Tools Endpoint
api_tools_url="http://localhost:$API_PORT/api/v1/tools"
tools_response=$(curl -s -o /dev/null -w "%{http_code}" "$api_tools_url" 2>/dev/null)

if [ "$tools_response" == "200" ]; then
    echo -e "${GREEN}✓ API工具检查: 正常 (HTTP 200)${NC}"
else
    echo -e "${RED}✗ API工具检查: 失败 (HTTP $tools_response)${NC}"
fi

# 检查 Web 服务
web_url="http://localhost:$WEB_PORT"
web_response=$(curl -s -o /dev/null -w "%{http_code}" "$web_url" 2>/dev/null)

if [[ "$web_response" =~ ^(200|301|302)$ ]]; then
    echo -e "${GREEN}✓ Web服务: 可访问 (HTTP $web_response)${NC}"
else
    echo -e "${RED}✗ Web服务: 无法访问 (HTTP $web_response)${NC}"
fi

echo ""

###############################################################################
# 5. 依赖检查
###############################################################################

echo -e "${YELLOW}[5] 系统依赖检查${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_command() {
    if command -v $1 &> /dev/null; then
        version=$($1 --version 2>&1 | head -1)
        echo -e "${GREEN}✓ $2: $version${NC}"
        return 0
    else
        echo -e "${RED}✗ $2: 未安装${NC}"
        return 1
    fi
}

check_command node "Node.js"
check_command npm "npm"
check_command pm2 "PM2"
check_command tesseract "Tesseract OCR"
check_command convert "ImageMagick"

echo ""

###############################################################################
# 6. 环境变量检查
###############################################################################

echo -e "${YELLOW}[6] 环境变量检查${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f .env ]; then
    echo -e "${GREEN}✓ .env 文件存在${NC}"
    
    # 检查关键环境变量
    if grep -q "QWEN_API_KEY=" .env && ! grep -q "QWEN_API_KEY=$" .env; then
        echo -e "${GREEN}✓ QWEN_API_KEY 已配置${NC}"
    else
        echo -e "${RED}✗ QWEN_API_KEY 未配置或为空${NC}"
    fi
    
    if grep -q "QWEN_API_BASE=" .env; then
        echo -e "${GREEN}✓ QWEN_API_BASE 已配置${NC}"
    else
        echo -e "${YELLOW}⚠ QWEN_API_BASE 未配置${NC}"
    fi
else
    echo -e "${RED}✗ .env 文件不存在${NC}"
fi

echo ""

###############################################################################
# 7. 目录和文件权限检查
###############################################################################

echo -e "${YELLOW}[7] 目录和文件检查${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_dir() {
    if [ -d "$1" ]; then
        size=$(du -sh "$1" 2>/dev/null | cut -f1)
        echo -e "${GREEN}✓ $1 (大小: $size)${NC}"
    else
        echo -e "${RED}✗ $1 不存在${NC}"
    fi
}

check_dir "temp"
check_dir "out"
check_dir "logs"
check_dir "node_modules"

# 检查日志文件大小
if [ -d "logs" ]; then
    log_size=$(du -sh logs 2>/dev/null | cut -f1)
    log_size_mb=$(du -sm logs 2>/dev/null | cut -f1)
    
    if [ "$log_size_mb" -gt 100 ]; then
        echo -e "${RED}⚠ 日志文件过大 ($log_size)，建议清理${NC}"
    fi
fi

echo ""

###############################################################################
# 8. 最近的错误日志
###############################################################################

echo -e "${YELLOW}[8] 最近的错误日志 (最后10行)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "logs/api-error.log" ]; then
    error_count=$(wc -l < logs/api-error.log)
    if [ "$error_count" -gt 0 ]; then
        echo -e "${RED}API错误日志 (共 $error_count 行):${NC}"
        tail -10 logs/api-error.log
    else
        echo -e "${GREEN}✓ 无API错误日志${NC}"
    fi
else
    echo "API错误日志文件不存在"
fi

echo ""

###############################################################################
# 9. 性能统计
###############################################################################

echo -e "${YELLOW}[9] 性能统计${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "out" ]; then
    total_files=$(find out -type f -name "*.c" 2>/dev/null | wc -l)
    echo "生成的C文件总数: $total_files"
fi

if [ -f "temp" ]; then
    temp_files=$(find temp -type f 2>/dev/null | wc -l)
    echo "临时文件数量: $temp_files"
fi

# PM2 进程信息
echo ""
echo "PM2 进程资源使用:"
pm2 jlist | jq -r '.[] | "\(.name): CPU \(.monit.cpu)% | 内存 \(.monit.memory / 1024 / 1024 | floor)MB | 重启 \(.pm2_env.restart_time)次"' 2>/dev/null

echo ""

###############################################################################
# 10. 综合评分
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    健康检查完成${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 计算健康分数
score=0
max_score=10

[ "$api_status" == "online" ] && ((score++))
[ "$web_status" == "online" ] && ((score++))
[ "$api_response" == "200" ] && ((score++))
[ "$tools_response" == "200" ] && ((score++))
[[ "$web_response" =~ ^(200|301|302)$ ]] && ((score++))
command -v node &> /dev/null && ((score++))
command -v tesseract &> /dev/null && ((score++))
command -v pm2 &> /dev/null && ((score++))
[ -f .env ] && ((score++))
[ -d "node_modules" ] && ((score++))

percentage=$((score * 100 / max_score))

if [ $percentage -ge 90 ]; then
    echo -e "${GREEN}✓ 系统健康状况: 优秀 ($percentage%)${NC}"
elif [ $percentage -ge 70 ]; then
    echo -e "${YELLOW}⚠ 系统健康状况: 良好 ($percentage%)${NC}"
else
    echo -e "${RED}✗ 系统健康状况: 需要关注 ($percentage%)${NC}"
fi

echo ""
echo "详细日志: pm2 logs"
echo "实时监控: pm2 monit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
