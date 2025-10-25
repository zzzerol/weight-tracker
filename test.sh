#!/bin/bash

echo "=== 减肥记录追踪应用测试脚本 ==="

# 检查应用是否运行
echo "检查应用状态..."
if ! docker-compose ps | grep -q "Up"; then
    echo "应用未运行，正在启动..."
    docker-compose up -d
    sleep 15
fi

# 健康检查
echo "进行健康检查..."
HEALTH_URL="http://localhost:3000/api/health"
RESPONSE=$(curl -s -w "%{http_code}" $HEALTH_URL)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "健康检查通过"
    echo "应用状态: $(echo $BODY | jq -r '.status')"
    echo "应用版本: $(echo $BODY | jq -r '.version')"
    echo "运行时间: $(echo $BODY | jq -r '.uptime') 秒"
else
    echo "健康检查失败，HTTP状态码: $HTTP_CODE"
    echo "响应内容: $BODY"
    exit 1
fi

# 检查Web界面
echo "检查Web界面..."
WEB_URL="http://localhost:3000"
WEB_RESPONSE=$(curl -s -w "%{http_code}" $WEB_URL)
WEB_HTTP_CODE=$(echo "$WEB_RESPONSE" | tail -n1)

if [ "$WEB_HTTP_CODE" -eq 200 ]; then
    echo "Web界面访问正常"
else
    echo "Web界面访问失败，HTTP状态码: $WEB_HTTP_CODE"
    exit 1
fi

# 检查数据库
echo "检查数据库状态..."
DB_STATUS=$(docker-compose exec -T weight-tracker-app sh -c "ls -la /app/data/weight_tracker.db 2>/dev/null || echo 'not found'")

if echo "$DB_STATUS" | grep -q "weight_tracker.db"; then
    echo "数据库文件存在: $DB_STATUS"
else
    echo "数据库文件不存在，可能需要初始化"
fi

echo "=== 测试脚本完成 ==="
echo "应用运行正常，可以开始使用了！"
echo "访问地址: http://localhost:3000"