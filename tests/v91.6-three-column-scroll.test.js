const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getRuntimeSnapshot, assertAssetLoaded, assertAssetNotLoaded } = require('./helpers/runtime-snapshot');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'assets/v91/three-column-scroll-v91.6.css'), 'utf8');
const snapshot = getRuntimeSnapshot();

test('left learning column remains sticky on desktop', () => {
  assert.match(css, /\.study-sidebar\s*\{[^}]*position:\s*sticky\s*!important/s);
  assert.match(css, /\.study-sidebar\s*\{[^}]*overflow-y:\s*auto\s*!important/s);
});

test('center column scrolls with the document', () => {
  assert.match(css, /\.study-center\s*\{[^}]*position:\s*static\s*!important/s);
  assert.match(css, /\.study-center\s*\{[^}]*max-height:\s*none\s*!important/s);
  assert.match(css, /\.study-center\s*\{[^}]*overflow:\s*visible\s*!important/s);
});

test('both right-column implementations scroll with the document', () => {
  assert.match(css, /\.study-rail,\s*\.v865-home-sidebar\s*\{[^}]*position:\s*static\s*!important/s);
  assert.match(css, /\.study-rail,\s*\.v865-home-sidebar\s*\{[^}]*max-height:\s*none\s*!important/s);
  assert.match(css, /\.study-rail,\s*\.v865-home-sidebar\s*\{[^}]*overflow:\s*visible\s*!important/s);
});

test('current three-column stylesheet and app shell are cache-busted', () => {
  assertAssetLoaded(assert, 'app-shell-v88.html', { snapshot });
  assertAssetLoaded(assert, 'three-column-scroll-v91.10.css', { snapshot });
});
