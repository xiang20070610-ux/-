/**
 * 活动相关路由
 * 随机推荐、分类查询、收藏、历史记录
 */
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { randomSample, shuffle, moodToTag } = require('../utils/random');

/**
 * 获取分类列表
 * GET /api/activities/categories
 */
router.get('/categories', (req, res) => {
  try {
    const db = getDatabase();
    const categories = db.prepare(
      'SELECT * FROM categories ORDER BY sort_order ASC'
    ).all();
    res.json({ code: 0, data: categories });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

/**
 * 获取指定分类的活动列表（分页）
 * GET /api/activities?category_id=1&page=1&page_size=20
 */
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { category_id, page = 1, page_size = 20, mood } = req.query;
    const offset = (page - 1) * page_size;
    const conditions = [];
    const params = [];

    if (category_id) {
      conditions.push('a.category_id = ?');
      params.push(category_id);
    }

    if (mood) {
      const moodTag = moodToTag(mood);
      if (moodTag) {
        conditions.push('a.mood_tags LIKE ?');
        params.push(`%${moodTag}%`);
      }
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    const total = db.prepare(
      `SELECT COUNT(*) as cnt FROM activities a ${whereClause}`
    ).get(...params);

    const activities = db.prepare(
      `SELECT a.*, c.name as category_name, c.icon as category_icon
       FROM activities a
       JOIN categories c ON a.category_id = c.id
       ${whereClause}
       ORDER BY a.is_premium DESC, a.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, parseInt(page_size), offset);

    // 解析tags JSON
    const parsed = activities.map(a => ({
      ...a,
      tags: JSON.parse(a.tags || '[]'),
      mood_tags: JSON.parse(a.mood_tags || '[]'),
    }));

    res.json({
      code: 0,
      data: {
        list: parsed,
        total: total.cnt,
        page: parseInt(page),
        page_size: parseInt(page_size),
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

/**
 * 随机获取一条活动
 * GET /api/activities/random?category_id=1&mood=开心
 */
router.get('/random', (req, res) => {
  try {
    const db = getDatabase();
    const { category_id, mood, exclude_id } = req.query;
    const conditions = [];
    const params = [];

    if (category_id) {
      conditions.push('a.category_id = ?');
      params.push(category_id);
    }

    if (mood) {
      const moodTag = moodToTag(mood);
      if (moodTag) {
        conditions.push('a.mood_tags LIKE ?');
        params.push(`%${moodTag}%`);
      }
    }

    if (exclude_id) {
      conditions.push('a.id != ?');
      params.push(exclude_id);
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    const activities = db.prepare(
      `SELECT a.*, c.name as category_name, c.icon as category_icon
       FROM activities a
       JOIN categories c ON a.category_id = c.id
       ${whereClause}`
    ).all(...params);

    if (activities.length === 0) {
      return res.json({ code: 0, data: null, message: '没有符合条件的活动' });
    }

    // 随机选一条
    const [selected] = randomSample(activities, 1);
    selected.tags = JSON.parse(selected.tags || '[]');
    selected.mood_tags = JSON.parse(selected.mood_tags || '[]');

    res.json({ code: 0, data: selected });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

/**
 * 获取活动详情
 * GET /api/activities/:id
 */
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const activity = db.prepare(
      `SELECT a.*, c.name as category_name, c.icon as category_icon
       FROM activities a
       JOIN categories c ON a.category_id = c.id
       WHERE a.id = ?`
    ).get(req.params.id);

    if (!activity) {
      return res.status(404).json({ code: 404, message: '活动不存在' });
    }

    activity.tags = JSON.parse(activity.tags || '[]');
    activity.mood_tags = JSON.parse(activity.mood_tags || '[]');

    res.json({ code: 0, data: activity });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

/**
 * 添加收藏
 * POST /api/activities/:id/favorite
 * Body: { user_openid: "xxx" }
 */
router.post('/:id/favorite', (req, res) => {
  try {
    const db = getDatabase();
    const { user_openid } = req.body;
    const activity_id = req.params.id;

    if (!user_openid) {
      return res.status(400).json({ code: 400, message: '缺少用户标识' });
    }

    // 检查活动是否存在
    const activity = db.prepare('SELECT id FROM activities WHERE id = ?').get(activity_id);
    if (!activity) {
      return res.status(404).json({ code: 404, message: '活动不存在' });
    }

    try {
      db.prepare(
        'INSERT INTO favorites (user_openid, activity_id) VALUES (?, ?)'
      ).run(user_openid, activity_id);
      res.json({ code: 0, message: '收藏成功' });
    } catch (e) {
      if (e.message.includes('UNIQUE')) {
        res.json({ code: 1, message: '已收藏过了' });
      } else {
        throw e;
      }
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

/**
 * 取消收藏
 * DELETE /api/activities/:id/favorite
 * Body: { user_openid: "xxx" }
 */
router.delete('/:id/favorite', (req, res) => {
  try {
    const db = getDatabase();
    const { user_openid } = req.body;
    const activity_id = req.params.id;

    db.prepare(
      'DELETE FROM favorites WHERE user_openid = ? AND activity_id = ?'
    ).run(user_openid, activity_id);

    res.json({ code: 0, message: '已取消收藏' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

/**
 * 获取收藏列表
 * GET /api/activities/favorites/list?user_openid=xxx
 */
router.get('/favorites/list', (req, res) => {
  try {
    const db = getDatabase();
    const { user_openid, page = 1, page_size = 20 } = req.query;
    const offset = (page - 1) * page_size;

    if (!user_openid) {
      return res.status(400).json({ code: 400, message: '缺少用户标识' });
    }

    const total = db.prepare(
      'SELECT COUNT(*) as cnt FROM favorites WHERE user_openid = ?'
    ).get(user_openid);

    const list = db.prepare(
      `SELECT a.*, c.name as category_name, c.icon as category_icon, f.created_at as favorited_at
       FROM favorites f
       JOIN activities a ON f.activity_id = a.id
       JOIN categories c ON a.category_id = c.id
       WHERE f.user_openid = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(user_openid, parseInt(page_size), offset);

    const parsed = list.map(a => ({
      ...a,
      tags: JSON.parse(a.tags || '[]'),
      mood_tags: JSON.parse(a.mood_tags || '[]'),
    }));

    res.json({
      code: 0,
      data: { list: parsed, total: total.cnt }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

/**
 * 记录浏览（插入历史）
 * POST /api/activities/:id/view
 * Body: { user_openid: "xxx" }
 */
router.post('/:id/view', (req, res) => {
  try {
    const db = getDatabase();
    const { user_openid } = req.body;
    const activity_id = req.params.id;

    if (!user_openid) {
      return res.status(400).json({ code: 400, message: '缺少用户标识' });
    }

    db.prepare(
      'INSERT INTO history (user_openid, activity_id) VALUES (?, ?)'
    ).run(user_openid, activity_id);

    res.json({ code: 0, message: '已记录' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

/**
 * 获取浏览历史
 * GET /api/activities/history/list?user_openid=xxx
 */
router.get('/history/list', (req, res) => {
  try {
    const db = getDatabase();
    const { user_openid, page = 1, page_size = 20 } = req.query;
    const offset = (page - 1) * page_size;

    if (!user_openid) {
      return res.status(400).json({ code: 400, message: '缺少用户标识' });
    }

    const total = db.prepare(
      'SELECT COUNT(*) as cnt FROM history WHERE user_openid = ?'
    ).get(user_openid);

    const list = db.prepare(
      `SELECT a.*, c.name as category_name, c.icon as category_icon, h.viewed_at
       FROM history h
       JOIN activities a ON h.activity_id = a.id
       JOIN categories c ON a.category_id = c.id
       WHERE h.user_openid = ?
       ORDER BY h.viewed_at DESC
       LIMIT ? OFFSET ?`
    ).all(user_openid, parseInt(page_size), offset);

    const parsed = list.map(a => ({
      ...a,
      tags: JSON.parse(a.tags || '[]'),
      mood_tags: JSON.parse(a.mood_tags || '[]'),
    }));

    res.json({
      code: 0,
      data: { list: parsed, total: total.cnt }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

/**
 * 记录活动完成
 * POST /api/activities/:id/complete
 */
router.post('/:id/complete', (req, res) => {
  try {
    const db = getDatabase();
    const { user_openid, mood_after, rating } = req.body;
    const activity_id = req.params.id;

    if (!user_openid) {
      return res.status(400).json({ code: 400, message: '缺少用户标识' });
    }

    db.prepare(
      'INSERT INTO activity_completions (user_openid, activity_id, mood_after, rating) VALUES (?, ?, ?, ?)'
    ).run(user_openid, activity_id, mood_after || null, rating || null);

    res.json({ code: 0, message: '完成记录已保存' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
