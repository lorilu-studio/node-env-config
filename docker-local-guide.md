# Docker本地制作镜像指南

本文档详细说明如何在本地环境中制作和使用Docker镜像，适合Docker初学者学习和实践。

## 1. 什么是Docker镜像？

Docker镜像是一个只读的模板，包含了运行应用程序所需的所有内容：代码、运行时环境、库、环境变量和配置文件。

## 2. 本地制作Docker镜像的好处

- **隔离性**：每个应用程序运行在独立的容器中，不会相互影响
- **一致性**：在不同环境中运行相同的镜像，保证行为一致
- **可移植性**：可以在任何支持Docker的机器上运行
- **轻量化**：与虚拟机相比，Docker容器更轻量，启动更快
- **易于管理**：可以快速创建、启动、停止和删除容器

## 3. 环境准备

### 3.1 安装Docker

根据您的操作系统，按照官方指南安装Docker：
- **Windows**：https://docs.docker.com/desktop/install/windows-install/
- **Mac**：https://docs.docker.com/desktop/install/mac-install/
- **Linux**：https://docs.docker.com/desktop/install/linux-install/

### 3.2 验证Docker安装

安装完成后，打开终端或命令提示符，运行以下命令验证安装成功：

```bash
docker --version
# 输出示例：Docker version 24.0.6, build ed223bc

docker-compose --version
# 输出示例：Docker Compose version v2.21.0

docker info
# 输出Docker系统信息
```

## 4. 本地制作Docker镜像步骤

### 4.1 了解项目结构

在开始之前，先了解一下我们的项目结构：

```
node-env-config/
├── views/                 # 视图目录
│   ├── index.html         # HTML主页面
│   └── login.html         # 登录页面
├── server.js              # 主服务器文件
├── package.json           # 项目配置文件
├── Dockerfile             # Docker镜像构建文件
└── docker-compose.yml     # Docker Compose配置文件
```

### 4.2 理解Dockerfile

`Dockerfile` 是制作Docker镜像的蓝图，包含了构建镜像的所有指令。让我们来看看我们项目中的Dockerfile：

```dockerfile
# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json到工作目录
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有源代码到工作目录
COPY . .

# 暴露端口
EXPOSE 35643

# 启动应用
CMD ["npm", "start"]
```

**Dockerfile关键字解释：**
- `FROM`：指定基础镜像
- `WORKDIR`：设置工作目录
- `COPY`：复制文件到镜像中
- `RUN`：在镜像中执行命令
- `EXPOSE`：暴露容器端口
- `CMD`：设置容器启动时执行的命令

### 4.3 使用docker build命令构建镜像

在项目根目录执行以下命令构建镜像：

```bash
docker build -t env-manager:latest .
```

**命令解释：**
- `docker build`：构建Docker镜像的命令
- `-t env-manager:latest`：为镜像添加标签，`env-manager`是镜像名称，`latest`是标签
- `.`：指定Dockerfile所在的目录，这里是当前目录

**构建过程解释：**
1. Docker会从基础镜像`node:18-alpine`开始
2. 设置工作目录为`/app`
3. 复制`package*.json`文件到镜像中
4. 执行`npm install`安装依赖
5. 复制所有源代码到镜像中
6. 暴露端口35643
7. 设置启动命令`npm start`

### 4.4 查看构建的镜像

构建完成后，使用以下命令查看本地镜像列表：

```bash
docker images
```

您应该能看到刚刚构建的镜像：

```
REPOSITORY    TAG       IMAGE ID       CREATED         SIZE
env-manager   latest    abcdef123456   2 minutes ago   120MB
```

## 5. 在本地运行Docker镜像

### 5.1 使用docker run命令运行容器

```bash
docker run -d -p 35643:35643 --name env-manager-container env-manager:latest
```

**命令解释：**
- `docker run`：运行Docker容器的命令
- `-d`：在后台运行容器
- `-p 35643:35643`：端口映射，将宿主机的35643端口映射到容器的35643端口
- `--name env-manager-container`：为容器指定名称
- `env-manager:latest`：指定要运行的镜像

### 5.2 查看运行中的容器

```bash
docker ps
```

您应该能看到正在运行的容器：

```
CONTAINER ID   IMAGE               COMMAND                  CREATED          STATUS          PORTS                      NAMES
a1b2c3d4e5f6   env-manager:latest   "npm start"              1 minute ago     Up 1 minute     0.0.0.0:35643->35643/tcp   env-manager-container
```

### 5.3 访问应用

现在，您可以通过浏览器访问应用程序：
- 登录页面：http://localhost:35643/login
- 主页面：http://localhost:35643
- API文档：http://localhost:35643/api-docs

使用默认用户名和密码登录：
- 用户名：sqlite
- 密码：sqliteadmin

