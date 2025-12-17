# 使用官方Node.js运行时作为基础镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 创建数据目录
RUN mkdir -p /app/data

# 复制package.json和package-lock.json到工作目录
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有源代码到工作目录
COPY . .

# 暴露端口
EXPOSE 35643

# 设置默认数据目录环境变量
ENV DATA_DIR=/app/data

# 启动应用
CMD ["npm", "start"]