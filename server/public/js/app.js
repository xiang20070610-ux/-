/**
 * 随机岛 - 主应用逻辑
 */

// ===== 全局状态 =====
let currentPage = 'home';
let selectedMood = '';
let currentActivity = null;
let isFavorited = false;
let favoriteIds = [];
let currentCategoryId = 0;
let catPage = 1;
let catTotal = 0;
let catActivities = [];
let selectedPoiType = 'coffee';
let calendarYear, calendarMonth;
let lotteryPool = [];
let lotteryTimer = null;

const MOODS = [
  { value:'开心', icon:'😊' }, { value:'无聊', icon:'😐' }, { value:'平静', icon:'😌' },
  { value:'难过', icon:'😢' }, { value:'焦虑', icon:'😰' }, { value:'兴奋', icon:'🤩' }, { value:'浪漫', icon:'💕' }
];
const POI_TYPES = [
  { type:'coffee', name:'咖啡馆', icon:'☕' }, { type:'park', name:'公园', icon:'🌿' },
  { type:'mall', name:'商场', icon:'🛍️' }, { type:'bookstore', name:'书店', icon:'📚' },
  { type:'museum', name:'博物馆', icon:'🏛️' }, { type:'restaurant', name:'餐厅', icon:'🍽️' },
  { type:'cinema', name:'电影院', icon:'🎬' }, { type:'gym', name:'健身房', icon:'💪' },
];

// ===== 页面导航 =====
function switchTab(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  const tabEl = document.querySelector(`.tab-item[data-page="${page}"]`);
  if (tabEl) tabEl.classList.add('active');

  if (page === 'home') renderHome();
  else if (page === 'inspire') { renderInspire(); randomActivity(); }
  else if (page === 'lottery') renderLottery();
  else if (page === 'stats') loadStats();
}

function navigateTo(page, param) {
  if (page === 'category') { currentCategoryId = param; catPage = 1; catActivities = []; }
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');

  if (page === 'map') renderMap();
  else if (page === 'checkin') renderCheckin();
  else if (page === 'inspire') { renderInspire(); randomActivity(); }
  else if (page === 'lottery') renderLottery();
  else if (page === 'category') loadCategory();
  else if (page === 'stats') { loadStats(); document.querySelector('.tab-item[data-page="stats"]').classList.add('active'); }

  window.scrollTo(0, 0);
}

// ===== 深色模式 =====
function toggleDarkMode() {
  const dark = document.body.classList.toggle('dark');
  localStorage.setItem('random_island_dark', dark);
  document.getElementById('btnDarkMode').textContent = dark ? '☀️' : '🌙';
}

// ===== 首页 =====
function renderHome() {
  const moodContainer = document.getElementById('moodChips');
  moodContainer.innerHTML = MOODS.map(m =>
    `<div class="mood-chip ${selectedMood === m.value ? 'active' : ''}" onclick="selectMood('${m.value}', this)" data-mood="${m.value}">
      <span>${m.icon}</span><span>${m.value}</span>
    </div>`
  ).join('');
}

function selectMood(mood, el) {
  selectedMood = selectedMood === mood ? '' : mood;
  document.querySelectorAll('#moodChips .mood-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.mood === selectedMood);
  });
}

// ===== 灵感页 =====
function renderInspire() {
  document.getElementById('moodChips2').innerHTML = MOODS.map(m =>
    `<div class="mood-chip ${selectedMood === m.value ? 'active' : ''}" onclick="selectMood('${m.value}')" data-mood="${m.value}">
      <span>${m.icon}</span><span>${m.value}</span>
    </div>`
  ).join('');
  loadInspireHistory();
}

async function randomActivity() {
  const loading = document.getElementById('inspireLoading');
  const display = document.getElementById('inspireDisplay');
  loading.style.display = 'block';
  display.style.display = 'none';

  try {
    const params = {};
    if (selectedMood) params.mood = selectedMood;
    if (currentActivity) params.exclude_id = currentActivity.id;
    const res = await API.getRandom(params);
    if (res.code === 0 && res.data) {
      setActivity(res.data, 'random');
    }
  } catch (e) {
    document.getElementById('inspireTitle').textContent = '加载失败';
    document.getElementById('inspireDesc').textContent = '请检查网络连接后重试';
  }

  loading.style.display = 'none';
  display.style.display = 'block';
}

