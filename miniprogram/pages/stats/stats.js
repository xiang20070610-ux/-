/**
 * 我的页面 - 数据统计
 */
const app = getApp();
const { statsApi } = require('../../utils/api');

Page({
  data: {
    darkMode: false,
    overview: {},
    loading: true,
  },

  onLoad() {
    this.setData({ darkMode: app.globalData?.darkMode || false });
    this.loadOverview();
  },

  onShow() {
    this.setData({ darkMode: app.globalData?.darkMode || false });
    this.loadOverview();
  },

  /** 加载综合统计 */
  async loadOverview() {
    this.setData({ loading: true });
    try {
      const res = await statsApi.getOverview(app.getUserId());
      if (res.code === 0) {
        this.setData({ overview: res.data, loading: false });
      }
    } catch (err) {
      console.error('加载统计失败:', err);
      this.setData({ loading: false });
    }
  },

  /** 跳转收藏 */
  navigateToFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' });
  },

  /** 跳转浏览记录 */
  navigateToHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  /** 跳转打卡 */
  navigateToCheckin() {
    wx.navigateTo({ url: '/pages/checkin/checkin' });
  },

  /** 跳转抽签 */
  navigateToLottery() {
    wx.switchTab({ url: '/pages/lottery/lottery' });
  },

  /** 跳转设置 */
  navigateToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  /** 下拉刷新 */
  onPullDownRefresh() {
    this.loadOverview().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onShareAppMessage() {
    return {
      title: '随机岛 - 给你的生活一点灵感',
      path: '/pages/index/index',
    };
  },
});
