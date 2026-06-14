/**
 * API 请求模块
 */
const API_BASE = 'https://random-island.onrender.com/api';
const USER_ID = localStorage.getItem('random_island_uid') || (() => {
  const uid = 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('random_island_uid', uid);
  return uid;
})();

async function api(path, options = {}) {
  const { method = 'GET', data = null } = options;
  const config = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (data) config.body = JSON.stringify(data);

  const res = await fetch(API_BASE + path, config);
  return res.json();
}

const API = {
  getCategories: () => api('/activities/categories'),
  getActivities: (params) => {
    const qs = new URLSearchParams(params).toString();
    return api('/activities?' + qs);
  },
  getRandom: (params) => {
    const qs = new URLSearchParams(params).toString();
    return api('/activities/random?' + qs);
  },
  addFavorite: (activityId) => api(`/activities/${activityId}/favorite`, { method: 'POST', data: { user_openid: USER_ID } }),
  removeFavorite: (activityId) => api(`/activities/${activityId}/favorite`, { method: 'DELETE', data: { user_openid: USER_ID } }),
  getFavorites: () => api('/activities/favorites/list?user_openid=' + USER_ID),
  recordView: (activityId) => api(`/activities/${activityId}/view`, { method: 'POST', data: { user_openid: USER_ID } }),
  getHistory: () => api('/activities/history/list?user_openid=' + USER_ID),
  completeActivity: (activityId) => api(`/activities/${activityId}/complete`, { method: 'POST', data: { user_openid: USER_ID } }),
  aiGenerate: (params) => api('/ai/generate', { method: 'POST', data: params }),
  getNearby: (params) => {
    const qs = new URLSearchParams(params).toString();
    return api('/map/nearby?' + qs);
  },
  checkin: (note) => api('/checkin', { method: 'POST', data: { user_openid: USER_ID, note } }),
  getCheckinStats: () => api('/checkin/stats?user_openid=' + USER_ID),
  getCalendar: (year, month) => api(`/checkin/calendar?user_openid=${USER_ID}&year=${year}&month=${month}`),
  getStatsOverview: () => api('/stats/overview?user_openid=' + USER_ID),
};
