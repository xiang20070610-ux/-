/**
 * 数据统计路由
 * 本月完成活动数、收藏数、最爱分类等
 */
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');

/**
 * 获取用户综合统计
 * GET /api/stats/overview?user_openid=xxx
 */
router.get('/overview', (req, res) => {
  try {
    const db = getDatabase();
    const { user_openid } = req.query;

    if (!user_openid) {
      return res.status(400).json({ code: 400, message: '缺少用户标识' });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = `${year}-${String(month).padStart(2, '0')}-31`;

    // 本月完成活动数
    const monthlyCompletions = db.prepare(
      `SELECT COUNT(*) as cnt
       FROM activity_completions
       WHERE user_openid = ? AND completed_at >= ? AND completed_at <= ?`
    ).get(user_openid, firstDay, lastDay);

    // 总收藏数
    const totalFavorites = db.prepare(
      'SELECT COUNT(*) as cnt FROM favorites WHERE user_openid = ?'
    ).get(user_openid);

    // 总完成数
    const totalCompletions = db.prepare(
      'SELECT COUNT(*) as cnt FROM activity_completions WHERE user_openid = ?'
    ).get(user_openid);

    // 总打卡数
    const totalCheckins = db.prepare(
      'SELECT COUNT(DISTINCT checkin_date) as cnt FROM couple_checkins WHERE user_openid = ?'
    ).get(user_openid);

    // 打卡连续天数
    const dates = db.prepare(
      `SELECT DISTINCT checkin_date
       FROM couple_checkins
       WHERE user_openid = ?
       ORDER BY checkin_date DESC
       LIMIT 60`
    ).all(user_openid).map(r => r.checkin_date);

    let streak = 0;
    if (dates.length > 0) {
      streak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        if ((prev - curr) / 86400000 === 1) streak++;
        else break;
      }
    }

    // 最喜欢的分类
    const favoriteCategory = db.prepare(
      `SELECT c.name, c.icon, COUNT(*) as cnt
       FROM favorites f
       JOIN activities a ON f.activity_id = a.id
       JOIN categories c ON a.category_id = c.id
       WHERE f.user_openid = ?
       GROUP BY c.id
       ORDER BY cnt DESC
       LIMIT 1`
    ).get(user_openid);

    // 最常完成的活动类型
    const mostDoneCategory = db.prepare(
      `SELECT c.name, c.icon, COUNT(*) as cnt
       FROM activity_completions ac
       JOIN activities a ON ac.activity_id = a.id
       JOIN categories c ON a.category_id = c.id
       WHERE ac.user_openid = ?
       GROUP BY c.id
       ORDER BY cnt DESC
       LIMIT 1`
    ).get(user_openid);

    // 本周每日完成统计
    const weekStats = getWeeklyStats(db, user_openid);

    res.json({
      code: 0,
      data: {
        monthly_completions: monthlyCompletions.cnt,
        total_favorites: totalFavorites.cnt,
        total_completions: totalCompletions.cnt,
        total_checkin_days: totalCheckins.cnt,
        streak_days: streak,
        favorite_category: favoriteCategory || null,
        most_done_category: mostDoneCategory || null,
        weekly_stats: weekStats,
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

/**
 * 获取本周每日统计
 */
function getWeeklyStats(db, user_openid) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const stats = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const completions = db.prepare(
      `SELECT COUNT(*) as cnt
       FROM activity_completions
       WHERE user_openid = ? AND date(completed_at) = ?`
    ).get(user_openid, dateStr);

    const checked = db.prepare(
      `SELECT COUNT(*) as cnt
       FROM couple_checkins
       WHERE user_openid = ? AND checkin_date = ?`
    ).get(user_openid, dateStr);

    stats.push({
      day: weekDays[i],
      date: dateStr,
      completions: completions.cnt,
      checked: checked.cnt > 0,
      is_today: dateStr === today.toISOString().split('T')[0],
    });
  }

  return stats;
}

/**
 * 获取完成记录列表
 * GET /api/stats/completions?user_openid=xxx&page=1
 */
router.get('/completions', (req, res) => {
  try {
    const db = getDatabase();
    const { user_openid, page = 1, page_size = 20 } = req.query;
    const offset = (page - 1) * page_size;

    if (!user_openid) {
      return res.status(400).json({ code: 400, message: '缺少用户标识' });
    }

    const total = db.prepare(
      'SELECT COUNT(*) as cnt FROM activity_completions WHERE user_openid = ?'
    ).get(user_openid);

    const list = db.prepare(
      `SELECT ac.*, a.title, a.icon, a.description, c.name as category_name, c.icon as category_icon
       FROM activity_completions ac
       JOIN activities a ON ac.activity_id = a.id
       JOIN categories c ON a.category_id = c.id
       WHERE ac.user_openid = ?
       ORDER BY ac.completed_at DESC
       LIMIT ? OFFSET ?`
    ).all(user_openid, parseInt(page_size), offset);

    res.json({
      code: 0,
      data: { list, total: total.cnt, page: parseInt(page) }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
