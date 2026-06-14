/**
 * AI 灵感生成路由
 * 调用 DeepSeek API 根据用户心情生成活动建议
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

// 心情提示词映射
const MOOD_PROMPTS = {
  '开心': '用户现在心情很好，想要一些有趣、社交、充满活力的活动建议。',
  '无聊': '用户现在感到无聊，想要一些新奇、有创意、能激发灵感的独处或社交活动。',
  '平静': '用户现在心情平静，想要一些放松、治愈、享受当下的活动建议。',
  '难过': '用户现在感到难过，想要一些温暖、治愈、能让人开心的活动建议。',
  '焦虑': '用户现在感到焦虑，想要一些能减压、放松、帮助平静下来的活动建议。',
  '兴奋': '用户现在精力充沛很兴奋，想要一些挑战、冒险、户外活动建议。',
  '浪漫': '用户现在想感受浪漫，想要一些温馨、有情调的活动建议。',
};

/**
 * 生成 AI 活动建议
 * POST /api/ai/generate
 * Body: { mood: "开心", category: "情侣", count: 3 }
 */
router.post('/generate', async (req, res) => {
  try {
    const { mood = '开心', category = '', count = 3 } = req.body;

    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your_deepseek_api_key_here') {
      return res.status(503).json({
        code: 503,
        message: 'AI 服务未配置，请在 .env 中设置 DEEPSEEK_API_KEY'
      });
    }

    const moodContext = MOOD_PROMPTS[mood] || MOOD_PROMPTS['开心'];
    const categoryContext = category ? `活动类型偏向"${category}"类。` : '';

    const prompt = `你是一个生活灵感助手。${moodContext}${categoryContext}

请生成 ${count} 条具体的活动建议，每条包含：
- title: 活动标题（简短有吸引力，10字以内）
- description: 简短描述（30字以内，让人想立刻去做）
- tags: 2-3个标签
- icon: 一个最相关的emoji

请以JSON格式返回：{"suggestions": [{"title":"...","description":"...","tags":["...","..."],"icon":"..."}]}

要求：
1. 活动要具体可行，不是在家的普通小事
2. 风格要温暖有创意，像朋友推荐
3. 不要重复常见的建议`;

    const response = await axios.post(
      `${DEEPSEEK_BASE_URL}/v1/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个温暖、有创意的活动推荐助手。只返回JSON格式。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const content = response.data.choices[0].message.content;
    // 提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 返回格式无效');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const suggestions = (parsed.suggestions || []).map(s => ({
      ...s,
      is_ai: true,
      category_name: category || 'AI推荐',
      category_icon: '🤖',
      mood_tags: [mood],
    }));

    res.json({ code: 0, data: suggestions });
  } catch (err) {
    console.error('AI 请求失败:', err.message);
    // 降级：返回几条静态建议
    const fallback = getFallbackSuggestions(req.body.mood, req.body.category);
    res.json({
      code: 1,
      message: 'AI 服务暂时不可用，为你准备了精选建议',
      data: fallback,
    });
  }
});

/**
 * 降级建议
 */
function getFallbackSuggestions(mood, category) {
  const fallbacks = {
    '开心': [
      { title: '去公园晒太阳', description: '带上蓝牙音箱，享受阳光和音乐', tags: ['户外', '放松'], icon: '☀️', is_ai: true },
      { title: '给好友打电话', description: '打给很久没联系的朋友，分享近况', tags: ['社交', '温暖'], icon: '📞', is_ai: true },
      { title: '去吃想吃很久的店', description: '今天奖励自己，去打卡收藏夹里的餐厅', tags: ['美食', '奖励'], icon: '🍜', is_ai: true },
    ],
    '无聊': [
      { title: '逛一家没去过的店', description: '在附近随便走走，探索新地方', tags: ['探索', '新鲜'], icon: '🔍', is_ai: true },
      { title: '学一个魔术', description: '找一个简单的魔术教程，给朋友惊喜', tags: ['学习', '趣味'], icon: '🪄', is_ai: true },
      { title: '重排书架/唱片', description: '按颜色或心情重新排列，创造新鲜感', tags: ['整理', '创意'], icon: '🌈', is_ai: true },
    ],
    '平静': [
      { title: '去咖啡馆看书', description: '找一家安静的小咖啡馆，翻翻杂志', tags: ['咖啡', '阅读'], icon: '☕', is_ai: true },
      { title: '写一封手写信', description: '给远方的朋友或家人写封信', tags: ['写作', '温暖'], icon: '✉️', is_ai: true },
      { title: '去河边散步', description: '沿着河边慢慢走，感受微风和水声', tags: ['散步', '自然'], icon: '🌊', is_ai: true },
    ],
    '浪漫': [
      { title: '去看日落', description: '找一个视野开阔的地方看一场完整的日落', tags: ['户外', '美景'], icon: '🌅', is_ai: true },
      { title: '准备烛光晚餐', description: '点上蜡烛，做一顿精致的晚餐', tags: ['烹饪', '情调'], icon: '🕯️', is_ai: true },
      { title: '一起看星星', description: '找个光污染少的地方，躺下来看星空', tags: ['户外', '夜晚'], icon: '✨', is_ai: true },
    ],
    '默认': [
      { title: '尝试一项新运动', description: '网球、攀岩、滑板…选一个试试', tags: ['运动', '挑战'], icon: '🎯', is_ai: true },
      { title: '整理照片墙', description: '把最近的照片冲洗出来，布置一面墙', tags: ['手工', '回忆'], icon: '📸', is_ai: true },
      { title: '去植物园', description: '在绿植中走一走，呼吸新鲜空气', tags: ['户外', '自然'], icon: '🌿', is_ai: true },
    ],
  };

  return fallbacks[mood] || fallbacks['默认'];
}

module.exports = router;
