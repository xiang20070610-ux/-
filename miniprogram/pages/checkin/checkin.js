/**
 * 情侣打卡页
 * 今日打卡 + 情侣日历
 */
const app = getApp();
const { checkinApi, activityApi } = require('../../utils/api');
const storage = require('../../utils/storage');

Page({
  data: {
    darkMode: false,
    stats: {},
    checkedToday: false,
    calendarYear: 2026,
    calendarMonth: 6,
    calendarDays: [],
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
  },

  onLoad() {
    const now = new Date();
    this.setData({
      darkMode: app.globalData?.darkMode || false,
      calendarYear: now.getFullYear(),
      calendarMonth: now.getMonth() + 1,
    });

    this.loadStats();
    this.loadCalendar();
    this.checkTodayStatus();
  },

  onShow() {
    this.setData({ darkMode: app.globalData?.darkMode || false });
    this.loadStats();
    this.loadCalendar();
    this.checkTodayStatus();
  },

  /** 加载打卡统计 */
  async loadStats() {
    try {
      const res = await checkinApi.getStats(app.getUserId());
      if (res.code === 0) {
        this.setData({ stats: res.data });
      }
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  },

  /** 检查今日是否已打卡 */
  checkTodayStatus() {
    const today = new Date().toISOString().split('T')[0];
    const todayChecked = storage.get(`checkin_${today}`, false);
    this.setData({ checkedToday: todayChecked });
  },

  /** 今日打卡 */
  async onCheckin() {
    if (this.data.checkedToday) {
      wx.showToast({ title: '今天已经打卡啦 ❤️', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '今日打卡',
      content: '确认今天完成了一起活动吗？',
      editable: true,
      placeholderText: '写一句备注...(可选)',
      confirmText: '打卡 💝',
      success: async (res) => {
        if (res.confirm) {
          try {
            const note = res.content || '';
            await checkinApi.checkin(app.getUserId(), null, note || undefined);

            const today = new Date().toISOString().split('T')[0];
            storage.set(`checkin_${today}`, true);
            this.setData({ checkedToday: true });
            wx.showToast({ title: '打卡成功！❤️', icon: 'none' });
            wx.vibrateLong();

            // 刷新统计数据
            this.loadStats();
            this.loadCalendar();
          } catch (err) {
            wx.showToast({ title: '打卡失败，请重试', icon: 'none' });
          }
        }
      },
    });
  },

  /** 加载日历 */
  async loadCalendar() {
    try {
      const res = await checkinApi.getCalendar(
        app.getUserId(),
        this.data.calendarYear,
        this.data.calendarMonth
      );

      if (res.code === 0) {
        const { days } = res.data;
        const today = new Date().toISOString().split('T')[0];

        // 计算前后填充
        const firstDay = days[0]?.weekday || 0;
        const totalDays = days.length;

        const calendarDays = [];

        // 前填充（上个月日期）
        for (let i = 0; i < firstDay; i++) {
          calendarDays.push({
            day: '',
            date: '',
            weekday: i,
            checked: false,
            is_today: false,
            currentMonth: false,
          });
        }

        // 当月日期
        for (const day of days) {
          calendarDays.push({
            ...day,
            is_today: day.date === today,
            currentMonth: true,
          });
        }

        // 后填充
        const remaining = 7 - (calendarDays.length % 7);
        if (remaining < 7) {
          for (let i = 0; i < remaining; i++) {
            calendarDays.push({
              day: '',
              date: '',
              checked: false,
              is_today: false,
              currentMonth: false,
            });
          }
        }

        this.setData({ calendarDays });
      }
    } catch (err) {
      console.error('加载日历失败:', err);
    }
  },

  /** 上一个月 */
  onPrevMonth() {
    let { calendarYear, calendarMonth } = this.data;
    if (calendarMonth === 1) {
      this.setData({ calendarYear: calendarYear - 1, calendarMonth: 12 });
    } else {
      this.setData({ calendarMonth: calendarMonth - 1 });
    }
    this.loadCalendar();
  },

  /** 下一个月 */
  onNextMonth() {
    let { calendarYear, calendarMonth } = this.data;
    if (calendarMonth === 12) {
      this.setData({ calendarYear: calendarYear + 1, calendarMonth: 1 });
    } else {
      this.setData({ calendarMonth: calendarMonth + 1 });
    }
    this.loadCalendar();
  },

  /** 点击日期 */
  onDayTap(e) {
    const { date, checked } = e.currentTarget.dataset;
    if (!date) return;

    if (checked) {
      wx.showToast({ title: `${date} 已打卡 ✅`, icon: 'none' });
    } else {
      wx.showToast({ title: `${date} 未打卡`, icon: 'none' });
    }
  },

  onShareAppMessage() {
    return {
      title: `我们已经连续打卡${this.data.stats.streak_days || 0}天！💝`,
      path: '/pages/checkin/checkin',
    };
  },
});
