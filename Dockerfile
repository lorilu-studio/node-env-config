# 多阶段构建，支持多架构
FROM node:20-alpine AS base

# 设置工作目录
WORKDIR /app

# 创建数据目录
RUN mkdir -p /app/data

# 复制package.json和package-lock.json到工作目录
COPY package*.json ./

# 安装依赖
RUN npm install --only=production

# 复制所有源代码到工作目录
COPY . .

# 暴露端口
EXPOSE 35643

# 设置默认数据目录环境变量
ENV DATA_DIR=/app/data

# 添加非root用户以提高安全性
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 更改数据目录所有者
RUN chown -R nodejs:nodejs /app/data

# 切换到非root用户
USER nodejs

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:35643/api/env-vars', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# 启动应用
CMD ["npm", "start"]