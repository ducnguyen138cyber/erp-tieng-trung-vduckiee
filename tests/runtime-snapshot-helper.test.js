'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getRuntimeSnapshot,
  assertAssetLoaded,
  getRelativeRuntimeAssets,
  normalizeAssetReference
} = require('./helpers/runtime-snapshot');

test('runtime snapshot combines the app shell with bootstrap-injected assets', () => {
  const snapshot = getRuntimeSnapshot();
  assert.match(snapshot.effectiveHtml, /id="studySidebar"/);
  assert.match(snapshot.effectiveHtml, /source=source\.replace\("<\/body>"/);
  assertAssetLoaded(assert, 'app-shell-v88.html', { snapshot });
  assertAssetLoaded(assert, 'developer-control-center.js', { snapshot });
});

test('runtime asset parser ignores escaped regex source text', () => {
  const snapshot = getRuntimeSnapshot();
  assert.ok(getRelativeRuntimeAssets(snapshot).every((reference) => !reference.includes('\\.')));
  assert.equal(normalizeAssetReference('.\\/assets\\/file.js?v=1'), './assets/file.js?v=1');
});
