/**
 * 地图/附近推荐路由
 * 根据用户定位推荐附近的咖啡馆、公园、商场等
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');

const AMAP_API_KEY = process.env.AMAP_API_KEY || '';

// 兴趣点类型
const POI_TYPES = {
  coffee: { keywords: '咖啡馆|咖啡店', types: '050300', name: '咖啡馆' },
  park: { keywords: '公园|植物园', types: '110100', name: '公园' },
  mall: { keywords: '商场|购物中心', types: '060100', name: '商场' },
  bookstore: { keywords: '书店|书吧', types: '060400', name: '书店' },
  museum: { keywords: '博物馆|美术馆|展览馆', types: '080300', name: '博物馆' },
  restaurant: { keywords: '餐厅|饭店|小吃', types: '050100', name: '餐厅' },
  cinema: { keywords: '电影院', types: '060300', name: '电影院' },
  gym: { keywords: '健身房|体育馆', types: '080500', name: '健身房' },
};

/**
 * 推荐附近的场所
 * GET /api/map/nearby?lat=39.9&lng=116.4&type=coffee&radius=3000
 */
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, type = 'coffee', radius = 3000, page = 1 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ code: 400, message: '缺少经纬度参数' });
    }

    const poiConfig = POI_TYPES[type];
    if (!poiConfig) {
      return res.status(400).json({ code: 400, message: '不支持的地点类型' });
    }

    // 如果有高德API Key，调用高德API
    if (AMAP_API_KEY && AMAP_API_KEY !== 'your_amap_api_key_here') {
      const result = await fetchFromAmap(lat, lng, poiConfig, radius, page);
      return res.json({ code: 0, data: result });
    }

    // 降级：返回模拟数据
    const mockData = generateMockPOIs(lat, lng, poiConfig);
    res.json({
      code: 1,
      message: '地图服务未配置（使用模拟数据），请设置 AMAP_API_KEY',
      data: mockData,
    });
  } catch (err) {
    console.error('地图请求失败:', err.message);
    res.status(500).json({ code: 500, message: '获取附近推荐失败' });
  }
});

/**
 * 从高德地图API获取POI数据
 */
async function fetchFromAmap(lat, lng, poiConfig, radius, page) {
  // 使用高德周边搜索API
  const response = await axios.get('https://restapi.amap.com/v3/place/around', {
    params: {
      key: AMAP_API_KEY,
      location: `${lng},${lat}`,
      keywords: poiConfig.keywords,
      types: poiConfig.types,
      radius: radius,
      offset: 20,
      page: page,
      extensions: 'base',
    },
    timeout: 10000,
  });

  if (response.data.status !== '1') {
    throw new Error(response.data.info || '高德API返回错误');
  }

  const pois = response.data.pois || [];
  // 过滤无关场所：只保留类型码匹配或名称含关键词的
  const filtered = pois.filter(p => {
    if (p.type && p.type.startsWith(poiConfig.types.slice(0, 6))) return true;
    const kw = poiConfig.keywords.split('|');
    return kw.some(k => p.name.includes(k));
  });

  return {
    list: filtered.map(p => ({
      id: p.id,
      name: p.name,
      address: p.address,
      latitude: parseFloat(p.location.split(',')[1]),
      longitude: parseFloat(p.location.split(',')[0]),
      distance: parseInt(p.distance),
      type: p.type,
      biz_ext: p.biz_ext || {},
    })),
    total: parseInt(response.data.count),
    source: 'amap',
  };
}

/**
 * 生成模拟POI数据（开发/演示用）
 */
function generateMockPOIs(lat, lng, poiConfig) {
  const mockNames = {
    coffee: ['星巴克臻选店', '瑞幸咖啡', 'Manner Coffee', '%Arabica', 'Seesaw Coffee', 'M Stand'],
    park: ['中央公园', '奥林匹克森林公园', '朝阳公园', '玉渊潭公园', '景山公园'],
    mall: ['三里屯太古里', '国贸商城', '朝阳大悦城', 'SKP', '合生汇'],
    bookstore: ['PageOne', '诚品书店', '单向空间', '中信书店', '钟书阁'],
    museum: ['中国美术馆', '今日美术馆', '红砖美术馆', '798艺术区', '木木美术馆'],
    restaurant: ['海底捞火锅', '鼎泰丰', '大董烤鸭', '西贝莜面村', '外婆家'],
    cinema: ['万达影城', 'CGV影城', '百丽宫影城', '英皇电影城', '卢米埃影城'],
    gym: ['超级猩猩', 'Keep健身中心', '乐刻健身', '威尔仕健身', '一兆韦德'],
  };

  const names = mockNames[Object.keys(POI_TYPES).find(k => POI_TYPES[k].name === poiConfig.name)] || mockNames.coffee;

  const list = names.map((name, index) => ({
    id: `mock_${Date.now()}_${index}`,
    name,
    address: `北京市朝阳区某某路${100 + index}号`,
    latitude: parseFloat(lat) + (Math.random() - 0.5) * 0.02,
    longitude: parseFloat(lng) + (Math.random() - 0.5) * 0.02,
    distance: Math.floor(Math.random() * 3000) + 100,
    type: poiConfig.name,
  }));

  return {
    list,
    total: list.length,
    source: 'mock',
  };
}

/**
 * 根据类别获取推荐地点列表
 * GET /api/map/categories
 */
router.get('/categories', (req, res) => {
  const categories = Object.entries(POI_TYPES).map(([key, val]) => ({
    type: key,
    name: val.name,
    icon: getCategoryIcon(key),
  }));
  res.json({ code: 0, data: categories });
});

function getCategoryIcon(type) {
  const icons = {
    coffee: '☕',
    park: '🌿',
    mall: '🛍️',
    bookstore: '📚',
    museum: '🏛️',
    restaurant: '🍽️',
    cinema: '🎬',
    gym: '💪',
  };
  return icons[type] || '📍';
}

module.exports = router;
