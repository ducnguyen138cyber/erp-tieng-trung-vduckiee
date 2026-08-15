const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function api() {
  const store = new Map();
  const sandbox = { globalThis: null, localStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) } };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const file of ['jarvis-context.js', 'jarvis-intent.js', 'jarvis-runtime.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), sandbox);
  return sandbox;
}

test('models an implicit recommendation as decision support', () => {
  const { VDuckieJarvisRuntime: runtime } = api();
  const request = runtime.buildRequest('Is this monitor worth 2 million?');
  assert.equal(request.intent.primaryIntent, 'recommendation');
  assert.equal(request.intent.goal, 'Choose the best option');
  assert.equal(request.intent.secondaryIntents[0], 'decision_support');
});

test('inherits the active goal for performance and execution follow-ups', () => {
  const { VDuckieJarvisContext: context, VDuckieJarvisRuntime: runtime } = api();
  context.setActive({ goal: 'Finish JARVIS memory safely', task: 'Finish JARVIS memory' });
  assert.equal(runtime.buildRequest('Make it faster.').intent.goal, 'Improve performance of Finish JARVIS memory safely');
  assert.equal(runtime.buildRequest('Do it.').intent.primaryIntent, 'continuation');
});

test('extracts an explicit goal before a later follow-up depends on it', () => {
  const { VDuckieJarvisContext: context, VDuckieJarvisRuntime: runtime } = api();
  const first = runtime.buildRequest('I need to finish JARVIS memory.').intent;
  assert.equal(first.goal, 'finish JARVIS memory.');
  context.setActive({ goal: first.goal });
  assert.match(runtime.buildRequest('Make it faster.').intent.goal, /finish JARVIS memory/);
});

test('represents comparison plus recommendation as multiple compatible intents', () => {
  const { VDuckieJarvisRuntime: runtime } = api();
  const intent = runtime.buildRequest('Compare these two monitors and tell me which one I should buy.').intent;
  assert.equal(intent.primaryIntent, 'comparison');
  assert.equal(intent.secondaryIntents.join(','), 'recommendation,decision_support');
});

test('replaces the active goal for an explicit correction or topic change', () => {
  const { VDuckieJarvisContext: context, VDuckieJarvisRuntime: runtime } = api();
  context.setActive({ goal: 'Fix JARVIS' });
  const correction = runtime.buildRequest('No, I mean I want the cheaper option.').intent;
  assert.equal(correction.primaryIntent, 'correction');
  assert.match(correction.goal, /cheaper option/);
  const changed = runtime.buildRequest('Never mind, help me choose a monitor.').intent;
  assert.equal(changed.goalChange, true);
  assert.equal(changed.goal, 'Choose the best option');
});

test('keeps ambiguity low-confidence and applies cost preferences only to decisions', () => {
  const { VDuckieJarvisContext: context, VDuckieJarvisRuntime: runtime } = api();
  context.upsertMemory({ type: 'preference', key: 'budget', content: 'User prefers low cost options' });
  const recommendation = runtime.buildRequest('Which is better?').intent;
  assert.equal(recommendation.confidence, 0.45);
  assert.equal(recommendation.constraints.join(','), 'cost_sensitive');
  assert.equal(runtime.buildRequest('Explain this error.').intent.constraints.length, 0);
});
