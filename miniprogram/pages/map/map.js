/**
 * 发现身边 - 地图页
 * 获取定位并推荐附近场所
 */
const app = getApp();
const { mapApi } = require('../../utils/api');

Page({
  data: {
    darkMode: false,
    lat: 0,
    lng: 0,
    locationText: '点击获取位置',
    hasLocation: false,
    selectedType: 'coffee',
    poiList: [],
    poiIcon: '☕',
    loading: false,
    isMockData: false,
    poiTypes: [
      { type: 'coffee', name: '咖啡馆', icon: '☕' },
      { type: 'park', name: '公园', icon: '🌿' },
      { type: 'mall', name: '商场', icon: '🛍️' },
      { type: 'bookstore', name: '书店', icon: '📚' },
      { type: 'museum', name: '博物馆', icon: '🏛️' },
      { type: 'restaurant', name: '餐厅', icon: '🍽️' },
      { type: 'cinema', name: '电影院', icon: '🎬' },
      { type: 'gym', name: '健身房', icon: '💪' },
    ],
  },

  onLoad() {
    this.setData({ darkMode: app.globalData?.darkMode || false });
    this.getLocation();
  },

  onShow() {
    this.setData({ darkMode: app.globalData?.darkMode || false });
    if (this.data.lat && this.data.lng) {
      this.fetchNearby();
    }
  },

  /** 获取用户位置 */
  getLocation() {
    const that = this;
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        const { latitude, longitude } = res;
        that.setData({
          lat: latitude,
          lng: longitude,
          hasLocation: true,
          locationText: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
        app.globalData.currentLocation = { lat: latitude, lng: longitude };
        that.fetchNearby();
      },
      fail(err) {
        console.warn('获取位置失败:', err);
        that.setData({
          locationText: '无法获取位置（使用默认位置）',
          lat: 39.9042,  // 默认：北京
          lng: 116.4074,
          hasLocation: true,
        });
        that.fetchNearby();
      },
    });
  },

  /** 手动获取位置 */
  onGetLocation() {
    this.setData({ locationText: '定位中...' });
    this.getLocation();
  },

  /** 选择地点类型 */
  onSelectType(e) {
    const type = e.currentTarget.dataset.type;
    const poiType = this.data.poiTypes.find(p => p.type === type);
    this.setData({
      selectedType: type,
      poiIcon: poiType ? poiType.icon : '📍',
    });
    wx.vibrateShort({ type: 'light' });
    this.fetchNearby();
  },

  /** 获取附近推荐 */
  async fetchNearby() {
    if (!this.data.hasLocation) return;
    this.setData({ loading: true });

    try {
      const res = await mapApi.getNearby({
        lat: this.data.lat,
        lng: this.data.lng,
        type: this.data.selectedType,
        radius: 5000,
      });

      if (res.data && res.data.list) {
        // 格式化距离文本（WXML 不支持 .toFixed()）
        const list = res.data.list.map(item => ({
          ...item,
          distanceText: item.distance < 1000
            ? item.distance + 'm'
            : (item.distance / 1000).toFixed(1) + 'km'
        }));
        this.setData({
          poiList: list,
          isMockData: res.data.source === 'mock',
        });
      }
      if (res.code === 1) {
        this.setData({ isMockData: true });
      }
    } catch (err) {
      wx.showToast({ title: '获取附近信息失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  /** 导航到POI */
  onNavigateToPOI(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;

    wx.showModal({
      title: item.name,
      content: `地址: ${item.address}\n距离: ${item.distance < 1000 ? item.distance + 'm' : (item.distance / 1000).toFixed(1) + 'km'}`,
      confirmText: '打开地图',
      success(res) {
        if (res.confirm) {
          wx.openLocation({
            latitude: item.latitude,
            longitude: item.longitude,
            name: item.name,
            address: item.address,
            scale: 15,
          });
        }
      },
    });
  },

  onShareAppMessage() {
    return {
      title: '发现身边的好去处',
      path: '/pages/map/map',
    };
  },
});
