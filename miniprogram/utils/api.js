/**
 * API 请求工具
 * 封装 wx.request，统一处理错误和响应
 */
const app = getApp();

/**
 * 基础请求方法
 */
function request(url, options = {}) {
  const {
    method = 'GET',
    data = {},
    header = {},
    showLoading = false,
    timeout = 60000,
  } = options;

  const apiUrl = app.getApiUrl(url);

  if (showLoading) {
    wx.showLoading({ title: '加载中...', mask: true });
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl,
      method,
      data,
      timeout,
      header: {
        'content-type': 'application/json',
        ...header,
      },
      success(res) {
        if (showLoading) wx.hideLoading();

        if (res.statusCode === 200) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          wx.showToast({ title: '请先登录', icon: 'none' });
          reject(new Error('未授权'));
        } else {
          const msg = res.data?.message || `请求失败(${res.statusCode})`;
          wx.showToast({ title: msg, icon: 'none' });
          reject(new Error(msg));
        }
      },
      fail(err) {
        if (showLoading) wx.hideLoading();
        const msg = err.errMsg || '网络请求失败';
        wx.showToast({ title: msg, icon: 'none' });
        reject(err);
      },
    });
  });
}

/**
 * GET 请求
 */
function get(url, data = {}, options = {}) {
  return request(url, { ...options, method: 'GET', data });
}

/**
 * POST 请求
 */
function post(url, data = {}, options = {}) {
  return request(url, { ...options, method: 'POST', data });
}

/**
 * DELETE 请求
 */
function del(url, data = {}, options = {}) {
  return request(url, { ...options, method: 'DELETE', data });
}

/* ========== 活动相关 API ========== */
const activityApi = {
  /** 获取分类列表 */
  getCategories: () => get('/activities/categories'),

  /** 获取活动列表 */
  getList: (params) => get('/activities', params),

  /** 获取随机活动 */
  getRandom: (params) => get('/activities/random', params),

  /** 获取活动详情 */
  getDetail: (id) => get(`/activities/${id}`),

  /** 添加收藏 */
  addFavorite: (activityId, userOpenid) =>
    post(`/activities/${activityId}/favorite`, { user_openid: userOpenid }),

  /** 取消收藏 */
  removeFavorite: (activityId, userOpenid) =>
    del(`/activities/${activityId}/favorite`, { user_openid: userOpenid }),

  /** 获取收藏列表 */
  getFavorites: (params) => get('/activities/favorites/list', params),

  /** 记录浏览 */
  recordView: (activityId, userOpenid) =>
    post(`/activities/${activityId}/view`, { user_openid: userOpenid }),

  /** 获取浏览历史 */
  getHistory: (params) => get('/activities/history/list', params),

  /** 记录完成 */
  completeActivity: (activityId, userOpenid, moodAfter, rating) =>
    post(`/activities/${activityId}/complete`, {
      user_openid: userOpenid,
      mood_after: moodAfter,
      rating,
    }),
};

/* ========== AI 相关 API ========== */
const aiApi = {
  /** 生成AI建议 */
  generate: (params) => post('/ai/generate', params),
};

/* ========== 地图相关 API ========== */
const mapApi = {
  /** 获取附近推荐 */
  getNearby: (params) => get('/map/nearby', params),

  /** 获取地点类型 */
  getCategories: () => get('/map/categories'),
};

/* ========== 打卡相关 API ========== */
const checkinApi = {
  /** 打卡 */
  checkin: (userOpenid, activityId, note, photoUrl) =>
    post('/checkin', {
      user_openid: userOpenid,
      activity_id: activityId,
      note,
      photo_url: photoUrl,
    }),

  /** 获取打卡统计 */
  getStats: (userOpenid) => get('/checkin/stats', { user_openid: userOpenid }),

  /** 获取情侣日历 */
  getCalendar: (userOpenid, year, month) =>
    get('/checkin/calendar', { user_openid: userOpenid, year, month }),
};

/* ========== 统计相关 API ========== */
const statsApi = {
  /** 获取综合统计 */
  getOverview: (userOpenid) => get('/stats/overview', { user_openid: userOpenid }),

  /** 获取完成记录 */
  getCompletions: (params) => get('/stats/completions', params),
};

module.exports = {
  request,
  get,
  post,
  del,
  activityApi,
  aiApi,
  mapApi,
  checkinApi,
  statsApi,
};
