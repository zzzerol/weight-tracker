# 减肥记录追踪应用 - 云端同步版

一个功能完整的减肥记录追踪应用，支持多设备同步，容器化部署。

## 功能特点

### 📊 核心功能
- **智能体重记录**：每日体重输入，精确到0.1斤
- **自动计算功能**：已减重量、还需减重、BMI自动计算
- **数据可视化**：体重趋势图、每周减重统计图表
- **多维度统计**：连续记录天数、最佳单周减重等

### 🔄 云端同步
- **用户认证**：支持多用户注册登录
- **数据同步**：PC和手机端数据实时同步
- **云端备份**：自动数据备份和恢复

### 🐳 容器化部署
- **Docker容器**：一键部署，环境隔离
- **数据持久化**：SQLite文件数据库
- **NAS友好**：支持离线部署在NAS设备

### 🎨 用户体验
- **响应式设计**：完美适配桌面和移动设备
- **现代化UI**：大厂级别的界面设计
- **流畅动画**：丰富的交互动画效果

## 技术栈

- **前端**：HTML5 + Tailwind CSS + JavaScript + Chart.js
- **后端**：Node.js + Express
- **数据库**：SQLite（文件型数据库）
- **容器化**：Docker + Docker Compose

## 部署指南

### 方法一：Docker Compose（推荐）

```bash
# 克隆项目
git clone <项目地址>
cd weight-tracker-app

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 方法二：Docker Run

```bash
# 构建镜像
docker build -t weight-tracker-app .

# 运行容器
docker run -d \
  --name weight-tracker-app \
  -p 3135:3000 \
  -v weight-tracker-data:/app/data \
  --restart unless-stopped \
  weight-tracker-app
```

### 方法三：Node.js 直接运行

```bash
# 安装依赖
npm install --production

# 启动应用
npm start
```

## 访问应用

部署完成后，通过以下地址访问：
- Web界面：http://localhost:3135
- API接口：http://localhost:3135/api

## 数据管理

### 数据存储位置
- **Docker部署**：数据存储在Docker卷中
- **直接运行**：数据存储在 `./data/weight_tracker.db`

### 数据备份恢复
- **导出数据**：通过应用内的"数据管理"功能
- **导入数据**：支持JSON格式的备份文件
- **云端备份**：自动云端备份功能

## 环境变量配置

创建 `.env` 文件可以自定义配置：

```env
# 应用端口
PORT=3135

# 环境模式
NODE_ENV=production
```

## 使用说明

### 1. 首次使用
- 访问应用后注册账号
- 完善个人信息和减肥目标
- 开始记录每日体重

### 2. 多设备同步
- 在不同设备上使用相同账号登录
- 数据会自动同步到所有设备
- 支持离线记录，联网后自动同步

### 3. 数据安全
- 定期导出数据备份
- 重要节点创建云端备份
- 注意保护用户密码

## 安全考虑

- **密码加密**：用户密码使用bcrypt加密存储
- **数据隔离**：每个用户的数据完全隔离
- **权限控制**：完善的用户认证和授权机制

## 更新日志

### v1.0.0
- 初始版本发布
- 完整的体重记录功能
- 云端同步和数据备份
- 容器化部署支持

## 问题反馈

如遇到问题，请：
1. 查看容器日志：`docker-compose logs -f`
2. 检查端口占用：`netstat -tlnp | grep 3135`
3. 确认数据卷挂载：`docker volume inspect weight-tracker-data`

## 许可证

MIT License

## 免责声明

本应用仅供减肥记录参考，具体减肥计划请咨询专业医生或营养师。使用本应用产生的任何健康问题，开发者不承担责任。

# Weight Tracker App - Cloud Sync Version

A fully-featured weight tracker app that supports multi-device synchronization and containerized deployment.

## Features

### 📊 Core Features
- **Smart Weight Recording**: Daily weight input, accurate to 0.1 jin
- **Automatic Calculation Features**: Weight lost, weight still needed, BMI automatic calculation
- **Data Visualization**: Weight trend chart, weekly weight loss statistics chart
- **Multi-dimensional Statistics**: Days of continuous recording, best weekly weight loss, etc.

### 🔄 Cloud Sync
- **User Authentication**: Supports multi-user registration and login
- **Data Sync**: Real-time data synchronization between PC and mobile devices
- **Cloud Backup**: Automatic data backup and restore

### 🐳 Containerized Deployment
- **Docker Containers**: One-click deployment, environment isolation
- **Data Persistence**: SQLite file database
- **NAS Friendly**: Supports offline deployment on NAS devices

### User Experience
- **Responsive Design**: Perfectly adapts to desktop and mobile devices
- **Modern UI**: Interface design on par with major companies
- **Smooth Animations**: Rich interactive animation effects

## Tech Stack

- **Frontend**: HTML5 + Tailwind CSS + JavaScript + Chart.js
- **Backend**: Node.js + Express
- **Database**: SQLite (file-based database)
- **Containerization**: Docker + Docker Compose

## Deployment Guide

### Method 1: Docker Compose (Recommended)

```bash
# Clone the project
git clone <project address>
cd weight-tracker-app

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f
```

### Method 2: Docker Run

```bash
# Build the image
docker build -t weight-tracker-app .
```

# Running the container
docker run -d \
  --name weight-tracker-app \
  -p 3135:3000 \
-v weight-tracker-data:/app/data \
  --restart unless-stopped \
  weight-tracker-app
```

This app is for reference only in weight loss tracking. For specific weight loss plans, please consult a professional doctor or nutritionist. The developer is not responsible for any health issues that may arise from using this app.
