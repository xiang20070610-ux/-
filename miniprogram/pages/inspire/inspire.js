/**
 * AI 灵感页面
 * 随机活动推荐 + DeepSeek AI 生成
 */
const app = getApp();
const { activityApi, aiApi } = require('../../utils/api');
const { MOOD_OPTIONS } = require('../../utils/util');
const storage = require('../../utils/storage');

Page({
  data: {
    darkMode: false,
    moodOptions: MOOD_OPTIONS,
    selectedMood: '',
    currentActivity: null,
    currentSource: 'random', // 'random' | 'ai'
    loading: false,
    isFavorited: false,
    historyList: [],
  },

  onLoad(options) {
    this.setData({
      darkMode: app.globalData?.darkMode || false,
      selectedMood: options.mood || app.globalData.selectedMood || '',
    });

    this.loadHistory();
    this.fetchRandomActivity();
  },

  onShow() {
    this.setData({ darkMode: app.globalData?.darkMode || false });
  },

  /** 选择心情 */
  onSelectMood(e) {
    const mood = e.currentTarget.dataset.mood;
    this.setData({
      selectedMood: this.data.selectedMood === mood ? '' : mood,
    });
  },

  /** 获取随机活动 */
  async fetchRandomActivity() {
    this.setData({ loading: true });
    try {
      const params = {};
      if (this.data.selectedMood) params.mood = this.data.selectedMood;
      if (this.data.currentActivity) params.exclude_id = this.data.currentActivity.id;

      const res = await activityApi.getRandom(params);
      if (res.code === 0 && res.data) {
        this.setActivity(res.data, 'random');
      }
    } catch (err) {
      console.error('获取随机活动失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  /** AI 生成灵感 */
  async onAIGenerate() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const res = await aiApi.generate({
        mood: this.data.selectedMood || '开心',
        category: '',
        count: 3,
      });

      if (res.code === 0 && res.data && res.data.length > 0) {
        // 随机选一个
        const idx = Math.floor(Math.random() * res.data.length);
        this.setActivity(res.data[idx], 'ai');
      } else if (res.code === 1 && res.data) {
        // 降级建议
        const idx = Math.floor(Math.random() * res.data.length);
        this.setActivity(res.data[idx], 'ai');
        wx.showToast({ title: res.message || 'AI暂不可用', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: 'AI服务出错', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  /** 设置当前活动 */
  setActivity(activity, source) {
    this.setData({
      currentActivity: activity,
      currentSource: source,
    });

    // 添加到历史
    this.addToHistory(activity);

    // 检查是否已收藏
    this.checkFavorite(activity.id);

    // 记录浏览
    activityApi.recordView(activity.id, app.getUserId()).catch(() => {});
  },

  /** 换一个 */
  onRandomActivity() {
    if (this.data.loading) return;

    // 触觉反馈
    wx.vibrateShort({ type: 'light' });

    // 随机切换来源
    if (Math.random() > 0.6) {
      this.onAIGenerate();
    } else {
      this.fetchRandomActivity();
    }
  },

  /** 收藏 */
  async onFavorite() {
    if (!this.data.currentActivity) return;
    const activityId = this.data.currentActivity.id;
    const userId = app.getUserId();

    try {
      if (this.data.isFavorited) {
        await activityApi.removeFavorite(activityId, userId);
        this.setData({ isFavorited: false });
        wx.showToast({ title: '已取消收藏', icon: 'none' });
      } else {
        await activityApi.addFavorite(activityId, userId);
        this.setData({ isFavorited: true });
        wx.showToast({ title: '已收藏 ❤️', icon: 'none' });
      }
    } catch (err) {
      console.error('收藏操作失败:', err);
    }
  },

  /** 标记完成 */
  onComplete() {
    if (!this.data.currentActivity) return;
    const activityId = this.data.currentActivity.id;

    wx.showModal({
      title: '完成打卡',
      content: '确定已完成这项活动吗？',
      confirmText: '已完成 ✅',
      success: async (res) => {
        if (res.confirm) {
          try {
            await activityApi.completeActivity(activityId, app.getUserId());
            wx.showToast({ title: '太棒了！🌟', icon: 'none' });
          } catch (err) {
            console.error('记录失败:', err);
          }
        }
      },
    });
  },

  /** 分享 */
  onShare() {
    if (!this.data.currentActivity) return;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });
  },

  /** 检查收藏状态 */
  checkFavorite(activityId) {
    const favs = storage.get('favorite_ids', []);
    this.setData({ isFavorited: favs.includes(activityId) });
  },

  /** 添加到历史记录 */
  addToHistory(activity) {
    let history = this.data.historyList;
    // 去重
    history = history.filter(h => h.id !== activity.id);
    history.unshift({ ...activity, timestamp: Date.now() });
    // 保留最近10条
    history = history.slice(0, 10);
    this.setData({ historyList: history });
    storage.set('inspire_history', history.slice(0, 20));
  },

  /** 加载历史 */
  loadHistory() {
    const history = storage.get('inspire_history', []);
    this.setData({ historyList: history.slice(0, 10) });
  },

  /** 点击历史记录 */
  onHistoryTap(e) {
    const id = e.currentTarget.dataset.id;
    const activity = this.data.historyList.find(h => h.id == id);
    if (activity) {
      this.setActivity(activity, activity.is_ai ? 'ai' : 'random');
    }
  },

  onShareAppMessage() {
    const activity = this.data.currentActivity;
    return {
      title: activity ? `试试这个: ${activity.title}` : '随机岛 - 给你的生活一点灵感',
      path: '/pages/inspire/inspire',
    };
  },
});
