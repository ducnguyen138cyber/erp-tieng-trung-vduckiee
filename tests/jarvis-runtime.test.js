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
  for (const file of ['jarvis-context.js', 'jarvis-runtime.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
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
  assert.equal(request.resolvedReferences.content, 'I have Groq and OpenRouter.');
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
