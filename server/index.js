/**
 * 随机岛小程序 - 后端入口
 * Express + SQLite
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const activitiesRouter = require('./routes/activities');
const aiRouter = require('./routes/ai');
const mapRouter = require('./routes/map');
const checkinRouter = require('./routes/checkin');
const statsRouter = require('./routes/stats');
const { initDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 路由注册
app.use('/api/activities', activitiesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/map', mapRouter);
app.use('/api/checkin', checkinRouter);
app.use('/api/stats', statsRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`✨ 随机岛服务器已启动: http://localhost:${PORT}`);
      console.log(`   API 地址: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
}

start();
