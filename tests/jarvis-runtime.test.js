const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function api() {
  const store = new Map();
  const context = { globalThis: null, localStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) }, setTimeout, clearTimeout };
  context.globalThis = context;
  vm.createContext(context);
  for (const file of ['jarvis-context.js', 'jarvis-intent.js', 'jarvis-runtime.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  return context;
}

test('keeps the active JARVIS memory task for a dependent request', () => {
  const { VDuckieJarvisContext: context, VDuckieJarvisRuntime: runtime } = api();
  context.setActive({ topic: 'JARVIS memory', task: 'Improve memory retrieval' });
  context.recordTurn('user', 'I am working on JARVIS memory.');
  const request = runtime.buildRequest('Make it faster.');
  assert.equal(request.conversationContext.topic, 'JARVIS memory');
  assert.equal(request.resolvedReferences, null);
  assert.match(request.recentTurns[0].content, /JARVIS memory/);
});

test('resolves an ordinal fallback reference from the latest provider turn', () => {
  const { VDuckieJarvisContext: context, VDuckieJarvisRuntime: runtime } = api();
  context.recordTurn('user', 'I have Groq and OpenRouter.');
  const request = runtime.buildRequest('Use the second one as fallback.');
  assert.equal(request.resolvedIntent, 'reference');
  assert.equal(request.resolvedReferences.value, 'I have Groq and OpenRouter.');
});

test('keeps correction and continuation context in normalized requests', () => {
  const { VDuckieJarvisContext: context, VDuckieJarvisRuntime: runtime } = api();
  context.setActive({ task: 'Finish the context runtime' });
  context.recordTurn('user', 'Draft the provider layer.');
  assert.equal(runtime.buildRequest("No, that's not what I meant.").resolvedIntent, 'correction');
  assert.equal(runtime.buildRequest('Continue.').resolvedIntent, 'continuation');
  assert.equal(runtime.buildRequest('Continue.').conversationContext.task, 'Finish the context runtime');
});

test('normalizes a provider response and updates the context after a successful turn', async () => {
  const sandbox = api();
  sandbox.fetch = async () => ({ ok: true, status: 200, json: async () => ({ success: true, text: 'Được, mình sẽ tối ưu phần nhớ.', provider: 'test-provider', model: 'test-model' }) });
  const result = await sandbox.VDuckieJarvisRuntime.generate('I am working on JARVIS memory.');
  assert.equal(result.success, true);
  assert.equal(result.provider, 'test-provider');
  assert.equal(sandbox.VDuckieJarvisContext.getState().turns.length, 2);
  assert.equal(sandbox.VDuckieJarvisContext.getState().memories[0].type, 'task');
});

test('resolves a previous item from the latest meaningful turn without guessing an entity', () => {
  const { VDuckieJarvisContext: context, VDuckieJarvisRuntime: runtime } = api();
  context.recordTurn('user', 'Fix auth.js, then review billing.js.', { entities: ['auth.js', 'billing.js'] });
  const request = runtime.buildRequest('Fix the previous one.');
  assert.equal(request.resolvedIntent, 'reference');
  assert.equal(request.resolvedReferences.source, 'recent_turn');
  assert.equal(request.resolvedReferences.value, 'Fix auth.js, then review billing.js.');
});

test('applies a correction as the active task and retains it for continuation', () => {
  const { VDuckieJarvisContext: context } = api();
  const correction = context.resolve('No, I meant optimize memory retrieval.');
  context.recordTurn('user', correction.message);
  context.applyMeaning(correction);
  assert.equal(context.getState().active.task, 'optimize memory retrieval.');
  assert.equal(context.resolve('continue').active.task, 'optimize memory retrieval.');
});

test('returns to a prior task through relevant memory after the topic changes', () => {
  const { VDuckieJarvisContext: context, VDuckieJarvisRuntime: runtime } = api();
  context.upsertMemory({ type: 'task', key: 'jarvis memory', content: 'Optimize JARVIS memory retrieval', entities: ['JARVIS memory'] });
  context.setActive({ topic: 'billing', task: 'Review billing UI' });
  const request = runtime.buildRequest('Return to JARVIS memory retrieval.');
  assert.equal(request.relevantMemories.length, 1);
  assert.equal(request.relevantMemories[0].key, 'jarvis memory');
});

test('builds a compact packet that excludes unrelated memories and duplicate anchors', () => {
  const { VDuckieJarvisContext: context, VDuckieJarvisRuntime: runtime } = api();
  context.setActive({ topic: 'JARVIS memory', task: 'Optimize retrieval', mode: 'reaction' });
  context.upsertMemory({ type: 'preference', key: 'response format', content: 'Use concise responses for JARVIS memory work' });
  context.upsertMemory({ type: 'fact', key: 'garden', content: 'User grows tomatoes in a garden' });
  context.recordTurn('user', 'Optimize JARVIS memory retrieval.');
  const request = runtime.buildRequest('Continue this.');
  assert.equal(request.conversationContext.mode, undefined);
  assert.equal(request.recentTurns.length, 0);
  assert.equal(request.relevantMemories.map(memory => memory.key).join(','), 'response format');
});
