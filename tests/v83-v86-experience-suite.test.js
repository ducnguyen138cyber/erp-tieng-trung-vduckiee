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

test('v86.5 builds exactly seven account-synced streak days', () => {
  const context = load('assets/v86/home-dashboard-v86.5.js');
  const api = context.VDuckieHomeDashboardV865;
  const today = new Date();
  const dates = {};
  for (let offset = 2; offset >= 0; offset--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    dates[`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`] = 1;
  }
  const days = api.lastSevenDays({ dates });
  assert.equal(api.version, '86.5');
  assert.equal(days.length, 7);
  assert.equal(days.filter((day) => day.done).length, 3);
  assert.equal(api.streakCount({ dates }), 3);
});

test('v86.5 keeps circular legacy-colored horizontal HSK stages', () => {
  const levels = {
    0: [{ id: 'foundation-1' }, { id: 'foundation-2' }],
    1: [{ id: 'hsk1-1' }],
    2: [{ id: 'hsk2-1' }],
    3: [{ id: 'hsk3-1' }],
    4: [{ id: 'hsk4-1' }]
  };
  const context = load('assets/v86/home-dashboard-v86.5.js', {
    'erp-hsk-state-v2': JSON.stringify({ level: 1, lesson: 0 }),
    'erp-hsk-progress-v2': JSON.stringify({ 'foundation-1': true, 'hsk1-1': true })
  }, { HSKCurriculum: { levels } });
  const stages = context.VDuckieHomeDashboardV865.roadmapData();
  assert.equal(stages.length, 7);
  assert.equal(stages.find((stage) => stage.level === 1).icon, '壹');
  assert.equal(stages.find((stage) => stage.level === 1).progress.percent, 100);
  assert.equal(stages.find((stage) => stage.level === 7).active, false);
  const css = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.5.css'), 'utf8');
  assert.match(css, /border-radius:50%/);
  assert.match(css, /data-v865-level="0"/);
  assert.match(css, /background:#168864/);
  assert.match(css, /grid-auto-columns:minmax\(108px,1fr\)/);
});

test('v86.5 creates one straight main column and one straight right sidebar', () => {
  const source = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.5.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.5.css'), 'utf8');
  assert.match(source, /v865HomeShell/);
  assert.match(source, /main\.appendChild\(overview\)/);
  assert.match(source, /main\.appendChild\(recommended\)/);
  assert.match(source, /main\.appendChild\(roadWrap\.firstChild\)/);
  assert.match(source, /sidebar\.innerHTML=streakMarkup\(streak\)\+weeklyMarkup/);
  assert.match(source, /weeklyMarkup\(weeklyData\(streak\)\)\+continueMarkup/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) 300px/);
  assert.match(css, /v865-home-sidebar/);
  assert.doesNotMatch(source, /v864TopStreakMount/);
});

test('recommended lessons are compact before the roadmap', () => {
  const source = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.5.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.5.css'), 'utf8');
  assert.ok(source.indexOf('main.appendChild(recommended)') < source.indexOf('main.appendChild(roadWrap.firstChild)'));
  assert.match(css, /home-course-art\{height:96px!important\}/);
  assert.match(css, /home-course-copy\{padding:10px 11px!important\}/);
  assert.match(css, /home-course-copy strong\{min-height:34px;font-size:13px\}/);
});

test('v85 personalization and v86 adaptive practice remain available', () => {
  const personal = load('assets/v85/personal-dashboard-v85.js', {
    'vduckie-preference-learning-mode-v85': 'erp',
    'vduckie-preference-erp-role-v85': 'warehouse'
  }).VDuckieV85Utils;
  assert.ok(personal.recommendation('erp', 'warehouse').every((item) => item.action !== 'hsk'));

  const adaptive = load('assets/v86/premium-learning-v86.js').VDuckieV86Utils;
  const records = [
    { hanzi: '库存', pinyin: 'kù cún', meanings: { erp: ['Tồn kho'], hsk: [] } },
    { hanzi: '你好', pinyin: 'nǐ hǎo', meanings: { erp: [], hsk: ['Xin chào'] } },
    { hanzi: '学习', pinyin: 'xué xí', meanings: { erp: [], hsk: ['Học tập'] } },
    { hanzi: '生产', pinyin: 'shēng chǎn', meanings: { erp: ['Sản xuất'], hsk: [] } },
    { hanzi: '仓库', pinyin: 'cāng kù', meanings: { erp: ['Nhà kho'], hsk: [] } }
  ];
  assert.equal(adaptive.buildQuestions(records, { words: {} }, 5, { reverse: true }).length, 5);
});

test('loader and deployment script use v86.5', () => {
  const loader = fs.readFileSync(path.join(root, 'assets/v86/experience-suite-loader-v86.js'), 'utf8');
  assert.match(loader, /home-dashboard-v86\.5\.js\?v=86\.5/);
  assert.doesNotMatch(loader, /home-dashboard-v86\.4/);
  const patch = fs.readFileSync(path.join(root, 'scripts/apply_experience_suite_v86.js'), 'utf8');
  assert.match(patch, /experience-suite-loader-v86\.js\?v=86\.5/);
  assert.match(patch, /community\.js\?v=86\.5/);
});

test('responsive breakpoints preserve columns without overlap', () => {
  const css = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.5.css'), 'utf8');
  assert.match(css, /@media\(max-width:1240px\)/);
  assert.match(css, /@media\(max-width:1080px\)/);
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:860px\)/);
  assert.match(css, /grid-template-columns:1fr!important/);
});
