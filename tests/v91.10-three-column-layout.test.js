const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getRuntimeSnapshot, assertAssetLoaded, assertAssetNotLoaded } = require('./helpers/runtime-snapshot');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'assets/v91/three-column-scroll-v91.10.css'), 'utf8');
const snapshot = getRuntimeSnapshot();

test('left learning sidebar stays sticky on desktop', () => {
  assert.match(css, /\.study-sidebar\s*\{[\s\S]*?grid-column:\s*1 !important;[\s\S]*?position:\s*sticky !important;/);
  assert.match(css, /\.study-sidebar\s*\{[\s\S]*?max-height:\s*calc\(100vh - 112px\) !important;[\s\S]*?overflow-y:\s*auto !important;/);
});

test('home center wrapper keeps columns two and three together', () => {
  assert.match(css, /html\.v865-home-mode \.study-center\s*\{[\s\S]*?position:\s*sticky !important;[\s\S]*?max-height:\s*calc\(100vh - 112px\) !important;/);
});

test('home right sidebar is not nested sticky', () => {
  assert.match(css, /html\.v865-home-mode \.v865-home-sidebar\s*\{[\s\S]*?position:\s*static !important;[\s\S]*?top:\s*auto !important;/);
  assert.doesNotMatch(css, /html\.v865-home-mode \.v865-home-sidebar\s*\{[\s\S]*?position:\s*sticky !important;/);
});

test('current stylesheet is cache-busted and old wheel patch is absent', () => {
  assertAssetLoaded(assert, 'three-column-scroll-v91.10.css', { snapshot });
  assertAssetLoaded(assert, 'app-shell-v88.html', { snapshot });
  assertAssetNotLoaded(assert, 'sidebar-wheel-v91.8.js', { snapshot });
});
