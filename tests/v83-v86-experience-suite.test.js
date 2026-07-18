const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
function storage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    key: (index) => Array.from(data.keys())[index] || null,
    get length() { return data.size; }
  };
}
function load(file, initial = {}, extras = {}) {
  const context = { globalThis: null, localStorage: storage(initial), console, Date, setTimeout, clearTimeout, ...extras };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  return context;
}

test('v86.4 builds exactly seven account-synced streak days', () => {
  const context = load('assets/v86/home-dashboard-v86.4.js');
  const api = context.VDuckieHomeDashboardV864;
  const today = new Date();
  const dates = {};
  for (let offset = 2; offset >= 0; offset--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    dates[`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`] = 1;
  }
  const days = api.lastSevenDays({ dates });
  assert.equal(api.version, '86.4');
  assert.equal(days.length, 7);
  assert.equal(days.filter((day) => day.done).length, 3);
  assert.equal(api.streakCount({ dates }), 3);
});

test('v86.4 creates compact horizontal HSK stages with circular legacy colors', () => {
  const levels = {
    0: [{ id: 'foundation-1' }, { id: 'foundation-2' }],
    1: [{ id: 'hsk1-1' }],
    2: [{ id: 'hsk2-1' }],
    3: [{ id: 'hsk3-1' }],
    4: [{ id: 'hsk4-1' }]
  };
  const context = load('assets/v86/home-dashboard-v86.4.js', {
    'erp-hsk-state-v2': JSON.stringify({ level: 1, lesson: 0 }),
    'erp-hsk-progress-v2': JSON.stringify({ 'foundation-1': true, 'hsk1-1': true })
  }, { HSKCurriculum: { levels } });
  const stages = context.VDuckieHomeDashboardV864.roadmapData();
  assert.equal(stages.length, 7);
  assert.equal(stages.find((stage) => stage.level === 1).icon, '壹');
  assert.equal(stages.find((stage) => stage.level === 1).progress.percent, 100);
  assert.equal(stages.find((stage) => stage.level === 7).active, false);
  const css = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.4.css'), 'utf8');
  assert.match(css, /border-radius:50%/);
  assert.match(css, /data-v864-level="0"/);
  assert.match(css, /background:#168864/);
  assert.match(css, /grid-auto-columns:minmax\(112px,1fr\)/);
  assert.match(css, /min-height:106px/);
});

test('v86.4 places streak beside welcome and learning library like the reference dashboard', () => {
  const source = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.4.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.4.css'), 'utf8');
  assert.match(source, /v864TopStreakMount/);
  assert.match(source, /overview\.appendChild\(mount\)/);
  assert.match(source, /mount\.innerHTML=streakMarkup/);
  assert.match(css, /grid-template-columns:minmax\(0,1\.06fr\) minmax\(0,\.94fr\) 320px/);
  assert.match(css, /v864-top-streak-mount/);
  assert.match(css, /min-height:356px/);
});

test('v86.4 keeps lower cards inside the main column and sidebar contains weekly plus continue only', () => {
  const source = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.4.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.4.css'), 'utf8');
  assert.match(source, /sidebar\.innerHTML=weeklyMarkup\(weeklyData\(streak\)\)\+continueMarkup/);
  assert.match(source, /moveAdvancedSections\(main\)/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) 320px/);
  assert.match(css, /#v864HomeMain>#v85PersonalDashboard/);
  assert.match(css, /max-width:100%!important/);
  assert.match(css, /overflow:hidden!important/);
});

test('v85 still personalizes recommendations by learning purpose and ERP role', () => {
  const context = load('assets/v85/personal-dashboard-v85.js', {
    'vduckie-preference-learning-mode-v85': 'erp',
    'vduckie-preference-erp-role-v85': 'warehouse'
  });
  const api = context.VDuckieV85Utils;
  assert.deepEqual(JSON.parse(JSON.stringify(api.preference())), { mode: 'erp', role: 'warehouse' });
  assert.ok(api.recommendation('erp', 'warehouse').every((item) => item.action !== 'hsk'));
});

test('v86 adaptive practice remains available after the layout replacement', () => {
  const context = load('assets/v86/premium-learning-v86.js');
  const api = context.VDuckieV86Utils;
  const records = [
    { hanzi: '库存', pinyin: 'kù cún', meanings: { erp: ['Tồn kho'], hsk: [] } },
    { hanzi: '你好', pinyin: 'nǐ hǎo', meanings: { erp: [], hsk: ['Xin chào'] } },
    { hanzi: '学习', pinyin: 'xué xí', meanings: { erp: [], hsk: ['Học tập'] } },
    { hanzi: '生产', pinyin: 'shēng chǎn', meanings: { erp: ['Sản xuất'], hsk: [] } },
    { hanzi: '仓库', pinyin: 'cāng kù', meanings: { erp: ['Nhà kho'], hsk: [] } }
  ];
  assert.equal(api.buildQuestions(records, { words: {} }, 5, { reverse: true }).length, 5);
  assert.deepEqual(Array.from(api.splitChunks('我先检查库存然后通知仓库。')), ['我先检查', '库存然后', '通知仓库', '。']);
});

test('loader and deployment script use v86.4 without the old v86.3 patch', () => {
  const loader = fs.readFileSync(path.join(root, 'assets/v86/experience-suite-loader-v86.js'), 'utf8');
  assert.match(loader, /home-dashboard-v86\.4\.js\?v=86\.4/);
  assert.doesNotMatch(loader, /home-dashboard-v86\.2/);
  assert.doesNotMatch(loader, /home-layout-fix-v86\.3/);
  const patch = fs.readFileSync(path.join(root, 'scripts/apply_experience_suite_v86.js'), 'utf8');
  assert.match(patch, /experience-suite-loader-v86\.js\?v=86\.4/);
  assert.match(patch, /community\.js\?v=86\.4/);
});

test('responsive breakpoints collapse top streak and lower sidebar safely', () => {
  const css = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.4.css'), 'utf8');
  assert.match(css, /@media\(max-width:1320px\)/);
  assert.match(css, /grid-column:1\/-1/);
  assert.match(css, /@media\(max-width:1080px\)/);
  assert.match(css, /grid-template-columns:1fr/);
  assert.match(css, /@media\(max-width:860px\)/);
});
