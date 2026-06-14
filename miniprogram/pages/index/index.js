/**
 * 首页
 */
const app = getApp();
const { MOOD_OPTIONS } = require('../../utils/util');

Page({
  data: {
    darkMode: false,
    moodOptions: MOOD_OPTIONS,
    selectedMood: '',
  },

  onLoad() {
    this.setData({ darkMode: app.globalData?.darkMode || false });
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
    // 保存选择的心情到全局
    app.globalData.selectedMood = this.data.selectedMood === mood ? '' : mood;
  },

  /** 跳转到分类页 */
  navigateToCategory(e) {
    const categoryId = e.currentTarget.dataset.category;
    const mood = this.data.selectedMood;
    let url = `/pages/category/category?category_id=${categoryId}`;
    if (mood) url += `&mood=${mood}`;
    wx.navigateTo({ url });
  },

  /** 跳转到发现身边（地图页） */
  navigateToMap() {
    wx.navigateTo({ url: '/pages/map/map' });
  },

  /** 跳转到抽签页 */
  navigateToLottery() {
    wx.navigateTo({ url: '/pages/lottery/lottery' });
  },

  /** 跳转到AI灵感页 */
  navigateToInspire() {
    const mood = this.data.selectedMood;
    let url = '/pages/inspire/inspire';
    if (mood) url += `?mood=${mood}`;
    wx.navigateTo({ url });
  },

  /** 跳转到打卡页 */
  navigateToCheckin() {
    wx.navigateTo({ url: '/pages/checkin/checkin' });
  },

  /** 跳转到统计页 */
  navigateToStats() {
    wx.switchTab({ url: '/pages/stats/stats' });
  },

  /** 分享 */
  onShareAppMessage() {
    return {
      title: '随机岛 - 给你的生活一点灵感',
      path: '/pages/index/index',
    };
  },
});
