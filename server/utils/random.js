/**
 * 随机算法工具
 * 提供加权随机、Fisher-Yates洗牌等
 */

/**
 * Fisher-Yates 洗牌算法
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 随机抽取 n 个不重复元素
 */
function randomSample(array, n = 1) {
  const shuffled = shuffle(array);
  return shuffled.slice(0, Math.min(n, array.length));
}

/**
 * 加权随机选择
 * @param {Array} items - 元素数组
 * @param {Function} weightFn - 权重计算函数
 */
function weightedRandom(items, weightFn) {
  const weights = items.map(weightFn);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  return items[items.length - 1];
}

/**
 * 根据心情匹配活动
 * @param {string} mood - 用户心情
 * @returns {string} 匹配的 mood_tag
 */
function moodToTag(mood) {
  const moodMap = {
    '开心': '开心',
    '无聊': '无聊',
    '平静': '平静',
    '难过': '开心',   // 难过时推荐开心的活动
    '焦虑': '平静',   // 焦虑时推荐平静的活动
    '兴奋': '冒险',
    '浪漫': '浪漫',
  };
  return moodMap[mood] || null;
}

module.exports = { shuffle, randomSample, weightedRandom, moodToTag };
