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

test('v86.2 builds exactly seven account-synced streak days', () => {
  const context = load('assets/v86/home-dashboard-v86.2.js');
  const api = context.VDuckieHomeDashboardV862;
  const today = new Date();
  const keys = [];
  for (let offset = 2; offset >= 0; offset--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  }
  const activity = { dates: Object.fromEntries(keys.map((key) => [key, 1])) };
  const days = api.lastSevenDays(activity);
  assert.equal(api.version, '86.2');
  assert.equal(days.length, 7);
  assert.equal(days.filter((day) => day.done).length, 3);
  assert.equal(api.streakCount(activity), 3);
});

test('v86.2 creates a horizontal HSK roadmap with active and locked stages', () => {
  const levels = {
    0: [{ id: 'foundation-1' }, { id: 'foundation-2' }],
    1: [{ id: 'hsk1-1' }],
    2: [{ id: 'hsk2-1' }],
    3: [{ id: 'hsk3-1' }],
    4: [{ id: 'hsk4-1' }]
  };
  const context = load('assets/v86/home-dashboard-v86.2.js', {
    'erp-hsk-state-v2': JSON.stringify({ level: 1, lesson: 0 }),
    'erp-hsk-progress-v2': JSON.stringify({ 'foundation-1': true, 'hsk1-1': true })
  }, { HSKCurriculum: { levels } });
  const stages = context.VDuckieHomeDashboardV862.roadmapData();
  assert.equal(stages.length, 7);
  assert.equal(stages.find((stage) => stage.level === 1).current, true);
  assert.equal(stages.find((stage) => stage.level === 1).progress.percent, 100);
  assert.equal(stages.find((stage) => stage.level === 5).active, false);
});

test('v85 personalizes recommendations by learning purpose and ERP role', () => {
  const context = load('assets/v85/personal-dashboard-v85.js', {
    'vduckie-preference-learning-mode-v85': 'erp',
    'vduckie-preference-erp-role-v85': 'warehouse'
  });
  const api = context.VDuckieV85Utils;
  assert.deepEqual(JSON.parse(JSON.stringify(api.preference())), { mode: 'erp', role: 'warehouse' });
  const recommendations = api.recommendation('erp', 'warehouse');
  assert.ok(recommendations.some((item) => /Kho/.test(item.title)));
  assert.ok(recommendations.every((item) => item.action !== 'hsk'));
});

test('v86 builds adaptive questions, chunks listening and reports errors', () => {
  const context = load('assets/v86/premium-learning-v86.js');
  const api = context.VDuckieV86Utils;
  const records = [
    { hanzi: '库存', pinyin: 'kù cún', meanings: { erp: ['Tồn kho'], hsk: [] } },
    { hanzi: '你好', pinyin: 'nǐ hǎo', meanings: { erp: [], hsk: ['Xin chào'] } },
    { hanzi: '学习', pinyin: 'xué xí', meanings: { erp: [], hsk: ['Học tập'] } },
    { hanzi: '生产', pinyin: 'shēng chǎn', meanings: { erp: ['Sản xuất'], hsk: [] } },
    { hanzi: '仓库', pinyin: 'cāng kù', meanings: { erp: ['Nhà kho'], hsk: [] } }
  ];
  const questions = api.buildQuestions(records, { words: { '库存': { wrongCount: 5, correctCount: 1 } } }, 5, { reverse: true });
  assert.equal(questions.length, 5);
  assert.equal(questions[0].word, '库存');
  assert.ok(questions.every((question) => question.options.length === 4));
  assert.deepEqual(Array.from(api.splitChunks('我先检查库存然后通知仓库。')), ['我先检查', '库存然后', '通知仓库', '。']);
  const diff = api.diffChars('你好', '你号');
  assert.equal(diff[0].ok, true);
  assert.equal(diff[1].ok, false);
  const report = api.report({ items: { 'hsk:a:quiz': { attempts: 3, correct: 1, wrong: 2 } } }, { words: {} });
  assert.equal(report.accuracy, 33);
});

test('suite loader removes the old full cockpit and loads compact v86.2 first', () => {
  const loader = fs.readFileSync(path.join(root, 'assets/v86/experience-suite-loader-v86.js'), 'utf8');
  const files = ['home-dashboard-v86.2.js?v=86.2', 'personal-dashboard-v85.js?v=85.1', 'premium-learning-v86.js?v=86.2'];
  let last = -1;
  for (const file of files) {
    const index = loader.indexOf(file);
    assert.ok(index > last, `${file} must load in order`);
    last = index;
  }
  assert.doesNotMatch(loader, /learning-cockpit-v83/);
  assert.doesNotMatch(loader, /retention-center-v84/);
  const patch = fs.readFileSync(path.join(root, 'scripts/apply_experience_suite_v86.js'), 'utf8');
  assert.match(patch, /experience-suite-loader-v86\.js\?v=86\.2/);
  assert.match(patch, /community\.js\?v=86\.2/);
});

test('compact layout keeps recommended lessons above workspace and sidebar is responsive', () => {
  const source = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.2.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.2.css'), 'utf8');
  assert.match(source, /overview\.nextElementSibling!==recommended/);
  assert.match(source, /BẮT ĐẦU CHUỖI CỦA BẠN/);
  assert.match(source, /LỘ TRÌNH ĐẾN KHI THÀNH THẠO/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) 310px/);
  assert.match(css, /grid-template-columns:repeat\(7,1fr\)/);
  assert.match(css, /v862-red-cta/);
  assert.match(css, /@media\(max-width:860px\)/);
});
