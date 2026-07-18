const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'supabase-sync.js'), 'utf8');

function storage() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); }
  };
}

const context = {
  console,
  navigator: { onLine: true },
  localStorage: storage(),
  sessionStorage: storage(),
  document: {
    readyState: 'loading',
    addEventListener() {},
    getElementById() { return null; }
  },
  window: null,
  CustomEvent: function CustomEvent() {},
  URL,
  history: { replaceState() {} }
};
context.window = context;
context.location = { hostname: 'localhost', origin: 'http://localhost', pathname: '/', href: 'http://localhost/' };
context.setTimeout = setTimeout;
context.clearTimeout = clearTimeout;
context.setInterval = setInterval;
context.clearInterval = clearInterval;
vm.createContext(context);
vm.runInContext(source, context);
const utils = context.VDuckieProgressSyncUtils;

test('keeps all completed lessons when remote and local devices are merged', () => {
  const remoteStates = {};
  for (let index = 1; index <= 12; index++) remoteStates[`foundation-${index}`] = { done: true, updatedAt: 100 + index };
  const local = {
    completionStates: { 'foundation-1': { done: true, updatedAt: 50 } },
    state: { level: 0, lesson: 0 }, stateUpdatedAt: 50
  };
  const remote = {
    completionStates: remoteStates,
    state: { level: 0, lesson: 11 }, stateUpdatedAt: 200
  };
  const merged = utils.merge(local, remote);
  assert.equal(Object.keys(utils.completedObject(merged)).length, 12);
  assert.equal(merged.state.level, 0);
  assert.equal(merged.state.lesson, 11);
});

test('newer explicit completion state wins, including unmarking a lesson', () => {
  const merged = utils.merge(
    { completionStates: { 'hsk1-1': { done: true, updatedAt: 100 } } },
    { completionStates: { 'hsk1-1': { done: false, updatedAt: 200 } } }
  );
  assert.equal(utils.completedObject(merged)['hsk1-1'], undefined);
  assert.equal(merged.completionStates['hsk1-1'].done, false);
});

test('latest lesson position is selected independently from completion merge', () => {
  const merged = utils.merge(
    { state: { level: 1, lesson: 2 }, stateUpdatedAt: 500 },
    { state: { level: 0, lesson: 11 }, stateUpdatedAt: 300 }
  );
  assert.equal(merged.state.level, 1);
  assert.equal(merged.state.lesson, 2);
});

test('stores progress as a hidden per-user row in the existing Supabase table', () => {
  const row = utils.progressRow({
    completionStates: { 'foundation-1': { done: true, updatedAt: 123 } },
    state: { level: 0, lesson: 1 }, stateUpdatedAt: 123, updatedAt: 123
  }, 'user-abc');
  assert.equal(row.user_id, 'user-abc');
  assert.equal(row.word_key, '__vduckie_hsk_progress_v1__');
  assert.equal(row.category, '__system_hsk_progress__');
  assert.match(row.note, /foundation-1/);
});

test('reserved progress row is filtered out of vocabulary synchronization', () => {
  assert.match(source, /if \(rows\[i\]\.word_key === progressWordKey\) remoteProgress = rows\[i\];/);
  assert.match(source, /else wordRows\.push\(rows\[i\]\);/);
  assert.match(source, /accountCachePrefix = "vduckie-hsk-account-cache-v1:"/);
  assert.match(source, /progressPoll = window\.setInterval\(trackLocalProgress, 700\)/);
});
