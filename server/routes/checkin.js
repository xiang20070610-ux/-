/**
 * 情侣打卡系统路由
 * 连续打卡、情侣日历
 */
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');

/**
 * 打卡
 * POST /api/checkin
 * Body: { user_openid, activity_id, note, photo_url }
 */
router.post('/', (req, res) => {
  try {
    const db = getDatabase();
    const { user_openid, activity_id, note, photo_url } = req.body;

    if (!user_openid) {
      return res.status(400).json({ code: 400, message: '缺少用户标识' });
    }

    const today = new Date().toISOString().split('T')[0];

    try {
      const result = db.prepare(
        'INSERT INTO couple_checkins (user_openid, activity_id, checkin_date, note, photo_url) VALUES (?, ?, ?, ?, ?)'
      ).run(user_openid, activity_id || null, today, note || null, photo_url || null);

      // 同时记录活动完成
      if (activity_id) {
        db.prepare(
          'INSERT INTO activity_completions (user_openid, activity_id) VALUES (?, ?)'
        ).run(user_openid, activity_id);
      }

      res.json({
        code: 0,
        message: '打卡成功',
        data: { id: result.lastInsertRowid, date: today }
      });
    } catch (e) {
      if (e.message.includes('UNIQUE')) {
        res.json({ code: 1, message: '今天已经打卡过了' });
      } else {
        throw e;
      }
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

/**
 * 获取打卡统计
 * GET /api/checkin/stats?user_openid=xxx
 */
router.get('/stats', (req, res) => {
  try {
    const db = getDatabase();
    const { user_openid } = req.query;

    if (!user_openid) {
      return res.status(400).json({ code: 400, message: '缺少用户标识' });
    }

    // 总打卡天数
    const totalDays = db.prepare(
      'SELECT COUNT(DISTINCT checkin_date) as cnt FROM couple_checkins WHERE user_openid = ?'
    ).get(user_openid);

    // 连续打卡天数
    const streak = calculateStreak(db, user_openid);

    // 本月打卡天数
    const now = new Date();
    const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;

    const monthlyDays = db.prepare(
      `SELECT COUNT(DISTINCT checkin_date) as cnt
       FROM couple_checkins
       WHERE user_openid = ? AND checkin_date >= ? AND checkin_date <= ?`
    ).get(user_openid, firstDayOfMonth, lastDayOfMonth);

    // 最近打卡记录
    const recentCheckins = db.prepare(
      `SELECT cc.*, a.title as activity_title, a.icon as activity_icon
       FROM couple_checkins cc
       LEFT JOIN activities a ON cc.activity_id = a.id
       WHERE cc.user_openid = ?
       ORDER BY cc.checkin_date DESC
       LIMIT 10`
    ).all(user_openid);

    res.json({
      code: 0,
      data: {
        total_days: totalDays.cnt,
        streak_days: streak,
        monthly_days: monthlyDays.cnt,
        recent_checkins: recentCheckins,
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

/**
 * 计算连续打卡天数
 */
function calculateStreak(db, user_openid) {
  const dates = db.prepare(
    `SELECT DISTINCT checkin_date
     FROM couple_checkins
     WHERE user_openid = ?
     ORDER BY checkin_date DESC
     LIMIT 60`
  ).all(user_openid).map(r => r.checkin_date);

  if (dates.length === 0) return 0;

  let streak = 1;
  const today = new Date().toISOString().split('T')[0];

  // 检查今天是否打卡
  if (dates[0] !== today) {
    // 检查昨天
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dates[0] !== yesterday) {
      return 0; // 昨天也没打卡，连续断了
    }
  }

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev - curr) / 86400000;
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 获取情侣日历数据
 * GET /api/checkin/calendar?user_openid=xxx&year=2026&month=6
 */
router.get('/calendar', (req, res) => {
  try {
    const db = getDatabase();
    const { user_openid, year, month } = req.query;

    if (!user_openid) {
      return res.status(400).json({ code: 400, message: '缺少用户标识' });
    }

    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-31`;

    const checkins = db.prepare(
      `SELECT cc.checkin_date, cc.note, a.title, a.icon
       FROM couple_checkins cc
       LEFT JOIN activities a ON cc.activity_id = a.id
       WHERE cc.user_openid = ? AND cc.checkin_date >= ? AND cc.checkin_date <= ?
       ORDER BY cc.checkin_date`
    ).all(user_openid, startDate, endDate);

    // 转化为日期->数据映射
    const calendar = {};
    for (const c of checkins) {
      calendar[c.checkin_date] = {
        noted: !!c.note,
        title: c.title,
        icon: c.icon,
      };
    }

    // 生成当月所有日期
    const daysInMonth = new Date(y, m, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day: d,
        weekday: new Date(y, m - 1, d).getDay(),
        checked: !!calendar[dateStr],
        data: calendar[dateStr] || null,
      });
    }

    res.json({
      code: 0,
      data: {
        year: y,
        month: m,
        days_in_month: daysInMonth,
        checkin_count: checkins.length,
        days,
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