async function aiGenerate() {
  const loading = document.getElementById('inspireLoading');
  const display = document.getElementById('inspireDisplay');
  loading.style.display = 'block';
  display.style.display = 'none';

  try {
    const res = await API.aiGenerate({ mood: selectedMood || '开心', category: '', count: 3 });
    if (res.data && res.data.length > 0) {
      const idx = Math.floor(Math.random() * res.data.length);
      setActivity(res.data[idx], 'ai');
    }
  } catch (e) {
    document.getElementById('inspireTitle').textContent = 'AI 服务暂不可用';
    document.getElementById('inspireDesc').textContent = '请检查 DeepSeek API 配置';
  }

  loading.style.display = 'none';
  display.style.display = 'block';
}

function setActivity(activity, source) {
  currentActivity = activity;
  document.getElementById('inspireEmoji').textContent = activity.icon || '🎯';
  document.getElementById('inspireTitle').textContent = activity.title;
  document.getElementById('inspireDesc').textContent = activity.description || '';
  document.getElementById('inspireSource').textContent = source === 'ai' ? 'AI为你推荐' : '精选推荐';

  const meta = document.getElementById('inspireMeta');
  const catName = activity.category_name || '';
  const catIcon = activity.category_icon || '';
  meta.innerHTML = catName ? `${catIcon} ${catName} ${activity.is_ai ? '🤖 AI生成' : ''}` : '';

  const tags = document.getElementById('inspireTags');
  tags.innerHTML = (activity.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

  // 检查收藏
  isFavorited = favoriteIds.includes(activity.id);
  document.getElementById('btnFavorite').innerHTML = isFavorited ? '❤️ 已收藏' : '🤍 收藏';

  // 记录浏览
  API.recordView(activity.id);
  addInspireHistory(activity);
}

function addInspireHistory(activity) {
  let history = JSON.parse(localStorage.getItem('inspire_history') || '[]');
  history = history.filter(h => h.id !== activity.id);
  history.unshift({ id: activity.id, title: activity.title, icon: activity.icon, is_ai: activity.is_ai });
  history = history.slice(0, 10);
  localStorage.setItem('inspire_history', JSON.stringify(history));
  loadInspireHistory();
}

function loadInspireHistory() {
  const history = JSON.parse(localStorage.getItem('inspire_history') || '[]');
  const container = document.getElementById('inspireHistory');
  if (history.length === 0) { container.innerHTML = ''; return; }

  container.innerHTML = `<span class="section-label">最近推荐</span><div class="history-grid">` +
    history.map(h => `<div class="history-item" onclick="loadHistoryActivity(${h.id})">
      ${h.icon || '🎯'} ${h.title}
    </div>`).join('') + '</div>';
}

function loadHistoryActivity(id) {
  currentActivity = { id };
  randomActivity();
}

async function toggleFavorite() {
  if (!currentActivity) return;
  try {
    if (isFavorited) {
      await API.removeFavorite(currentActivity.id);
      favoriteIds = favoriteIds.filter(i => i !== currentActivity.id);
    } else {
      await API.addFavorite(currentActivity.id);
      favoriteIds.push(currentActivity.id);
    }
    isFavorited = !isFavorited;
    localStorage.setItem('favorite_ids', JSON.stringify(favoriteIds));
    document.getElementById('btnFavorite').innerHTML = isFavorited ? '❤️ 已收藏' : '🤍 收藏';
  } catch (e) { console.error(e); }
}

async function completeActivity() {
  if (!currentActivity) return;
  if (confirm('确定已完成这项活动吗？')) {
    try {
      await API.completeActivity(currentActivity.id);
      alert('太棒了！🌟');
    } catch (e) { console.error(e); }
  }
}

// ===== 分类页 =====
async function loadCategory() {
  try {
    const cats = await API.getCategories();
    const cat = (cats.data || []).find(c => c.id === currentCategoryId);
    if (cat) {
      document.getElementById('catIcon').textContent = cat.icon;
      document.getElementById('catName').textContent = cat.name;
      document.getElementById('catDesc').textContent = cat.description;
    }

    const res = await API.getActivities({ category_id: currentCategoryId, page: catPage, page_size: 20 });
    if (res.code === 0) {
      catTotal = res.data.total;
      catActivities = catPage === 1 ? res.data.list : [...catActivities, ...res.data.list];
      document.getElementById('catCount').textContent = `共 ${catTotal} 条活动`;
      document.getElementById('catLoadMore').style.display = catActivities.length < catTotal ? 'block' : 'none';
      renderCatList();
    }
  } catch (e) { console.error(e); }
}

function loadMoreCategory() {
  catPage++;
  loadCategory();
}

function renderCatList() {
  const container = document.getElementById('catList');
  container.innerHTML = catActivities.map(a => `
    <div class="activity-card" onclick="viewActivity(${a.id}, '${(a.category_name||'').replace(/'/g,"")}')">
      <div class="ac-header">
        <span class="ac-badge">${a.category_icon || ''} ${a.category_name || ''}</span>
        ${a.is_ai ? '<span class="ac-ai-badge">🤖 AI</span>' : ''}
      </div>
      <div class="ac-body">
        <div class="ac-icon">${a.icon || '🎯'}</div>
        <div class="ac-info">
          <div class="ac-title">${a.title}</div>
          <div class="ac-desc">${a.description || ''}</div>
        </div>
        <div class="ac-fav" onclick="event.stopPropagation();quickFav(${a.id},this)">${favoriteIds.includes(a.id) ? '❤️' : '🤍'}</div>
      </div>
      <div class="ac-tags">${(a.tags||[]).map(t=>`<span class="ac-tag">${t}</span>`).join('')}</div>
    </div>
  `).join('');
}

function viewActivity(id, catName) {
  currentCategoryId = 0;
  navigateTo('inspire');
  currentActivity = { id, category_name: catName };
  randomActivity();
}

async function quickFav(id, el) {
  try {
    if (favoriteIds.includes(id)) {
      await API.removeFavorite(id);
      favoriteIds = favoriteIds.filter(i => i !== id);
      el.textContent = '🤍';
    } else {
      await API.addFavorite(id);
      favoriteIds.push(id);
      el.textContent = '❤️';
    }
    localStorage.setItem('favorite_ids', JSON.stringify(favoriteIds));
  } catch (e) { console.error(e); }
}

// ===== 抽签页 =====
function renderLottery() {
  document.getElementById('lotteryCats').innerHTML =
    '<div class="cat-opt active" data-id="0" onclick="selectLotteryCat(0,this)">🎲 全部随机</div>' +
    ['🧘 独处','💑 情侣','🎉 好友'].map((n,i) =>
      `<div class="cat-opt" data-id="${i+1}" onclick="selectLotteryCat(${i+1},this)">${n}</div>`
    ).join('');
  document.getElementById('lotteryResult').style.display = 'none';
}

function selectLotteryCat(id, el) {
  currentCategoryId = id;
  document.querySelectorAll('#lotteryCats .cat-opt').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

async function startLottery() {
  if (lotteryTimer) return;
  const btn = document.getElementById('btnLottery');
  btn.textContent = '抽取中...';
  btn.disabled = true;

  try {
    const res = await API.getActivities({ category_id: currentCategoryId || undefined, page_size: 50 });
    lotteryPool = res.data?.list || [];
  } catch (e) { lotteryPool = []; }

  if (lotteryPool.length === 0) {
    btn.textContent = '🎯 开始抽取';
    btn.disabled = false;
    return;
  }

  let count = 0;
  const total = 15 + Math.floor(Math.random() * 10);
  let interval = 80;
  const wheelText = document.getElementById('wheelText');
  const wheelEmoji = document.getElementById('wheelEmoji');
  const wheelDisplay = document.getElementById('wheelDisplay');

  wheelDisplay.classList.add('spinning');
  document.getElementById('lotteryResult').style.display = 'none';

  function spin() {
    const idx = Math.floor(Math.random() * lotteryPool.length);
    const item = lotteryPool[idx];
    wheelText.textContent = item.title;
    wheelEmoji.textContent = item.icon || '🎯';
    count++;

    if (count < total) {
      if (count > total * 0.6) interval += 40;
      else if (count > total * 0.3) interval += 15;
      lotteryTimer = setTimeout(spin, interval);
    } else {
      const final = lotteryPool[Math.floor(Math.random() * lotteryPool.length)];
      wheelDisplay.classList.remove('spinning');
      wheelText.textContent = final.title;
      wheelEmoji.textContent = final.icon || '🎯';
      btn.textContent = '再来一次';
      btn.disabled = false;
      lotteryTimer = null;

      // 显示结果
      document.getElementById('lotteryResult').style.display = 'block';
      document.getElementById('lotteryResult').innerHTML = `
        <div class="result-icon">${final.icon}</div>
        <div class="result-title">${final.title}</div>
        <div class="result-desc">${final.description || ''}</div>
        <div class="result-actions">
          <button class="btn btn-outline" onclick="API.completeActivity(${final.id});alert('已记录✅')">就它了</button>
          <button class="btn" style="background:var(--bg);" onclick="startLottery()">再抽一次</button>
        </div>
      `;
    }
  }

  spin();
}

// ===== 地图页 =====
function renderMap() {
  document.getElementById('poiTypes').innerHTML = POI_TYPES.map(p =>
    `<div class="poi-type-item ${selectedPoiType === p.type ? 'active' : ''}" onclick="selectPoiType('${p.type}',this)">
      <span>${p.icon}</span><span>${p.name}</span>
    </div>`
  ).join('');
  getLocation();
}

async function getLocation() {
  document.getElementById('locationText').textContent = '定位中...';
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => fetchNearby(pos.coords.latitude, pos.coords.longitude),
      () => { document.getElementById('locationText').textContent = '使用默认位置'; fetchNearby(39.9042, 116.4074); }
    );
  } else {
    fetchNearby(39.9042, 116.4074);
  }
}

