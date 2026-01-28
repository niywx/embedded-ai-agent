#!/bin/bash

###############################################################################
# 嵌入式AI代码生成系统 - 备份脚本
# 用途: 备份重要数据、配置文件、生成的代码
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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置
BACKUP_DIR="$HOME/embedded-ai-backups"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="embedded-ai-backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    嵌入式AI代码生成系统 - 数据备份${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

###############################################################################
# 1. 创建备份目录
###############################################################################

log_info "创建备份目录: $BACKUP_PATH"
mkdir -p "$BACKUP_PATH"

###############################################################################
# 2. 备份配置文件
###############################################################################

log_info "备份配置文件..."

# .env 文件
if [ -f "$PROJECT_DIR/.env" ]; then
    cp "$PROJECT_DIR/.env" "$BACKUP_PATH/.env"
    log_info "✓ 备份 .env"
fi

# PM2 配置
if [ -f "$PROJECT_DIR/ecosystem.config.js" ]; then
    cp "$PROJECT_DIR/ecosystem.config.js" "$BACKUP_PATH/ecosystem.config.js"
    log_info "✓ 备份 ecosystem.config.js"
fi

# package.json
if [ -f "$PROJECT_DIR/package.json" ]; then
    cp "$PROJECT_DIR/package.json" "$BACKUP_PATH/package.json"
    log_info "✓ 备份 package.json"
fi

###############################################################################
# 3. 备份生成的代码
###############################################################################

log_info "备份生成的代码..."

if [ -d "$PROJECT_DIR/out" ]; then
    out_size=$(du -sh "$PROJECT_DIR/out" | cut -f1)
    out_count=$(find "$PROJECT_DIR/out" -type f | wc -l)
    
    log_info "生成代码目录: $out_size ($out_count 个文件)"
    
    cp -r "$PROJECT_DIR/out" "$BACKUP_PATH/out"
    log_info "✓ 备份 out/ 目录"
else
    log_info "out/ 目录不存在，跳过"
fi

###############################################################################
# 4. 备份日志文件
###############################################################################

log_info "备份日志文件..."

if [ -d "$PROJECT_DIR/logs" ]; then
    log_size=$(du -sh "$PROJECT_DIR/logs" | cut -f1)
    
    log_info "日志目录大小: $log_size"
    
    # 只备份最近7天的日志
    mkdir -p "$BACKUP_PATH/logs"
    find "$PROJECT_DIR/logs" -type f -mtime -7 -exec cp {} "$BACKUP_PATH/logs/" \;
    
    log_info "✓ 备份 logs/ (最近7天)"
else
    log_info "logs/ 目录不存在，跳过"
fi

###############################################################################
# 5. 备份上传的文件 (可选)
###############################################################################

read -p "是否备份 temp/ 目录中的上传文件? (可能很大) (y/N): " backup_temp

if [[ "$backup_temp" =~ ^[Yy]$ ]]; then
    log_info "备份临时文件..."
    
    if [ -d "$PROJECT_DIR/temp" ]; then
        temp_size=$(du -sh "$PROJECT_DIR/temp" | cut -f1)
        log_info "临时文件大小: $temp_size"
        
        # 只备份最近3天的文件
        mkdir -p "$BACKUP_PATH/temp"
        find "$PROJECT_DIR/temp" -type f -mtime -3 -exec cp {} "$BACKUP_PATH/temp/" \;
        
        log_info "✓ 备份 temp/ (最近3天)"
    fi
fi

###############################################################################
# 6. 压缩备份
###############################################################################

log_info "压缩备份文件..."

cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"

if [ $? -eq 0 ]; then
    # 删除未压缩的备份
    rm -rf "$BACKUP_NAME"
    
    backup_file_size=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
    log_info "✓ 备份已压缩: ${BACKUP_NAME}.tar.gz ($backup_file_size)"
else
    log_error "压缩失败"
    exit 1
fi

###############################################################################
# 7. 清理旧备份 (保留最近5个)
###############################################################################

log_info "清理旧备份..."

cd "$BACKUP_DIR"
backup_count=$(ls -1 embedded-ai-backup_*.tar.gz 2>/dev/null | wc -l)

if [ "$backup_count" -gt 5 ]; then
    log_info "发现 $backup_count 个备份，保留最新5个"
    
    # 删除旧备份
    ls -t embedded-ai-backup_*.tar.gz | tail -n +6 | xargs rm -f
    
    log_info "✓ 已清理旧备份"
fi

###############################################################################
# 8. 备份完成
###############################################################################

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}    备份完成!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "备份信息:"
echo "  文件: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo "  大小: $backup_file_size"
echo "  时间: $TIMESTAMP"
echo ""
echo "恢复备份:"
echo "  cd $PROJECT_DIR"
echo "  tar -xzf ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo ""
echo "查看所有备份:"
echo "  ls -lh $BACKUP_DIR"
echo ""

###############################################################################
# 9. 可选: 远程备份
###############################################################################

read -p "是否将备份上传到远程服务器? (y/N): " upload_backup

if [[ "$upload_backup" =~ ^[Yy]$ ]]; then
    read -p "请输入远程服务器地址 (例: user@remote-host:/backup/path): " remote_path
    
    log_info "上传备份到远程服务器..."
    scp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" "$remote_path"
    
    if [ $? -eq 0 ]; then
        log_info "✓ 备份已上传到远程服务器"
    else
        log_error "上传失败，请检查网络连接和权限"
    fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
