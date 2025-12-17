# Docker构建与发布指南

本文档详细说明如何将环境变量管理系统构建为Docker镜像并发布到公共仓库（如Docker Hub）。

## 1. 准备工作

### 1.1 确保Docker已安装并运行
```bash
docker --version
docker-compose --version
```

### 1.2 注册Docker Hub账号
如果您还没有Docker Hub账号，请访问 [Docker Hub](https://hub.docker.com/) 注册一个。

## 2. 构建和发布步骤

### 2.1 登录Docker Hub
```bash
docker login
```
按照提示输入您的Docker Hub用户名和密码。

### 2.2 构建Docker镜像
在项目根目录执行：
```bash
docker build -t [your-dockerhub-username]/env-manager:latest .
```
- `[your-dockerhub-username]` 替换为您的Docker Hub用户名
- `env-manager` 是镜像名称，您可以自定义
- `latest` 是标签，您可以使用版本号如 `v1.0.0`

### 2.3 查看构建的镜像
```bash
docker images
```
您应该能看到刚刚构建的镜像。

### 2.4 测试镜像（可选）
```bash
docker run -d -p 35643:35643 [your-dockerhub-username]/env-manager:latest
```
访问 http://localhost:35643/login 确认服务正常运行。

### 2.5 推送镜像到Docker Hub
```bash
docker push [your-dockerhub-username]/env-manager:latest
```

### 2.6 验证发布结果
访问您的Docker Hub页面 `https://hub.docker.com/repository/docker/[your-dockerhub-username]/env-manager`，您应该能看到刚刚推送的镜像。

## 3. 使用docker-compose.yml简化构建和运行

### 3.1 修改docker-compose.yml
```yaml
version: '3.8'

services:
  env-manager:
    build: .
    image: [your-dockerhub-username]/env-manager:latest  # 添加镜像名称
    container_name: env-manager
    restart: unless-stopped
    ports:
      - "35643:35643"
    volumes:
      - ./env_vars.db:/app/env_vars.db
    environment:
      - NODE_ENV=production
    networks:
      - env-manager-network

networks:
  env-manager-network:
    driver: bridge
```

### 3.2 使用docker-compose构建和推送
```bash
# 构建镜像
docker-compose build

# 推送镜像
docker-compose push
```

## 4. 公共访问设置

- 确保您的Docker Hub仓库设置为 **公开**（默认）
- 如果需要私有仓库，在Docker Hub页面修改仓库设置

## 5. 从公共仓库拉取镜像

其他用户可以通过以下命令拉取和运行您的镜像：

### 5.1 使用docker命令
```bash
docker run -d -p 35643:35643 [your-dockerhub-username]/env-manager:latest
```

### 5.2 使用docker-compose
创建 `docker-compose.yml` 文件：
```yaml
version: '3.8'

services:
  env-manager:
    image: [your-dockerhub-username]/env-manager:latest
    container_name: env-manager
    restart: unless-stopped
    ports:
      - "35643:35643"
    volumes:
      - ./env_vars.db:/app/env_vars.db
    environment:
      - NODE_ENV=production
```

然后执行：
```bash
docker-compose up -d
```

## 6. 访问服务

无论使用哪种方式，服务启动后，您可以通过以下地址访问：
- 登录页面：`http://localhost:35643/login`
- 主页面：`http://localhost:35643`
- API文档：`http://localhost:35643/api-docs`

## 7. 常用Docker命令

### 7.1 查看运行中的容器
```bash
docker ps
```

### 7.2 查看容器日志
```bash
docker logs env-manager
# 或实时查看
# docker logs -f env-manager
```

### 7.3 停止容器
```bash
docker stop env-manager
```

### 7.4 启动容器
```bash
docker start env-manager
```

### 7.5 删除容器
```bash
docker rm env-manager
```

### 7.6 删除镜像
```bash
docker rmi [your-dockerhub-username]/env-manager:latest
```

## 8. 使用docker-compose常用命令

### 8.1 启动服务
```bash
docker-compose up -d
```

### 8.2 停止服务
```bash
docker-compose down
```

### 8.3 查看服务状态
```bash
docker-compose ps
```

### 8.4 查看服务日志
```bash
docker-compose logs
# 或实时查看
# docker-compose logs -f
```

## 9. 注意事项

1. **数据持久化**：使用卷挂载 `./env_vars.db:/app/env_vars.db` 确保数据库数据不会丢失
2. **端口映射**：确保宿主机端口35643未被占用
3. **环境变量**：可以通过修改 `docker-compose.yml` 中的 `environment` 部分自定义环境变量
4. **镜像标签**：建议使用语义化版本号作为标签，如 `v1.0.0`，而不仅仅是 `latest`
5. **安全考虑**：在生产环境中，建议使用更安全的登录方式，如Docker Hub Access Token

## 10. Docker Hub Access Token使用（推荐）

为了安全起见，建议使用Docker Hub Access Token而非密码登录：

1. 登录Docker Hub
2. 进入 Account Settings > Security
3. 生成新的Access Token
4. 使用Access Token代替密码登录：
   ```bash
   docker login -u [your-dockerhub-username] -p [your-access-token]
   ```

通过以上步骤，您可以成功构建并发布Docker镜像到公共仓库，方便在任何支持Docker的环境中快速部署和使用环境变量管理系统。