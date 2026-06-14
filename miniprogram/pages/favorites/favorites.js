const app = getApp();
const { activityApi } = require('../../utils/api');
const storage = require('../../utils/storage');

Page({
  data: {
    darkMode: false,
    favoriteList: [],
    favoriteIds: [],
    page: 1,
    hasMore: false,
    loading: true,
    loadingMore: false,
  },

  onLoad() {
    this.setData({ darkMode: app.globalData?.darkMode || false });
  },

  onShow() {
    this.setData({ darkMode: app.globalData?.darkMode || false, page: 1 });
    this.loadFavorites();
  },

  async loadFavorites() {
    this.setData({ loading: true });
    try {
      const res = await activityApi.getFavorites({
        user_openid: app.getUserId(),
        page: this.data.page,
        page_size: 20,
      });
      if (res.code === 0) {
        const { list, total } = res.data;
        this.setData({
          favoriteList: this.data.page === 1 ? list : [...this.data.favoriteList, ...list],
          favoriteIds: list.map(i => i.id),
          hasMore: this.data.favoriteList.length + list.length < total,
          loading: false,
          loadingMore: false,
        });
      }
    } catch (err) {
      this.setData({ loading: false, loadingMore: false });
    }
  },

  loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return;
    this.setData({ page: this.data.page + 1, loadingMore: true }, () => {
      this.loadFavorites();
    });
  },

  onActivityTap(e) {
    const { activity } = e.detail;
    if (activity) {
      wx.navigateTo({ url: `/pages/inspire/inspire?activityId=${activity.id}` });
    }
  },

  async onRemoveFavorite(e) {
    const { activity } = e.detail;
    try {
      await activityApi.removeFavorite(activity.id, app.getUserId());
      const list = this.data.favoriteList.filter(a => a.id !== activity.id);
      this.setData({ favoriteList: list });
      // 更新本地存储
      const ids = storage.get('favorite_ids', []).filter(id => id !== activity.id);
      storage.set('favorite_ids', ids);
      wx.showToast({ title: '已取消收藏', icon: 'none' });
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },
});
