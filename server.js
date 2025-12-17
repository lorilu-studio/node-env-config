const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const session = require('express-session');

const app = express();
const PORT = 35643;

// 配置中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 配置会话中间件
app.use(session({
    secret: 'sqlite_link_manager_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 } // 1小时过期
}));

// 固定的登录凭证
const FIXED_USERNAME = 'sqlite';
const FIXED_PASSWORD = 'sqliteadmin';

// 身份验证中间件
function isAuthenticated(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
}

// 创建SQLite数据库连接
// 优先使用环境变量中的数据库路径，否则使用默认路径
const dbPath = process.env.DB_PATH || path.join(process.env.DATA_DIR || './data', 'env_vars.db');

// 确保数据目录存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 确保数据目录有正确的权限（在容器环境中特别重要）
try {
    fs.chmodSync(dataDir, 0o755);
} catch (err) {
    console.warn('无法设置数据目录权限:', err.message);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接错误:', err.message);
    } else {
        console.log('已成功连接到SQLite数据库，路径:', dbPath);
        // 创建环境变量表
        createEnvVarsTable();
    }
});

// 创建环境变量表
function createEnvVarsTable() {
    const createTableSql = `
        CREATE TABLE IF NOT EXISTS env_vars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            remark TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    db.run(createTableSql, (err) => {
        if (err) {
            console.error('创建表错误:', err.message);
        } else {
            console.log('已创建或验证env_vars表');
        }
    });
}

// Swagger配置选项
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '环境变量管理系统 API',
            version: '1.0.0',
            description: '环境变量管理系统的RESTful API文档',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
            },
        ],
    },
    apis: ['./server.js'], // 指定API定义的文件
};

// 生成Swagger文档
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// 配置Swagger UI路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 登录页面
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// 登录API
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === FIXED_USERNAME && password === FIXED_PASSWORD) {
        req.session.authenticated = true;
        res.redirect('/');
    } else {
        res.redirect('/login?error=1');
    }
});

// 登出API
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// 渲染HTML模板
app.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

/**
 * @swagger
 * /api/env-vars:
 *   get:
 *     summary: 获取所有环境变量
 *     description: 返回所有环境变量的列表，按ID降序排列
 *     tags: [Environment Variables]
 *     responses:
 *       200:
 *         description: 环境变量列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: 环境变量ID
 *                   key:
 *                     type: string
 *                     description: 环境变量键
 *                   value:
 *                     type: string
 *                     description: 环境变量值
 *                   remark:
 *                     type: string
 *                     description: 备注信息
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     description: 创建时间
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *                     description: 更新时间
 */
app.get('/api/env-vars', isAuthenticated, (req, res) => {
    const selectSql = 'SELECT * FROM env_vars ORDER BY id DESC';
    
    db.all(selectSql, [], (err, rows) => {
        if (err) {
            console.error('查询数据错误:', err.message);
            res.status(500).json({ error: '查询数据失败' });
            return;
        }
        res.json(rows);
    });
});

/**
 * @swagger
 * /api/env-vars:
 *   post:
 *     summary: 创建新环境变量
 *     description: 创建一个新的环境变量记录
 *     tags: [Environment Variables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *                 description: 环境变量键
 *               value:
 *                 type: string
 *                 description: 环境变量值
 *               remark:
 *                 type: string
 *                 description: 备注信息
 *     responses:
 *       200:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: 新创建的环境变量ID
 *                 message:
 *                   type: string
 *                   description: 成功消息
 */
app.post('/api/env-vars', isAuthenticated, (req, res) => {
    const { key, value, remark } = req.body;
    
    if (!key || !value) {
        res.status(400).json({ error: '环境变量键和值不能为空' });
        return;
    }
    
    const insertSql = 'INSERT INTO env_vars (key, value, remark) VALUES (?, ?, ?)';
    
    db.run(insertSql, [key, value, remark || ''], function(err) {
        if (err) {
            console.error('插入数据错误:', err.message);
            res.status(500).json({ error: '插入数据失败' });
            return;
        }
        res.json({ id: this.lastID, key, value, remark, message: '创建成功' });
    });
});

/**
 * @swagger
 * /api/env-vars/{id}:
 *   put:
 *     summary: 更新环境变量
 *     description: 更新指定ID的环境变量记录
 *     tags: [Environment Variables]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 环境变量ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *                 description: 环境变量键
 *               value:
 *                 type: string
 *                 description: 环境变量值
 *               remark:
 *                 type: string
 *                 description: 备注信息
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: 更新的环境变量ID
 *                 message:
 *                   type: string
 *                   description: 成功消息
 *       404:
 *         description: 环境变量不存在
 */
app.put('/api/env-vars/:id', isAuthenticated, (req, res) => {
    const id = req.params.id;
    const { key, value, remark } = req.body;
    
    if (!key || !value) {
        res.status(400).json({ error: '环境变量键和值不能为空' });
        return;
    }
    
    const updateSql = 'UPDATE env_vars SET key = ?, value = ?, remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    
    db.run(updateSql, [key, value, remark || '', id], function(err) {
        if (err) {
            console.error('更新数据错误:', err.message);
            res.status(500).json({ error: '更新数据失败' });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: '环境变量不存在' });
            return;
        }
        res.json({ id, key, value, remark, message: '更新成功' });
    });
});

/**
 * @swagger
 * /api/env-vars/{id}:
 *   delete:
 *     summary: 删除环境变量
 *     description: 删除指定ID的环境变量记录
 *     tags: [Environment Variables]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 环境变量ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: 删除的环境变量ID
 *                 message:
 *                   type: string
 *                   description: 成功消息
 *       404:
 *         description: 环境变量不存在
 */
app.delete('/api/env-vars/:id', isAuthenticated, (req, res) => {
    const id = req.params.id;
    
    const deleteSql = 'DELETE FROM env_vars WHERE id = ?';
    
    db.run(deleteSql, [id], function(err) {
        if (err) {
            console.error('删除数据错误:', err.message);
            res.status(500).json({ error: '删除数据失败' });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: '环境变量不存在' });
            return;
        }
        res.json({ id, message: '删除成功' });
    });
});

// 优雅关闭数据库连接的函数
function closeDatabase() {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) {
                console.error('关闭数据库连接错误:', err.message);
                reject(err);
            } else {
                console.log('已关闭SQLite数据库连接');
                resolve();
            }
        });
    });
}

// 启动服务器
const server = app.listen(PORT, () => {
    console.log(`服务器已启动，监听端口 ${PORT}`);
    console.log(`访问地址: http://localhost:${PORT}`);
    console.log(`登录页面: http://localhost:${PORT}/login`);
    console.log(`Swagger文档: http://localhost:${PORT}/api-docs`);
    console.log('按 Ctrl+C 停止服务器');
});

// 关闭服务器时关闭数据库连接
process.on('SIGINT', async () => {
    console.log('收到SIGINT信号，正在关闭服务器...');
    server.close(async () => {
        console.log('HTTP服务器已关闭');
        try {
            await closeDatabase();
            process.exit(0);
        } catch (error) {
            console.error('关闭数据库时出错:', error);
            process.exit(1);
        }
    });
});

// 处理SIGTERM信号（Docker容器停止时会发送此信号）
process.on('SIGTERM', async () => {
    console.log('收到SIGTERM信号，正在关闭服务器...');
    server.close(async () => {
        console.log('HTTP服务器已关闭');
        try {
            await closeDatabase();
            process.exit(0);
        } catch (error) {
            console.error('关闭数据库时出错:', error);
            process.exit(1);
        }
    });
});