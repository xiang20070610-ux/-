# 随机岛 Moment - 微信小程序

给你的生活一点灵感 ✨

「随机岛」是一个生活灵感助手微信小程序，提供 300+ 精选活动建议，支持 AI 灵感生成、附近场所推荐、活动抽签、情侣打卡等功能。

## 功能特性

### 🏠 首页
- 心情选择器（开心/无聊/平静/难过/焦虑/兴奋/浪漫）
- 四大功能卡片：发现身边、独处、情侣、三五好友
- 快捷入口：抽签决定、情侣打卡、AI灵感、数据统计

### ✨ 灵感页面
- 随机推荐活动建议
- **AI 灵感生成**（调用 DeepSeek API，根据心情生成个性化建议）
- "换一个"按钮随机刷新
- 收藏 & 完成打卡
- 历史推荐记录

### 🎰 活动抽签
- 选择活动类型（或全部随机）
- 滚动动画抽取（模拟转盘效果）
- 减速停止，触觉反馈
- "就它了"确认 & 再抽一次

### 🗺️ 发现身边
- 获取用户定位
- 推荐附近咖啡馆、公园、商场、书店、博物馆、餐厅、电影院、健身房
- 支持高德地图 API（或内置模拟数据）
- 一键打开地图导航

### 💝 情侣打卡
- 每日打卡（带备注）
- **连续打卡天数统计**
- **情侣日历**（月视图，标记打卡日期）
- 最近打卡记录

### 📊 数据统计（我的页面）
- 本月完成活动数 / 收藏数 / 打卡天数 / 连续天数
- 最喜欢的分类
- 本周每日活动柱状图
- 收藏列表 / 浏览记录 / 设置入口

### ⚙️ 设置
- 深色模式切换
- 每日提醒开关
- 缓存管理

## 技术架构

```
moment-mini-program/
├── miniprogram/              # 微信小程序前端
│   ├── app.js                # 入口文件
│   ├── app.json              # 全局配置（含TabBar + 深色模式）
│   ├── app.wxss              # 全局样式（CSS变量 + 原子类）
│   ├── theme.json            # 深色模式主题变量
│   ├── pages/
│   │   ├── index/            # 首页
│   │   ├── inspire/          # AI灵感页（随机推荐 + AI生成）
│   │   ├── category/         # 分类活动列表
│   │   ├── lottery/          # 活动抽签
│   │   ├── map/              # 发现身边（地图推荐）
│   │   ├── checkin/          # 情侣打卡 + 日历
│   │   ├── stats/            # 我的（数据统计）
│   │   ├── favorites/        # 收藏列表
│   │   ├── history/          # 浏览记录
│   │   └── settings/         # 设置
│   ├── components/
│   │   ├── activity-card/    # 活动卡片组件
│   │   └── nav-bar/          # 自定义导航栏
│   └── utils/
│       ├── api.js            # API 请求封装
│       ├── storage.js        # 本地缓存工具
│       └── util.js           # 通用工具函数
│
├── server/                   # Node.js + Express 后端
│   ├── index.js              # 服务入口
│   ├── .env                  # 环境变量（API Keys）
│   ├── routes/
│   │   ├── activities.js     # 活动CRUD + 收藏 + 历史
│   │   ├── ai.js             # DeepSeek AI 灵感生成
│   │   ├── map.js            # 地图附近推荐
│   │   ├── checkin.js        # 打卡 + 日历
│   │   └── stats.js          # 数据统计
│   └── database/
│       ├── init.js           # 数据库初始化（SQLite）
│       └── seed.js           # 种子数据（300+条活动）
│
└── README.md
```

## 快速开始

### 1. 安装后端依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

编辑 `server/.env`：

```env
# DeepSeek API（AI 灵感功能）
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 高德地图 API（附近推荐功能）
AMAP_API_KEY=your_amap_api_key_here

PORT=3000
```

> 💡 两个 API Key 都是可选的。未配置时，AI 功能会使用降级建议，地图功能会使用模拟数据。

### 3. 初始化数据库并启动服务

```bash
npm start
```

数据库会自动创建并插入 300+ 条种子活动数据。

### 4. 配置微信小程序

1. 下载并打开 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入项目，选择 `miniprogram/` 目录
3. 填写 AppID（可在微信公众平台注册获取，或使用测试号）
4. **准备 TabBar 图标**：在 `miniprogram/images/` 下放置以下 8 个图标文件（推荐 81x81 PNG）：
   - `tab-home.png` / `tab-home-active.png`
   - `tab-inspire.png` / `tab-inspire-active.png`
   - `tab-lottery.png` / `tab-lottery-active.png`
   - `tab-mine.png` / `tab-mine-active.png`
5. 在 `app.js` 中修改 `apiBaseUrl` 为你的后端地址

### 5. 预览

在微信开发者工具中点击"预览"，扫码即可在手机上体验。

## UI 设计

- **风格**：简约白色设计，参考「随机岛」App
- **圆角**：大量使用 16-32rpx 圆角卡片
- **阴影**：轻柔的多层阴影增加层次感
- **动效**：fadeIn 入场动画、卡片点击缩放、抽签滚动动画
- **深色模式**：完整支持深色模式，使用 CSS 变量切换
- **触觉反馈**：抽签和按钮操作配有震动反馈

## 数据库表结构

| 表名 | 说明 |
|------|------|
| categories | 活动分类（独处/情侣/好友/发现） |
| activities | 活动内容（300+条） |
| favorites | 用户收藏 |
| history | 浏览记录 |
| couple_checkins | 情侣打卡记录 |
| user_settings | 用户设置 |
| activity_completions | 活动完成记录（统计用） |

## API 接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/activities/categories | 获取分类 |
| GET | /api/activities | 活动列表（分页） |
| GET | /api/activities/random | 随机获取一条 |
| GET | /api/activities/:id | 活动详情 |
| POST | /api/activities/:id/favorite | 添加收藏 |
| DELETE | /api/activities/:id/favorite | 取消收藏 |
| POST | /api/activities/:id/view | 记录浏览 |
| POST | /api/activities/:id/complete | 记录完成 |
| POST | /api/ai/generate | AI 生成灵感 |
| GET | /api/map/nearby | 附近推荐 |
| POST | /api/checkin | 情侣打卡 |
| GET | /api/checkin/calendar | 情侣日历 |
| GET | /api/stats/overview | 综合统计 |

## License

MIT