### 5.4 查看容器日志

```bash
docker logs env-manager-container
```

要实时查看日志，可以使用：

```bash
docker logs -f env-manager-container
```

### 5.5 停止和启动容器

停止容器：
```bash
docker stop env-manager-container
```

启动容器：
```bash
docker start env-manager-container
```

### 5.6 删除容器

```bash
docker rm env-manager-container
```

如果容器正在运行，需要先停止容器，或者使用`-f`参数强制删除：

```bash
docker rm -f env-manager-container
```

## 6. 使用docker-compose简化本地开发

### 6.1 了解docker-compose.yml

`docker-compose.yml` 是Docker Compose的配置文件，用于定义和管理多个Docker容器。让我们看看我们项目中的docker-compose.yml：

```yaml
version: '3.8'

services:
  env-manager:
    build: .
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

### 6.2 使用docker-compose构建和运行

在项目根目录执行以下命令：

```bash
docker-compose up -d
```

**命令解释：**
- `docker-compose up`：启动所有服务
- `-d`：在后台运行

### 6.3 查看服务状态

```bash
docker-compose ps
```

### 6.4 查看服务日志

```bash
docker-compose logs
```

实时查看日志：

```bash
docker-compose logs -f
```

### 6.5 停止服务

```bash
docker-compose down
```

### 6.6 使用卷挂载实现数据持久化

在`docker-compose.yml`中，我们使用了卷挂载：

```yaml
volumes:
  - ./env_vars.db:/app/env_vars.db
```

这意味着：
- 容器内的`/app/env_vars.db`文件会映射到宿主机的`./env_vars.db`文件
- 即使容器被删除，数据库数据也会保存在宿主机上
- 下次启动容器时，会继续使用之前的数据

## 7. 本地镜像管理

### 7.1 列出本地镜像

```bash
docker images
```

### 7.2 标记本地镜像

可以为镜像添加多个标签：

```bash
docker tag env-manager:latest env-manager:v1.0.0
```

### 7.3 删除本地镜像

```bash
docker rmi env-manager:v1.0.0
```

如果镜像被容器使用，需要先删除容器，或者使用`-f`参数强制删除：

```bash
docker rmi -f env-manager:latest
```

### 7.4 清理未使用的资源

删除未使用的容器、镜像、卷和网络：

```bash
docker system prune
```

要删除所有未使用的资源，包括卷：

```bash
docker system prune -a --volumes
```

## 8. 常见问题和解决方案

### 8.1 端口被占用

**问题**：启动容器时出现"port is already allocated"错误

**解决方案**：
- 检查哪个进程在使用该端口：
  ```bash
  # Windows
  netstat -ano | findstr :35643
  
  # Mac/Linux
  lsof -i :35643
  ```
- 停止占用端口的进程，或者使用不同的端口：
  ```bash
  docker run -d -p 35644:35643 env-manager:latest
  ```

### 8.2 构建失败

**问题**：构建镜像时出现错误

**解决方案**：
- 检查Dockerfile中的语法错误
- 确保网络连接正常，能够下载基础镜像
- 检查项目依赖是否正确

### 8.3 容器启动失败

**问题**：容器启动后立即退出

**解决方案**：
- 查看容器日志找出原因：
  ```bash
  docker logs env-manager-container
  ```
- 检查启动命令是否正确

### 8.4 无法访问应用

**问题**：启动容器后，无法通过浏览器访问应用

**解决方案**：
- 检查容器是否正在运行：`docker ps`
- 检查端口映射是否正确：`docker port env-manager-container`
- 检查防火墙设置，确保端口已开放

## 9. 本地开发工作流

推荐的本地开发工作流：

1. 在本地修改代码
2. 使用`docker-compose build`重新构建镜像
3. 使用`docker-compose up -d`重新启动容器
4. 访问应用测试修改
5. 重复以上步骤直到开发完成

## 10. 学习资源

- **Docker官方文档**：https://docs.docker.com/
- **Docker教程**：https://docker-curriculum.com/
- **Docker命令参考**：https://docs.docker.com/engine/reference/commandline/docker/
- **Dockerfile参考**：https://docs.docker.com/engine/reference/builder/

## 11. 总结

通过本教程，您已经学会了如何在本地制作和使用Docker镜像。主要包括：

1. 安装和验证Docker环境
2. 理解Dockerfile和docker-compose.yml
3. 使用docker build构建镜像
4. 使用docker run运行容器
5. 使用docker-compose管理服务
6. 管理本地镜像和容器
7. 解决常见问题

现在，您可以开始在本地使用Docker进行开发和测试了。Docker是一个强大的工具，可以大大提高您的开发效率和部署可靠性。

继续探索Docker的更多功能，您会发现它的强大和便捷！
