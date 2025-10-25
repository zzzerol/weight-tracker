# 快速部署指南

## 一分钟部署

```bash
# 下载项目（如果使用Git）
git clone <项目地址>
cd weight-tracker-app

# 或者直接下载压缩包并解压
# unzip weight-tracker-app.zip
# cd weight-tracker-app

# 启动应用
chmod +x start.sh
./start.sh
```

## 访问应用

部署完成后：
- Web界面：http://你的服务器IP:3000
- 默认端口：3000（可在docker-compose.yml中修改）

## 常用命令

```bash
# 启动应用
./start.sh

# 停止应用
./stop.sh

# 查看日志
docker-compose logs -f

# 创建备份
./backup.sh

# 恢复备份
./restore.sh ./backups/备份文件名.tar.gz

# 更新应用
git pull
docker-compose down
docker-compose up -d --build
```

## 配置修改

### 修改端口
编辑 `docker-compose.yml` 文件：
```yaml
ports:
  - "8080:3000"  # 将8080改为你想要的端口
```

### 修改数据存储位置
编辑 `docker-compose.yml` 文件：
```yaml
volumes:
  - /path/to/your/data:/app/data  # 使用绝对路径
```

## 数据管理

### 数据存储位置
- Docker卷：`weight-tracker-app_weight-tracker-data`
- 实际路径：可通过 `docker volume inspect` 查看

### 备份策略
- 手动备份：运行 `./backup.sh`
- 自动备份：可添加到crontab
```bash
# 每天凌晨2点自动备份
0 2 * * * /path/to/weight-tracker-app/backup.sh
```

## 故障排除

### 端口冲突
```bash
# 检查端口占用
netstat -tlnp | grep 3000

# 修改端口
nano docker-compose.yml
```

### 权限问题
```bash
# 检查数据目录权限
ls -la ./data

# 修改权限
sudo chown -R 1001:1001 ./data
```

### 应用无法启动
```bash
# 查看详细日志
docker-compose logs

# 检查镜像状态
docker images
docker ps -a
```

## 卸载应用

```bash
# 停止并删除容器
docker-compose down

# 删除数据卷（谨慎操作，会删除所有数据）
docker volume rm weight-tracker-app_weight-tracker-data

# 删除镜像
docker rmi weight-tracker-app_weight-tracker
```

## 注意事项

1. **数据安全**：定期备份重要数据
2. **访问控制**：建议在生产环境中添加HTTPS和访问控制
3. **性能监控**：可使用Prometheus + Grafana监控应用性能
4. **更新维护**：定期更新Docker镜像和依赖包