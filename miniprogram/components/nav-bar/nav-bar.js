Component({
  properties: {
    title: { type: String, value: '随机岛' },
    showBack: { type: Boolean, value: false },
    showRight: { type: Boolean, value: false },
    rightText: { type: String, value: '' },
  },

  data: {
    statusBarHeight: 0,
    navHeight: 44,
    totalHeight: 0,
    darkMode: false,
  },

  lifetimes: {
    attached() {
      const app = getApp();
      const sysInfo = app.globalData?.systemInfo || {};
      const statusBarHeight = sysInfo.statusBarHeight || wx.getWindowInfo().statusBarHeight || 20;
      const deviceInfo = wx.getDeviceInfo();
      const isIOS = (deviceInfo.system || '').indexOf('iOS') !== -1;
      const navHeight = isIOS ? 44 : 48;

      this.setData({
        statusBarHeight,
        navHeight,
        totalHeight: statusBarHeight + navHeight,
        darkMode: app.globalData?.darkMode || false,
      });
    },
  },

  methods: {
    onBack() {
      wx.navigateBack({ delta: 1 });
    },
    onRight() {
      this.triggerEvent('rightTap');
    },
  },
});
