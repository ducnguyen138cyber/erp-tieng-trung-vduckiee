const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getRuntimeSnapshot, assertAssetLoaded, assertAssetNotLoaded } = require('./helpers/runtime-snapshot');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'assets/v91/three-column-scroll-v91.8.css'), 'utf8');
const script = fs.readFileSync(path.join(root, 'assets/v91/sidebar-wheel-v91.8.js'), 'utf8');
const snapshot = getRuntimeSnapshot();

test('desktop learning sidebar stays fixed without its own scroll container', () => {
  assert.match(css, /\.study-sidebar\s*\{[\s\S]*position:\s*fixed\s*!important/);
  assert.match(css, /\.study-sidebar\s*\{[\s\S]*max-height:\s*none\s*!important/);
  assert.match(css, /\.study-sidebar\s*\{[\s\S]*overflow:\s*visible\s*!important/);
  assert.doesNotMatch(css.split('@media (max-width: 980px)')[0], /overflow-y:\s*auto/);
});

test('wheel input over the desktop sidebar scrolls the page', () => {
  assert.match(script, /sidebar\.addEventListener\("wheel"/);
  assert.match(script, /event\.preventDefault\(\)/);
  assert.match(script, /root\.scrollBy\(\{/);
  assert.match(script, /top:\s*event\.deltaY/);
});

test('tablet and mobile keep the existing independently scrollable drawer', () => {
  const mobile = css.split('@media (max-width: 980px)')[1];
  assert.match(mobile, /overflow-y:\s*auto\s*!important/);
});

test('current layout supersedes the wheel patch and remains cache-busted', () => {
  assertAssetLoaded(assert, 'three-column-scroll-v91.10.css', { snapshot });
  assertAssetLoaded(assert, 'app-shell-v88.html', { snapshot });
  assertAssetNotLoaded(assert, 'sidebar-wheel-v91.8.js', { snapshot });
});
