const app = getApp();
const storage = require('../../utils/storage');

Page({
  data: {
    darkMode: false,
    notifyEnabled: true,
    cacheSize: '0KB',
  },

  onLoad() {
    this.setData({
      darkMode: app.globalData?.darkMode || false,
      notifyEnabled: storage.get('notify_enabled', true),
    });
    this.calcCacheSize();
  },

  onShow() {
    this.setData({ darkMode: app.globalData?.darkMode || false });
    this.calcCacheSize();
  },

  /** 切换深色模式 */
  onToggleDarkMode(e) {
    const value = e.detail.value;
    app.toggleDarkMode();
    this.setData({ darkMode: value });

    // 提示需要重启生效
    wx.showToast({ title: '深色模式已切换', icon: 'none' });
  },

  /** 切换通知 */
  onToggleNotify(e) {
    const value = e.detail.value;
    storage.set('notify_enabled', value);
    this.setData({ notifyEnabled: value });
  },

  /** 清除缓存 */
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定清除所有本地缓存数据吗？（不会影响服务器数据）',
      success: (res) => {
        if (res.confirm) {
          storage.clearAll();
          this.calcCacheSize();
          wx.showToast({ title: '缓存已清除', icon: 'success' });
        }
      },
    });
  },

  /** 计算缓存大小 */
  calcCacheSize() {
    const info = storage.getInfo();
    const sizeKB = Math.round(info.currentSize || 0);
    this.setData({ cacheSize: sizeKB + 'KB' });
  },

  /** 意见反馈 */
  onFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '感谢你的使用！请通过以下方式联系我们：\n\n📧 moment@example.com',
      showCancel: false,
      confirmText: '知道了',
    });
  },

  /** 关于 */
  onAbout() {
    wx.showModal({
      title: '关于随机岛',
      content: '随机岛 v1.0.0\n\n给你的生活一点灵感。\n\n精选300+活动建议，\nAI生成灵感，\n发现身边好去处。',
      showCancel: false,
      confirmText: '好的',
    });
  },
});
