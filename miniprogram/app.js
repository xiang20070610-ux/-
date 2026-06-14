/**
 * 随机岛小程序 - 入口文件
 * App() 注册小程序
 */
const storage = require('./utils/storage');

App({
  globalData: {
    // 后端API地址（生产环境改为你的 Render 地址）
    apiBaseUrl: 'https://你的域名.onrender.com/api',
    // 用户唯一标识（模拟，生产环境应通过wx.login获取）
    userOpenid: '',
    // 深色模式
    darkMode: false,
    // 系统信息
    systemInfo: null,
    // 当前位置
    currentLocation: null,
  },

  onLaunch() {
    console.log('✨ 随机岛小程序启动');

    // 获取系统信息
    const windowInfo = wx.getWindowInfo();
    const deviceInfo = wx.getDeviceInfo();
    const appBaseInfo = wx.getAppBaseInfo();
    this.globalData.systemInfo = {
      ...windowInfo,
      ...deviceInfo,
      ...appBaseInfo,
      statusBarHeight: windowInfo.statusBarHeight,
      system: deviceInfo.system,
      theme: appBaseInfo.theme,
    };

    // 检测深色模式
    if (appBaseInfo.theme === 'dark') {
      this.globalData.darkMode = true;
    }

    // 读取本地存储
    this.initUserData();

    // 监听主题变化
    wx.onThemeChange((res) => {
      this.globalData.darkMode = res.theme === 'dark';
      console.log('主题切换:', res.theme);
    });
  },

  /**
   * 初始化用户数据
   */
  initUserData() {
    // 获取或生成用户标识
    let openid = storage.get('user_openid');
    if (!openid) {
      openid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      storage.set('user_openid', openid);
    }
    this.globalData.userOpenid = openid;

    // 读取深色模式设置
    const darkMode = storage.get('dark_mode');
    if (darkMode !== null && darkMode !== undefined) {
      this.globalData.darkMode = !!darkMode;
    }
  },

  /**
   * 获取用户OpenID
   */
  getUserId() {
    return this.globalData.userOpenid;
  },

  /**
   * 切换深色模式
   */
  toggleDarkMode() {
    this.globalData.darkMode = !this.globalData.darkMode;
    storage.set('dark_mode', this.globalData.darkMode);
    return this.globalData.darkMode;
  },

  /**
   * 获取API基础地址
   */
  getApiUrl(path) {
    return this.globalData.apiBaseUrl + path;
  },
});
