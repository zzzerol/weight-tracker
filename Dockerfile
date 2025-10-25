# 多阶段构建
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 生产阶段
FROM node:18-alpine

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 复制node_modules
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# 复制应用代码
COPY --chown=nodejs:nodejs . .

# 创建数据目录
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# 启动命令
CMD ["node", "server.js"]