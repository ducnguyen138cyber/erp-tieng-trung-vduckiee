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
function load(file, initial = {}) {
  const context = { globalThis: null, localStorage: storage(initial), console, Date, setTimeout, clearTimeout };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  return context;
}

test('v83 keeps daily goals and recent dictionary history in syncable keys', () => {
  const context = load('assets/v83/learning-cockpit-v83.js', {
    'vduckie-study-goals-v1': JSON.stringify({ dailyWords: 10 }),
    'vduckie-study-activity-v1': JSON.stringify({ dates: {} }),
    'vduckie-personal-history-v1': JSON.stringify(['你好', '库存'])
  });
  const api = context.VDuckieV83Utils;
  assert.equal(api.version, '83.0');
  assert.deepEqual(Array.from(api.history()), ['库存', '你好']);
  assert.equal(api.goalData().target, 10);
});

test('v84 renders exactly seven account-synced streak days and ranks weak words', () => {
  const context = load('assets/v84/retention-center-v84.js');
  const api = context.VDuckieV84Utils;
  const today = new Date(2026, 6, 18);
  const days = api.sevenDays({ dates: { '2026-07-16': 2, '2026-07-17': 1, '2026-07-18': 3 } }, today);
  assert.equal(days.length, 7);
  assert.equal(days.filter((day) => day.done).length, 3);
  assert.equal(api.streak({ dates: { '2026-07-16': 1, '2026-07-17': 1, '2026-07-18': 1 } }, today), 3);
  const weak = api.weakWords({ words: { '库存': { wrongCount: 4, correctCount: 1 }, '你好': { wrongCount: 1, correctCount: 3 } } });
  assert.equal(weak[0].word, '库存');
  assert.match(fs.readFileSync(path.join(root, 'assets/v84/retention-center-v84.js'), 'utf8'), /vduckie-streak-v84/);
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

test('suite loader applies v83, v84, v85 and v86 in order', () => {
  const loader = fs.readFileSync(path.join(root, 'assets/v86/experience-suite-loader-v86.js'), 'utf8');
  const files = ['learning-cockpit-v83.js?v=83.0', 'retention-center-v84.js?v=84.0', 'personal-dashboard-v85.js?v=85.0', 'premium-learning-v86.js?v=86.0'];
  let last = -1;
  for (const file of files) {
    const index = loader.indexOf(file);
    assert.ok(index > last, `${file} must load in order`);
    last = index;
  }
  const patch = fs.readFileSync(path.join(root, 'scripts/apply_experience_suite_v86.js'), 'utf8');
  assert.match(patch, /experience-suite-loader-v86\.js\?v=86\.0/);
});

test('streak and dashboard layouts are responsive and mark flames', () => {
  const streakCss = fs.readFileSync(path.join(root, 'assets/v84/retention-center-v84.css'), 'utf8');
  const premiumCss = fs.readFileSync(path.join(root, 'assets/v86/premium-learning-v86.css'), 'utf8');
  assert.match(streakCss, /grid-template-columns:repeat\(7,1fr\)/);
  assert.match(streakCss, /v84-day\.done .*v84-fire-dot/);
  assert.match(streakCss, /@media\(max-width:620px\)/);
  assert.match(premiumCss, /v86-listening-tools/);
  assert.match(premiumCss, /v86-speaking-diff/);
});
