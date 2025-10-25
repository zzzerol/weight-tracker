#!/bin/bash

echo "=== 减肥记录追踪应用启动脚本 ==="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装。请先安装Docker。"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose未安装。请先安装Docker Compose。"
    exit 1
fi

# 检查是否以root用户运行
if [ "$(id -u)" -ne 0 ]; then
    echo "警告: 建议以root用户运行，以避免权限问题"
    sleep 3
fi

# 创建数据目录（如果不存在）
mkdir -p ./data

echo "正在启动应用..."

# 启动容器
docker-compose up -d

# 等待应用启动
echo "等待应用启动..."
sleep 10

# 检查应用状态
if docker-compose ps | grep -q "Up"; then
    echo "应用启动成功！"
    echo "访问地址: http://localhost:3000"
    echo "API地址: http://localhost:3000/api"
    echo "健康检查: http://localhost:3000/api/health"
else
    echo "应用启动失败，请检查日志:"
    docker-compose logs
fi

echo "=== 启动脚本完成 ==="