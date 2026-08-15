const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createApi() {
  const store = new Map();
  const context = { globalThis: null, localStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) } };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'jarvis-context.js'), 'utf8'), context);
  return context.VDuckieJarvisContext;
}

test('resolves a continuation against the active task and latest turn', () => {
  const api = createApi();
  api.setActive({ topic: 'Jarvis memory', task: 'Improve relevant retrieval' });
  api.recordTurn('user', 'Make it faster');
  const result = api.resolve('tiếp');
  assert.equal(result.kind, 'continuation');
  assert.equal(result.active.task, 'Improve relevant retrieval');
  assert.equal(result.anchor.content, 'Make it faster');
});

test('updates a preference instead of duplicating it and retrieves only relevant memory', () => {
  const api = createApi();
  api.upsertMemory({ type: 'preference', key: 'response language', content: 'Vietnamese', entities: ['language'] });
  api.upsertMemory({ type: 'preference', key: 'response language', content: 'Vietnamese, concise', entities: ['language'] });
  api.upsertMemory({ type: 'project', key: 'HSK', content: 'Study HSK vocabulary' });
  const found = api.retrieve('language preference', 5);
  assert.equal(api.getState().memories.length, 2);
  assert.equal(found.length, 1);
  assert.equal(found[0].content, 'Vietnamese, concise');
});

test('marks corrections so the next turn can be interpreted as a repair', () => {
  const api = createApi();
  api.setActive({ topic: 'ERP dialogue' });
  const result = api.resolve('không, ý tao là sửa cái trước');
  assert.equal(result.kind, 'correction');
  api.recordTurn('user', result.message);
  assert.equal(api.getState().active.lastCorrection, result.message);
});
