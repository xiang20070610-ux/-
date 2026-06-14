/**
 * 分类活动列表页
 */
const app = getApp();
const { activityApi } = require('../../utils/api');
const storage = require('../../utils/storage');

Page({
  data: {
    darkMode: false,
    categoryId: 0,
    mood: '',
    categoryInfo: {},
    activityList: [],
    favoriteIds: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    hasMore: false,
    loading: true,
    loadingMore: false,
  },

  onLoad(options) {
    const categoryId = parseInt(options.category_id) || 1;
    const mood = options.mood || '';
    this.setData({
      categoryId,
      mood,
      darkMode: app.globalData?.darkMode || false,
    });

    this.loadCategoryInfo();
    this.loadActivities();
    this.loadFavoriteIds();
  },

  onShow() {
    this.setData({ darkMode: app.globalData?.darkMode || false });
    this.loadFavoriteIds();
  },

  /** 加载分类信息 */
  async loadCategoryInfo() {
    try {
      const res = await activityApi.getCategories();
      if (res.code === 0) {
        const cat = res.data.find(c => c.id === this.data.categoryId);
        if (cat) {
          this.setData({ categoryInfo: cat });
          wx.setNavigationBarTitle({ title: cat.name });
        }
      }
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  },

  /** 加载活动列表 */
  async loadActivities() {
    try {
      const res = await activityApi.getList({
        category_id: this.data.categoryId,
        mood: this.data.mood || undefined,
        page: this.data.page,
        page_size: this.data.pageSize,
      });

      if (res.code === 0) {
        const { list, total } = res.data;
        const favIds = this.data.favoriteIds;
        const markedList = list.map(item => ({
          ...item,
          _isFav: favIds.indexOf(item.id) !== -1,
        }));
        this.setData({
          activityList: this.data.page === 1 ? markedList : [...this.data.activityList, ...markedList],
          totalCount: total,
          hasMore: this.data.activityList.length + markedList.length < total,
          loading: false,
          loadingMore: false,
        });
      }
    } catch (err) {
      console.error('加载活动失败:', err);
      this.setData({ loading: false, loadingMore: false });
    }
  },

  /** 加载更多 */
  loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return;
    this.setData({ page: this.data.page + 1, loadingMore: true }, () => {
      this.loadActivities();
    });
  },

  /** 加载收藏ID列表 */
  loadFavoriteIds() {
    const ids = storage.get('favorite_ids', []);
    this.setData({ favoriteIds: ids });
  },

  /** 点击活动卡片 */
  onActivityTap(e) {
    const { activity } = e.detail;
    if (!activity) return;

    // 记录浏览
    activityApi.recordView(activity.id, app.getUserId()).catch(() => {});

    // 跳转到灵感页展示
    wx.navigateTo({
      url: `/pages/inspire/inspire?activityId=${activity.id}`,
    });
  },

  /** 收藏操作 */
  async onActivityFavorite(e) {
    const { activity, isFavorited } = e.detail;
    const userId = app.getUserId();
    const favIds = [...this.data.favoriteIds];

    try {
      if (isFavorited) {
        await activityApi.removeFavorite(activity.id, userId);
        const idx = favIds.indexOf(activity.id);
        if (idx !== -1) favIds.splice(idx, 1);
        wx.showToast({ title: '已取消收藏', icon: 'none' });
      } else {
        await activityApi.addFavorite(activity.id, userId);
        favIds.push(activity.id);
        wx.showToast({ title: '已收藏', icon: 'none' });
      }
      this.setData({ favoriteIds: favIds });
      storage.set('favorite_ids', favIds);
    } catch (err) {
      console.error('收藏操作失败:', err);
    }
  },

  /** 下拉刷新 */
  onPullDownRefresh() {
    this.setData({ page: 1 }, () => {
      this.loadActivities().then(() => {
        wx.stopPullDownRefresh();
      });
    });
  },

  /** 分享 */
  onShareAppMessage() {
    return {
      title: `随机岛 · ${this.data.categoryInfo.name} - 发现有趣的活动`,
      path: `/pages/category/category?category_id=${this.data.categoryId}`,
    };
  },
});
