const app = getApp();
const { activityApi } = require('../../utils/api');

Page({
  data: {
    darkMode: false,
    historyList: [],
    loading: true,
  },

  onLoad() {
    this.setData({ darkMode: app.globalData?.darkMode || false });
  },

  onShow() {
    this.setData({ darkMode: app.globalData?.darkMode || false });
    this.loadHistory();
  },

  async loadHistory() {
    this.setData({ loading: true });
    try {
      const res = await activityApi.getHistory({
        user_openid: app.getUserId(),
        page_size: 50,
      });
      if (res.code === 0) {
        this.setData({
          historyList: res.data.list,
          loading: false,
        });
      }
    } catch (err) {
      // 降级：使用本地缓存
      const local = require('../../utils/storage').get('inspire_history', []);
      this.setData({ historyList: local, loading: false });
    }
  },

  onActivityTap(e) {
    const { activity } = e.detail;
    if (activity) {
      wx.navigateTo({ url: `/pages/inspire/inspire?activityId=${activity.id}` });
    }
  },

  onClearHistory() {
    wx.showModal({
      title: '清空记录',
      content: '确定要清空所有浏览记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ historyList: [] });
          require('../../utils/storage').remove('inspire_history');
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      },
    });
  },
});