function selectPoiType(type, el) {
  selectedPoiType = type;
  document.querySelectorAll('.poi-type-item').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  getLocation();
}

async function fetchNearby(lat, lng) {
  document.getElementById('locationText').textContent = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  try {
    const res = await API.getNearby({ lat, lng, type: selectedPoiType, radius: 5000 });
    const list = res.data?.list || [];
    document.getElementById('poiList').innerHTML = list.length === 0
      ? '<p style="text-align:center;color:var(--hint);padding:40px 0;">暂无附近推荐</p>'
      : list.map(p => `
        <div class="poi-card">
          <div class="poi-pic">📍</div>
          <div class="poi-info">
            <div class="poi-name">${p.name}</div>
            <div class="poi-addr">${p.address || ''}</div>
            <div class="poi-dist">${p.distance < 1000 ? p.distance + 'm' : (p.distance/1000).toFixed(1) + 'km'}</div>
          </div>
          <div class="poi-nav" onclick="window.open('https://uri.amap.com/marker?position=${p.longitude},${p.latitude}&name=${encodeURIComponent(p.name)}')">🧭</div>
        </div>
      `).join('');

    if (res.code === 1) {
      document.getElementById('poiList').innerHTML += '<div class="map-tip">💡 当前使用模拟数据，配置高德API Key后获取真实数据</div>';
    }
  } catch (e) {
    document.getElementById('poiList').innerHTML = '<p style="text-align:center;color:var(--hint);padding:40px 0;">获取失败</p>';
  }
}

