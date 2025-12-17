# 环境变量管理系统

一个基于Node.js和SQLite的简单环境变量管理系统，支持完整的CRUD操作，提供美观的Web界面和Swagger API文档。

## 功能特性

- ✨ 完整的CRUD操作（创建、读取、更新、删除）
- 📊 美观的表格展示
- 🎨 简约的ShadeUI设计风格
- 📱 响应式设计，适配各种设备
- ⚡ 实时操作反馈
- 🛡️ 删除确认机制，防止误操作
- 💬 支持添加备注信息
- ⏰ 自动记录创建和更新时间
- 🔒 登录验证机制
- 📚 Swagger API文档

## 技术栈

- **Node.js** - 运行环境
- **Express** - Web框架
- **SQLite3** - 数据库
- **HTML5 + CSS3 + JavaScript** - 前端界面
- **Swagger** - API文档

## 安装步骤

1. **克隆或下载项目**

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动服务**
   ```bash
   npm start
   ```

4. **访问服务**
   - 登录页面：`http://localhost:35643/login`
   - 主页面：`http://localhost:35643`
   - API文档：`http://localhost:35643/api-docs`

## 登录信息

- **用户名**：
- **密码**：
- 可在 `server.js` 中修改默认登录凭证

## 项目结构

```
node-env-config/
├── views/                 # 视图目录
│   ├── index.html         # HTML主页面
│   └── login.html         # 登录页面
├── server.js              # 主服务器文件
├── env_vars.db            # SQLite数据库文件（自动生成）
├── package.json           # 项目配置文件
├── package-lock.json      # 依赖锁定文件
└── README.md              # 项目说明文档
```

## 数据库表结构

| 字段名 | 类型 | 描述 |
|-------|------|------|
| id | INTEGER | 主键，自动递增 |
| key | TEXT | 环境变量键，不能为空 |
| value | TEXT | 环境变量值，不能为空 |
| remark | TEXT | 备注信息，可选 |
| created_at | DATETIME | 创建时间，自动生成 |
| updated_at | DATETIME | 更新时间，自动生成 |

## 功能说明

### 添加环境变量
1. 点击"添加环境变量"按钮
2. 在弹出的模态框中填写键、值和备注
3. 点击"保存"按钮
4. 环境变量将被添加到列表中

### 编辑环境变量
1. 点击列表中任意环境变量的"编辑"按钮
2. 在弹出的模态框中修改信息
3. 点击"保存"按钮
4. 点击"取消"按钮可放弃编辑

### 删除环境变量
1. 点击列表中任意环境变量的"删除"按钮
2. 在弹出的确认模态框中点击"确认删除"
3. 环境变量将被从列表中删除

## npm 脚本

| 脚本命令 | 描述 |
|---------|------|
| `npm start` | 启动生产环境服务 |
| `npm run dev` | 启动开发环境服务（使用nodemon热重载） |

## API文档

访问 `http://localhost:35643/api-docs` 查看完整的Swagger API文档，支持在线测试API。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！


## Docker 部署

您可以使用Docker快速部署此环境变量管理系统：

### 使用Docker Hub镜像

1. **拉取镜像**
   ```bash
   # 拉取特定版本
   docker pull lorilu/env-manager:1.0.0
   
   # 或者拉取最新版本
   docker pull lorilu/env-manager:latest
   ```

2. **运行容器**
   ```bash
   # 运行容器
   docker run -d -p 35643:35643 --name env-manager lorilu/env-manager:1.0.0
   ```

3. **访问服务**
   - 登录页面：`http://localhost:35643/login`
   - 主页面：`http://localhost:35643`
   - API文档：`http://localhost:35643/api-docs`

### 使用Docker Compose

1. **创建docker-compose.yml文件**
   ```yaml
   version: '3.8'

   services:
     env-manager:
       image: lorilu/env-manager:1.0.0
       container_name: env-manager
       restart: unless-stopped
       ports:
         - "35643:35643"
       environment:
         - NODE_ENV=production
         - DATA_DIR=/app/data
   ```

2. **启动服务**
   ```bash
   docker-compose up -d
   ```

### 数据存储

在当前配置中，数据库文件直接存储在容器内的 `/app/data` 目录中。这种方式的优势是：

- 简化部署流程，无需处理卷挂载
- 容器自包含，更适合生产环境
- 避免了宿主机路径依赖问题

注意：如果容器被删除，数据库数据也会丢失。如需持久化数据，可以考虑使用命名卷或数据库备份策略。

### 高级配置

您可以通过环境变量自定义数据库路径：

```bash
docker run -d -p 35643:35643 \
  --name env-manager \
  -e DB_PATH=/app/custom-data/my-env-vars.db \
  lorilu/env-manager:1.0.0
```

### 环境变量配置

| 环境变量 | 默认值 | 描述 |
|---------|-------|------|
| `DATA_DIR` | `./data` | 数据存储目录 |
| `DB_PATH` | `$DATA_DIR/env_vars.db` | 数据库文件完整路径 |
| `NODE_ENV` | `production` | 运行环境 |

### 自定义构建

如果您想自定义构建镜像：

1. **克隆项目**
   ```bash
   git clone [项目地址]
   cd node-env-config
   ```

2. **构建镜像**
   ```bash
   docker build -t your-name/env-manager:1.0.0 .
   ```

3. **运行容器**
   ```bash
   docker run -d -p 35643:35643 --name env-manager your-name/env-manager:1.0.0
   ```
