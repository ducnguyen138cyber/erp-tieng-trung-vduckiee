'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getRuntimeSnapshot,
  assertAssetLoaded,
  getRelativeRuntimeAssets,
  normalizeAssetReference
} = require('./helpers/runtime-snapshot');

test('runtime snapshot executes the app shell bootstrap and inventories its injected assets', () => {
  const snapshot = getRuntimeSnapshot();
  assert.match(snapshot.effectiveHtml, /id="studySidebar"/);
  assert.match(snapshot.indexSource, /source=source\.replace\("<\/body>"/);
  assert.match(snapshot.effectiveHtml, /<script src=".\/assets\/games\/sentence-game\.js/);
  assertAssetLoaded(assert, 'app-shell-v88.html', { snapshot });
  assert.equal(snapshot.assets.some(asset=>asset.includes('/developer/')),false);
  assertAssetLoaded(assert, 'developer-control-center.js', {snapshot:getRuntimeSnapshot({search:'?developer=1'})});
});

test('runtime asset parser ignores escaped regex source text', () => {
  const snapshot = getRuntimeSnapshot();
  assert.ok(getRelativeRuntimeAssets(snapshot).every((reference) => !reference.includes('\\.')));
  assert.equal(normalizeAssetReference('.\\/assets\\/file.js?v=1'), './assets/file.js?v=1');
});