// ===== 打卡页 =====
async function renderCheckin() {
  const now = new Date();
  calendarYear = now.getFullYear();
  calendarMonth = now.getMonth() + 1;
  await loadCheckinStats();
  await renderCalendar();
}

async function loadCheckinStats() {
  try {
    const res = await API.getCheckinStats();
    if (res.code === 0) {
      const d = res.data;
      document.querySelector('#page-checkin .stats-cards').innerHTML = `
        <div class="stat-card"><span class="stat-num">${d.total_days||0}</span>累计打卡</div>
        <div class="stat-card highlight"><span class="stat-num">${d.streak_days||0}</span>连续天数🔥</div>
        <div class="stat-card"><span class="stat-num">${d.monthly_days||0}</span>本月打卡</div>
      `;
    }
  } catch (e) {}
}

async function doCheckin() {
  const note = prompt('写一句备注（可选）:');
  if (note === null) return;
  try {
    await API.checkin(note || undefined);
    alert('打卡成功！💝');
    await loadCheckinStats();
    await renderCalendar();
  } catch (e) { alert('打卡失败'); }
}

async function renderCalendar() {
  try {
    const res = await API.getCalendar(calendarYear, calendarMonth);
    if (res.code !== 0) return;
    const { days } = res.data;
    const today = new Date().toISOString().split('T')[0];
    const firstDay = days[0]?.weekday || 0;

    let html = '<div class="calendar"><div class="cal-header">';
    html += `<button class="cal-nav" onclick="calendarMonth--;if(calendarMonth<1){calendarMonth=12;calendarYear--;}renderCalendar();">‹</button>`;
    html += `<span class="cal-month">${calendarYear}年${calendarMonth}月</span>`;
    html += `<button class="cal-nav" onclick="calendarMonth++;if(calendarMonth>12){calendarMonth=1;calendarYear++;}renderCalendar();">›</button>`;
    html += '</div><div class="weekday-row">';
    html += ['日','一','二','三','四','五','六'].map(w => `<div class="weekday">${w}</div>`).join('');
    html += '</div><div class="cal-grid">';

    // 填充前锋
    for (let i = 0; i < firstDay; i++) html += '<div class="cal-day other"></div>';

    days.forEach(d => {
      const isToday = d.date === today;
      html += `<div class="cal-day ${d.checked ? 'checked' : ''} ${isToday ? 'today' : ''}">
        ${isToday ? `<span>${d.day}</span>` : d.day}
        ${d.checked && d.data?.icon ? `<div style="font-size:10px">${d.data.icon}</div>` : ''}
      </div>`;
    });

    html += '</div></div>';
    document.getElementById('calendarView').innerHTML = html;
  } catch (e) {}
}

