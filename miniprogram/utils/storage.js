/**
 * 本地缓存工具
 * 封装 wx.getStorageSync / wx.setStorageSync
 */

const STORAGE_PREFIX = 'moment_';

/**
 * 设置缓存
 */
function set(key, value) {
  try {
    wx.setStorageSync(STORAGE_PREFIX + key, value);
    return true;
  } catch (e) {
    console.error('Storage set error:', e);
    return false;
  }
}

/**
 * 获取缓存
 */
function get(key, defaultValue = null) {
  try {
    const value = wx.getStorageSync(STORAGE_PREFIX + key);
    return value !== '' ? value : defaultValue;
  } catch (e) {
    console.error('Storage get error:', e);
    return defaultValue;
  }
}

/**
 * 删除缓存
 */
function remove(key) {
  try {
    wx.removeStorageSync(STORAGE_PREFIX + key);
    return true;
  } catch (e) {
    console.error('Storage remove error:', e);
    return false;
  }
}

/**
 * 清空所有 moment 前缀的缓存
 */
function clearAll() {
  try {
    const info = wx.getStorageInfoSync();
    const keys = info.keys.filter(k => k.startsWith(STORAGE_PREFIX));
    keys.forEach(k => wx.removeStorageSync(k));
    return true;
  } catch (e) {
    console.error('Storage clear error:', e);
    return false;
  }
}

/**
 * 获取缓存信息
 */
function getInfo() {
  try {
    return wx.getStorageInfoSync();
  } catch (e) {
    return { keys: [], currentSize: 0, limitSize: 0 };
  }
}

/**
 * 设置带过期时间的缓存
 * @param {string} key
 * @param {*} value
 * @param {number} expireMs 过期时间（毫秒）
 */
function setWithExpire(key, value, expireMs) {
  const data = {
    value,
    expire_at: Date.now() + expireMs,
  };
  return set(key, data);
}

/**
 * 获取带过期时间的缓存
 */
function getWithExpire(key, defaultValue = null) {
  const data = get(key);
  if (!data) return defaultValue;

  if (data.expire_at && Date.now() > data.expire_at) {
    remove(key);
    return defaultValue;
  }

  return data.value !== undefined ? data.value : defaultValue;
}

module.exports = {
  set,
  get,
  remove,
  clearAll,
  getInfo,
  setWithExpire,
  getWithExpire,
};
