/**
 * 活动卡片组件
 * 可复用的活动展示卡片
 */
const app = getApp();

Component({
  properties: {
    // 活动数据对象
    activity: {
      type: Object,
      value: {},
      observer: function (newVal) {
        if (newVal && newVal.tags) {
          this.setData({
            tags: typeof newVal.tags === 'string'
              ? JSON.parse(newVal.tags)
              : newVal.tags,
          });
        }
      }
    },
    // 是否显示收藏按钮
    showFavorite: {
      type: Boolean,
      value: true,
    },
    // 是否已收藏
    isFavorited: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    darkMode: false,
    tags: [],
  },

  lifetimes: {
    attached() {
      this.setData({ darkMode: app.globalData?.darkMode || false });
    },
  },

  methods: {
    /** 点击卡片 */
    onTap() {
      this.triggerEvent('tap', { activity: this.properties.activity });
    },

    /** 点击收藏 */
    onFavorite() {
      this.triggerEvent('favorite', {
        activity: this.properties.activity,
        isFavorited: this.properties.isFavorited,
      });
    },
  },
});
