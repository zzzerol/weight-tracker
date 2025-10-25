#!/bin/bash

echo "=== 减肥记录追踪应用恢复脚本 ==="

# 检查参数
if [ $# -ne 1 ]; then
    echo "用法: $0 <备份文件路径>"
    echo "示例: $0 ./backups/weight-tracker-backup-20250101-120000.tar.gz"
    exit 1
fi

BACKUP_FILE=$1

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "错误: 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装。"
    exit 1
fi

echo "警告: 此操作将覆盖现有数据！"
echo "请确认是否继续？(y/n)"
read -p "" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "恢复操作已取消"
    exit 0
fi

echo "正在停止应用..."
docker-compose down

echo "正在恢复数据..."

# 恢复数据卷
docker run --rm \
    -v weight-tracker-app_weight-tracker-data:/data \
    -v $(dirname $BACKUP_FILE):/backup \
    alpine:latest \
    sh -c "rm -rf /data/* && tar xzf /backup/$(basename $BACKUP_FILE) -C /data"

if [ $? -eq 0 ]; then
    echo "数据恢复成功"
    
    echo "正在启动应用..."
    docker-compose up -d
    
    echo "恢复脚本完成"
else
    echo "数据恢复失败"
    exit 1
fi