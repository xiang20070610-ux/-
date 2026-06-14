/**
 * 活动抽签页面
 * 随机滚动后给出一条活动建议
 */
const app = getApp();
const { activityApi } = require('../../utils/api');
const { formatTime } = require('../../utils/util');
const storage = require('../../utils/storage');

Page({
  data: {
    darkMode: false,
    categories: [],
    selectedCategory: 0, // 0=全部随机
    spinning: false,
    displayText: '?',
    displayIcon: '🎰',
    result: null,
    historyList: [],
    spinTimer: null,
    activityPool: [], // 活动池
  },

  onLoad() {
    this.setData({ darkMode: app.globalData?.darkMode || false });
    this.loadCategories();
    this.loadHistory();
  },

  onShow() {
    this.setData({ darkMode: app.globalData?.darkMode || false });
  },

  /** 加载分类 */
  async loadCategories() {
    try {
      const res = await activityApi.getCategories();
      if (res.code === 0) {
        this.setData({ categories: res.data });
      }
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  },

  /** 选择分类 */
  onSelectCategory(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    this.setData({ selectedCategory: id });
    wx.vibrateShort({ type: 'light' });
  },

  /** 开始抽签 */
  async onStartLottery() {
    if (this.data.spinning) return;
    wx.vibrateShort({ type: 'medium' });

    this.setData({ spinning: true, result: null });

    // 先加载活动池
    try {
      const params = {};
      if (this.data.selectedCategory > 0) {
        params.category_id = this.data.selectedCategory;
      }
      params.page_size = 50;

      const res = await activityApi.getList(params);
      if (res.code === 0 && res.data.list.length > 0) {
        this.setData({ activityPool: res.data.list });
        this.startSpinning();
      } else {
        wx.showToast({ title: '没有可选活动', icon: 'none' });
        this.setData({ spinning: false });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ spinning: false });
    }
  },

  /** 开始滚动动画 */
  startSpinning() {
    const pool = this.data.activityPool;
    if (pool.length === 0) {
      this.setData({ spinning: false });
      return;
    }

    let count = 0;
    const totalFlashes = 15 + Math.floor(Math.random() * 10); // 15~24次滚动
    let interval = 80;
    let flashed = [];

    const spin = () => {
      // 随机选一个显示
      let idx;
      do {
        idx = Math.floor(Math.random() * pool.length);
      } while (flashed.length > 2 && flashed.slice(-2).every(i => i === idx));

      flashed.push(idx);
      if (flashed.length > 10) flashed.shift();

      const item = pool[idx];
      this.setData({
        displayText: item.title,
        displayIcon: item.icon || '🎯',
      });

      count++;

      if (count < totalFlashes) {
        // 逐渐减速
        if (count > totalFlashes * 0.6) {
          interval += 40;
        } else if (count > totalFlashes * 0.3) {
          interval += 15;
        }
        wx.vibrateShort({ type: 'light' });
        this.data.spinTimer = setTimeout(spin, interval);
      } else {
        // 停止 - 显示最终结果
        const finalItem = pool[Math.floor(Math.random() * pool.length)];
        this.setData({
          spinning: false,
          displayText: finalItem.title,
          displayIcon: finalItem.icon || '🎯',
          result: {
            ...finalItem,
            tags: typeof finalItem.tags === 'string'
              ? JSON.parse(finalItem.tags)
              : (finalItem.tags || []),
          },
        });

        // 加入历史
        this.addToHistory(finalItem);

        // 强震动反馈
        wx.vibrateLong();
      }
    };

    spin();
  },

  /** 接受结果 */
  onAccept() {
    if (!this.data.result) return;

    // 记录完成
    activityApi.completeActivity(this.data.result.id, app.getUserId())
      .then(() => {
        wx.showToast({ title: '太棒了！去行动吧 🎉', icon: 'none' });
      })
      .catch(() => {
        wx.showToast({ title: '已记录 ✅', icon: 'success' });
      });
  },

  /** 添加到抽签历史 */
  addToHistory(item) {
    let history = this.data.historyList;
    history.unshift({
      ...item,
      time: formatTime(new Date(), 'MM-DD HH:mm'),
    });
    history = history.slice(0, 20);
    this.setData({ historyList: history });
    storage.set('lottery_history', history);
  },

  /** 加载历史 */
  loadHistory() {
    const history = storage.get('lottery_history', []);
    this.setData({ historyList: history.slice(0, 20) });
  },

  onUnload() {
    if (this.data.spinTimer) {
      clearTimeout(this.data.spinTimer);
    }
  },

  onShareAppMessage() {
    const result = this.data.result;
    return {
      title: result ? `今天抽中了：${result.title}` : '活动抽签 - 治好选择困难症',
      path: '/pages/lottery/lottery',
    };
  },
});
