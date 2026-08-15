const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function contextApi() {
  const store = new Map();
  const sandbox = { globalThis: null, localStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) } };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'jarvis-context.js'), 'utf8'), sandbox);
  return sandbox.VDuckieJarvisContext;
}

test('stores an explicit stable fact in the compact user model', () => {
  const context = contextApi();
  context.upsertMemory({ type: 'fact', key: 'role', content: 'User is a Vietnamese ERP developer', confidence: 0.9 });
  assert.equal(context.userContext('ERP developer').facts[0], 'User is a Vietnamese ERP developer');
});

test('deduplicates repeated project knowledge and promotes repeated temporary state', () => {
  const context = contextApi();
  context.upsertMemory({ type: 'project', key: 'jarvis', content: 'Build the JARVIS memory engine' });
  context.upsertMemory({ type: 'project', key: 'jarvis', content: 'Build the JARVIS memory engine' });
  context.upsertMemory({ type: 'temporary', key: 'current task', content: 'Use the compact prompt for this task' });
  context.upsertMemory({ type: 'temporary', key: 'current task', content: 'Use the compact prompt for this task' });
  const memories = context.getState().memories;
  assert.equal(memories.length, 2);
  assert.equal(memories[0].seenCount, 2);
  assert.equal(memories[1].type, 'project');
  assert.equal(memories[1].durability, 'long_term');
});

test('supersedes a changed preference while retaining its historical record', () => {
  const context = contextApi();
  context.upsertMemory({ type: 'preference', key: 'provider', content: 'User prefers Groq' });
  context.upsertMemory({ type: 'preference', key: 'provider', content: 'User now prefers OpenRouter' });
  const memories = context.getState().memories;
  assert.equal(memories.filter(memory => memory.status === 'current').length, 1);
  assert.equal(memories.filter(memory => memory.status === 'historical').length, 1);
  assert.equal(context.userContext('provider').preferences[0], 'User now prefers OpenRouter');
});

test('includes only relevant personalization and keeps one-off temporary context temporary', () => {
  const context = contextApi();
  context.upsertMemory({ type: 'preference', key: 'format', content: 'Use concise answers for JARVIS coding', importance: 2 });
  context.upsertMemory({ type: 'fact', key: 'garden', content: 'User grows tomatoes in a garden' });
  context.upsertMemory({ type: 'temporary', key: 'today', content: 'Today use a staging provider' });
  const profile = context.userContext('JARVIS coding format');
  assert.equal(profile.preferences[0], 'Use concise answers for JARVIS coding');
  assert.equal(profile.facts.length, 0);
  assert.equal(profile.temporary.length, 0);
  assert.equal(context.getState().memories[2].durability, 'temporary');
});
