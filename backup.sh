#!/bin/bash

echo "=== 减肥记录追踪应用备份脚本 ==="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装。"
    exit 1
fi

# 备份目录
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# 备份文件名
BACKUP_FILE="$BACKUP_DIR/weight-tracker-backup-$(date +%Y%m%d-%H%M%S).tar.gz"

echo "正在创建备份..."

# 备份数据卷
docker run --rm \
    -v weight-tracker-app_weight-tracker-data:/data \
    -v $(pwd)/$BACKUP_DIR:/backup \
    alpine:latest \
    tar czf /backup/$(basename $BACKUP_FILE) -C /data .

if [ $? -eq 0 ]; then
    echo "备份成功: $BACKUP_FILE"
    
    # 清理旧备份（保留最近10个）
    echo "正在清理旧备份..."
    ls -tp $BACKUP_DIR/*.tar.gz | grep -v '/$' | tail -n +11 | xargs -I {} rm -- {}
    
    echo "备份脚本完成"
else
    echo "备份失败"
    exit 1
fi