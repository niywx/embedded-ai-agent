#!/bin/bash

###############################################################################
# 嵌入式AI代码生成系统 - 恢复脚本
# 用途: 从备份文件恢复数据和配置
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 配置
BACKUP_DIR="$HOME/embedded-ai-backups"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    嵌入式AI代码生成系统 - 数据恢复${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

###############################################################################
# 1. 检查备份目录
###############################################################################

if [ ! -d "$BACKUP_DIR" ]; then
    log_error "备份目录不存在: $BACKUP_DIR"
    exit 1
fi

# 列出所有可用备份
log_info "可用的备份文件:"
ls -lht "$BACKUP_DIR"/embedded-ai-backup_*.tar.gz 2>/dev/null | nl

backup_files=($(ls -t "$BACKUP_DIR"/embedded-ai-backup_*.tar.gz 2>/dev/null))

if [ ${#backup_files[@]} -eq 0 ]; then
    log_error "未找到备份文件"
    exit 1
fi

###############################################################################
# 2. 选择备份文件
###############################################################################

echo ""
read -p "请选择要恢复的备份 (输入序号, 默认1-最新): " backup_choice
backup_choice=${backup_choice:-1}

if [ "$backup_choice" -lt 1 ] || [ "$backup_choice" -gt ${#backup_files[@]} ]; then
    log_error "无效的选择"
    exit 1
fi

selected_backup="${backup_files[$((backup_choice-1))]}"
log_info "选择的备份: $(basename $selected_backup)"

###############################################################################
# 3. 确认操作
###############################################################################

log_warn "警告: 恢复操作将覆盖以下内容:"
echo "  - .env 文件"
echo "  - ecosystem.config.js"
echo "  - out/ 目录 (生成的代码)"
echo "  - logs/ 目录"
echo ""

read -p "是否继续? (yes/no): " confirm
if [[ ! "$confirm" == "yes" ]]; then
    log_info "已取消恢复操作"
    exit 0
fi

###############################################################################
# 4. 停止服务
###############################################################################

log_info "停止PM2服务..."
if command -v pm2 &> /dev/null; then
    pm2 stop all || true
    log_info "✓ 服务已停止"
fi

###############################################################################
# 5. 备份当前数据 (以防万一)
###############################################################################

log_info "备份当前数据到 .restore_backup..."
RESTORE_BACKUP_DIR="$PROJECT_DIR/.restore_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESTORE_BACKUP_DIR"

[ -f "$PROJECT_DIR/.env" ] && cp "$PROJECT_DIR/.env" "$RESTORE_BACKUP_DIR/"
[ -d "$PROJECT_DIR/out" ] && cp -r "$PROJECT_DIR/out" "$RESTORE_BACKUP_DIR/"
[ -d "$PROJECT_DIR/logs" ] && cp -r "$PROJECT_DIR/logs" "$RESTORE_BACKUP_DIR/"

log_info "✓ 当前数据已备份到: $RESTORE_BACKUP_DIR"

###############################################################################
# 6. 解压备份
###############################################################################

log_info "解压备份文件..."
cd "$BACKUP_DIR"

# 解压到临时目录
TEMP_RESTORE_DIR="/tmp/restore_temp_$$"
mkdir -p "$TEMP_RESTORE_DIR"
tar -xzf "$selected_backup" -C "$TEMP_RESTORE_DIR"

# 找到解压后的目录
EXTRACTED_DIR=$(find "$TEMP_RESTORE_DIR" -maxdepth 1 -type d -name "embedded-ai-backup_*")

if [ -z "$EXTRACTED_DIR" ]; then
    log_error "解压失败或找不到备份内容"
    rm -rf "$TEMP_RESTORE_DIR"
    exit 1
fi

log_info "✓ 备份已解压"

###############################################################################
# 7. 恢复文件
###############################################################################

log_info "恢复文件..."

# 恢复 .env
if [ -f "$EXTRACTED_DIR/.env" ]; then
    cp "$EXTRACTED_DIR/.env" "$PROJECT_DIR/.env"
    chmod 600 "$PROJECT_DIR/.env"
    log_info "✓ 恢复 .env"
fi

# 恢复 ecosystem.config.js
if [ -f "$EXTRACTED_DIR/ecosystem.config.js" ]; then
    cp "$EXTRACTED_DIR/ecosystem.config.js" "$PROJECT_DIR/ecosystem.config.js"
    log_info "✓ 恢复 ecosystem.config.js"
fi

# 恢复生成的代码
if [ -d "$EXTRACTED_DIR/out" ]; then
    rm -rf "$PROJECT_DIR/out"
    cp -r "$EXTRACTED_DIR/out" "$PROJECT_DIR/out"
    out_count=$(find "$PROJECT_DIR/out" -type f | wc -l)
    log_info "✓ 恢复 out/ ($out_count 个文件)"
fi

# 恢复日志
if [ -d "$EXTRACTED_DIR/logs" ]; then
    rm -rf "$PROJECT_DIR/logs"
    cp -r "$EXTRACTED_DIR/logs" "$PROJECT_DIR/logs"
    log_info "✓ 恢复 logs/"
fi

# 清理临时目录
rm -rf "$TEMP_RESTORE_DIR"

###############################################################################
# 8. 重启服务
###############################################################################

log_info "重启PM2服务..."
cd "$PROJECT_DIR"

if command -v pm2 &> /dev/null; then
    pm2 restart all || pm2 start ecosystem.config.js
    sleep 3
    pm2 list
    log_info "✓ 服务已重启"
fi

###############################################################################
# 9. 验证恢复
###############################################################################

log_info "验证恢复结果..."

errors=0

# 检查关键文件
[ ! -f "$PROJECT_DIR/.env" ] && log_error "✗ .env 文件缺失" && ((errors++))
[ ! -d "$PROJECT_DIR/out" ] && log_error "✗ out/ 目录缺失" && ((errors++))

if [ $errors -eq 0 ]; then
    log_info "✓ 验证通过"
else
    log_warn "发现 $errors 个问题，请检查"
fi

###############################################################################
# 10. 完成
###############################################################################

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}    恢复完成!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "恢复信息:"
echo "  备份文件: $(basename $selected_backup)"
echo "  项目目录: $PROJECT_DIR"
echo "  临时备份: $RESTORE_BACKUP_DIR (可删除)"
echo ""
echo "检查服务状态:"
echo "  pm2 list"
echo "  ./health_check.sh"
echo ""
echo "如果恢复有问题，可以从临时备份恢复:"
echo "  cp -r $RESTORE_BACKUP_DIR/* $PROJECT_DIR/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