// ===== 统计页 =====
async function loadStats() {
  try {
    const res = await API.getStatsOverview();
    if (res.code === 0) {
      const d = res.data;
      document.getElementById('dataCards').innerHTML = `
        <div class="data-card"><span class="data-num">${d.monthly_completions||0}</span>本月完成</div>
        <div class="data-card"><span class="data-num">${d.total_favorites||0}</span>收藏活动</div>
        <div class="data-card"><span class="data-num">${d.total_checkin_days||0}</span>打卡天数</div>
        <div class="data-card"><span class="data-num">${d.streak_days||0}</span>连续打卡</div>
      `;
      document.getElementById('favBadge').textContent = d.total_favorites || 0;
    }
  } catch (e) {}
}

async function showFavorites() {
  try {
    const res = await API.getFavorites();
    const list = res.data?.list || [];
    document.getElementById('favoritesBody').innerHTML = list.length === 0
      ? '<p style="text-align:center;color:var(--hint);padding:40px 0;">还没有收藏</p>'
      : list.map(a => `<div class="activity-card">${a.icon} <b>${a.title}</b><br><span style="font-size:13px;color:var(--hint)">${a.description||''}</span></div>`).join('');
    document.getElementById('modalFavorites').classList.add('show');
  } catch (e) {}
}

async function showHistory() {
  try {
    const res = await API.getHistory();
    const list = res.data?.list || [];
    document.getElementById('historyBody').innerHTML = list.length === 0
      ? '<p style="text-align:center;color:var(--hint);padding:40px 0;">暂无浏览记录</p>'
      : list.map(a => `<div class="activity-card">${a.icon} <b>${a.title}</b><br><span style="font-size:13px;color:var(--hint)">${a.description||''}</span></div>`).join('');
    document.getElementById('modalHistory').classList.add('show');
  } catch (e) {}
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

// ===== 初始化 =====
function init() {
  // 深色模式
  if (localStorage.getItem('random_island_dark') === 'true') {
    document.body.classList.add('dark');
    document.getElementById('btnDarkMode').textContent = '☀️';
  }

  // 加载收藏ID
  favoriteIds = JSON.parse(localStorage.getItem('favorite_ids') || '[]');

  // 点击modal空白关闭
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('show'); });
  });

  renderHome();
}

// 点击modal背景关闭
document.addEventListener('DOMContentLoaded', init);
