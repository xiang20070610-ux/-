/**
 * 数据库初始化模块
 * 创建所有必要的表结构
 */
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'moment.db');

let db;

/**
 * 获取数据库实例（单例）
 */
function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH, {
      // verbose: console.log
    });
    // 启用 WAL 模式提升并发性能
    db.pragma('journal_mode = WAL');
    // 启用外键约束
    db.pragma('foreign_keys = ON');
  }
  return db;
}

/**
 * 创建所有表结构
 */
function createTables(database) {
  // 活动分类表
  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,           -- 分类名：独处、情侣、好友
      icon TEXT,                     -- 图标 emoji
      description TEXT,              -- 分类描述
      sort_order INTEGER DEFAULT 0  -- 排序
    )
  `);

  // 活动内容表
  database.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      title TEXT NOT NULL,           -- 活动标题
      description TEXT,              -- 简短描述
      detail TEXT,                   -- 详细说明
      tags TEXT,                     -- 标签，JSON数组字符串
      mood_tags TEXT,                -- 心情标签：开心/平静/无聊/冒险/浪漫
      icon TEXT,                     -- 图标 emoji
      is_premium INTEGER DEFAULT 0, -- 是否精选
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // 用户收藏表
  database.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_openid TEXT NOT NULL,     -- 微信用户标识
      activity_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_id) REFERENCES activities(id),
      UNIQUE(user_openid, activity_id)
    )
  `);

  // 浏览记录表
  database.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_openid TEXT NOT NULL,
      activity_id INTEGER NOT NULL,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_id) REFERENCES activities(id)
    )
  `);

  // 情侣打卡表
  database.exec(`
    CREATE TABLE IF NOT EXISTS couple_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_openid TEXT NOT NULL,
      activity_id INTEGER,
      checkin_date DATE NOT NULL,    -- 打卡日期
      note TEXT,                     -- 打卡备注
      photo_url TEXT,                -- 打卡照片（可选）
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_id) REFERENCES activities(id),
      UNIQUE(user_openid, checkin_date)
    )
  `);

  // 用户设置表
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_openid TEXT NOT NULL UNIQUE,
      dark_mode INTEGER DEFAULT 0,  -- 深色模式 0=关闭 1=开启
      language TEXT DEFAULT 'zh-CN',
      notify_enabled INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 活动完成记录表（用于统计）
  database.exec(`
    CREATE TABLE IF NOT EXISTS activity_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_openid TEXT NOT NULL,
      activity_id INTEGER NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      mood_after TEXT,               -- 完成后心情
      rating INTEGER,                -- 评分 1-5
      FOREIGN KEY (activity_id) REFERENCES activities(id)
    )
  `);

  // 索引优化
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_openid);
    CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_openid);
    CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON couple_checkins(user_openid, checkin_date);
    CREATE INDEX IF NOT EXISTS idx_completions_user ON activity_completions(user_openid);
  `);

  console.log('✅ 数据库表创建完成');
}

/**
 * 初始化数据库
 */
async function initDatabase() {
  const database = getDatabase();
  createTables(database);

  // 检查是否需要插入种子数据
  const count = database.prepare('SELECT COUNT(*) as cnt FROM activities').get();
  if (count.cnt === 0) {
    console.log('📦 数据库为空，插入种子数据...');
    const { seedData } = require('./seed');
    seedData(database);
  } else {
    console.log(`📊 数据库已有 ${count.cnt} 条活动数据`);
  }

  return database;
}

module.exports = { getDatabase, initDatabase };
