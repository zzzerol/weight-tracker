#!/bin/bash

echo "=== 减肥记录追踪应用停止脚本 ==="

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose未安装。"
    exit 1
fi

echo "正在停止应用..."

# 停止容器
docker-compose down

echo "应用已停止"

# 显示数据卷信息
echo "数据卷信息:"
docker volume inspect weight-tracker-app_weight-tracker-data 2>/dev/null || echo "数据卷不存在"

echo "=== 停止脚本完成 ==="