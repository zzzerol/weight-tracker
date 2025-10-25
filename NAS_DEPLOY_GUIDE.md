# NAS部署减肥记录追踪应用指南 - 端口3135版

##  部署前准备

**1. 确保NAS支持Docker**
- 大多数现代NAS（如Synology、QNAP、群晖等）都支持Docker
- 在NAS的应用商店中搜索并安装Docker套件
- 启动Docker服务

**2. 下载项目文件**
- 将 `weight-tracker-app.zip` 文件下载到NAS上
- 在NAS上创建一个专用目录，例如：`/volume1/docker/weight-tracker`
- 将ZIP文件解压到该目录

##  端口配置（已更新）

**当前端口**：3135

**配置详情**：
```yaml
ports:
  - "3135:3000"  # 宿主机端口:容器端口
```

##  数据持久化

**数据存储路径**：
- **容器内路径**：`/app/data`
- **宿主机路径**：Docker卷 `weight-tracker-data`

**查看实际存储位置**：
在NAS的Docker界面中可以查看卷的实际路径，通常类似：
- Synology: `/volume1/@docker/volumes/weight-tracker-app_weight-tracker-data/_data`
- QNAP: `/share/CACHEDEV1_DATA/.qpkg/container-station-data/lib/docker/volumes/...`

##  Docker Compose部署命令

**1. 进入项目目录**
```bash
# SSH登录NAS
ssh admin@你的NASIP

# 进入项目目录
cd /volume1/docker/weight-tracker
```

**2. 启动部署**
```bash
# 使用Docker Compose启动应用
docker-compose up -d
```

**3. 验证部署**
```bash
# 查看容器状态
docker-compose ps

# 查看应用日志
docker-compose logs -f
```

##  访问应用

**Web界面访问**：
- 地址：`http://你的NASIP:3135`
- 例如：`http://192.168.1.100:3135`

##  常用Docker Compose命令

**停止应用**：
```bash
docker-compose down
```

**重启应用**：
```bash
docker-compose restart
```

**查看详细信息**：
```bash
docker-compose config  # 查看配置
docker-compose images  # 查看镜像
docker-compose top     # 查看进程
```

**更新应用**：
```bash
# 拉取最新代码（如果使用Git）
git pull

# 重新构建并启动
docker-compose up -d --build
```

##  数据管理命令

**创建备份**：
```bash
# 运行备份脚本
./backup.sh

# 或手动备份数据卷
docker run --rm \
  -v weight-tracker-app_weight-tracker-data:/data \
  -v $(pwd)/backups:/backup \
  alpine:latest \
  tar czf /backup/weight-tracker-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

**恢复备份**：
```bash
# 运行恢复脚本
./restore.sh ./backups/备份文件名.tar.gz

# 或手动恢复
docker run --rm \
  -v weight-tracker-app_weight-tracker-data:/data \
  -v $(pwd)/backups:/backup \
  alpine:latest \
  sh -c "rm -rf /data/* && tar xzf /backup/备份文件名.tar.gz -C /data"
```

##  健康检查

**应用健康状态**：
```bash
# 访问健康检查接口
curl http://localhost:3135/api/health

# 或使用wget
wget -qO- http://localhost:3135/api/health
```

##  故障排除

**端口冲突检查**：
```bash
# 检查端口3135是否被占用
netstat -tlnp | grep 3135

# 或使用ss命令
ss -tlnp | grep 3135
```

**权限问题解决**：
```bash
# 设置数据目录权限
sudo chown -R 1001:1001 /path/to/your/data

# 或修改目录权限
sudo chmod -R 755 /path/to/your/data
```

**容器启动失败**：
```bash
# 查看详细错误信息
docker-compose logs --tail=100

# 检查Docker服务状态
systemctl status docker

# 重启Docker服务
sudo systemctl restart docker
```

##  卸载应用

```bash
# 停止并删除容器
docker-compose down

# 删除数据卷（谨慎操作，会删除所有数据）
docker volume rm weight-tracker-app_weight-tracker-data

# 删除镜像
docker rmi weight-tracker-app_weight-tracker
```

##  自动化部署（可选）

**创建启动脚本**：
```bash
#!/bin/bash
cd /volume1/docker/weight-tracker
docker-compose up -d
```

**设置开机自启**：
- 在NAS的任务计划中添加启动脚本
- 设置为开机时执行

这样就完成了使用Docker Compose部署减肥记录追踪应用的全部过程，端口已设置为3135，支持完整的数据管理和故障排除功能。