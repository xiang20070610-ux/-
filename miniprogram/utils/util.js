/**
 * 通用工具函数
 */

/**
 * 格式化时间
 * @param {Date|string|number} date
 * @param {string} format - 如 'YYYY-MM-DD HH:mm:ss'
 */
function formatTime(date, format = 'YYYY-MM-DD HH:mm') {
  if (!date) return '';
  if (typeof date === 'string') date = new Date(date.replace(/-/g, '/'));
  if (typeof date === 'number') date = new Date(date);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
}

/**
 * 获取相对时间描述
 * @param {string|Date} date
 */
function getRelativeTime(date) {
  if (typeof date === 'string') date = new Date(date.replace(/-/g, '/'));
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 172800000) return '昨天';
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  return formatTime(date, 'MM-DD');
}

/**
 * 获取当前日期字符串
 * @param {string} format
 */
function getToday(format = 'YYYY-MM-DD') {
  return formatTime(new Date(), format);
}

/**
 * 获取星期几的中文名
 * @param {number} day - 0=周日, 1=周一 ...
 */
function getWeekdayName(day) {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return names[day] || '';
}

/**
 * 防抖函数
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 节流函数
 */
function throttle(fn, interval = 300) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 随机整数 [min, max]
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 数组随机打乱
 */
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 从数组中随机取 n 个
 */
function randomSample(arr, n = 1) {
  return shuffle(arr).slice(0, n);
}

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * 深拷贝
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * 判断是否为今天
 */
function isToday(dateStr) {
  const today = getToday();
  return dateStr === today;
}

/**
 * 获取心情emoji
 */
function getMoodEmoji(mood) {
  const map = {
    '开心': '😊',
    '无聊': '😐',
    '平静': '😌',
    '难过': '😢',
    '焦虑': '😰',
    '兴奋': '🤩',
    '浪漫': '💕',
  };
  return map[mood] || '😊';
}

/**
 * 预设心情选项
 */
const MOOD_OPTIONS = [
  { value: '开心', icon: '😊', color: '#FFD93D' },
  { value: '无聊', icon: '😐', color: '#C7C7C7' },
  { value: '平静', icon: '😌', color: '#A8D8EA' },
  { value: '难过', icon: '😢', color: '#AA96DA' },
  { value: '焦虑', icon: '😰', color: '#FCBAD3' },
  { value: '兴奋', icon: '🤩', color: '#FF6B6B' },
  { value: '浪漫', icon: '💕', color: '#FFB6C1' },
];

module.exports = {
  formatTime,
  getRelativeTime,
  getToday,
  getWeekdayName,
  debounce,
  throttle,
  randomInt,
  shuffle,
  randomSample,
  generateId,
  deepClone,
  isToday,
  getMoodEmoji,
  MOOD_OPTIONS,
};
