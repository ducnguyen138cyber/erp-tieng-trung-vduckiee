const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const layoutSource = fs.readFileSync(
  path.join(__dirname, '..', 'assets', 'v75', 'home-layout-v75.3.js'),
  'utf8'
);
const loaderSource = fs.readFileSync(path.join(__dirname, '..', 'community.js'), 'utf8');

test('welcome copy reserves a separate mascot column', () => {
  assert.match(layoutSource, /grid-template-columns:minmax\(0,1fr\) var\(--welcome-mascot-space\)/);
  assert.match(layoutSource, /\.home-welcome-card p\{grid-column:1/);
  assert.match(layoutSource, /\.home-welcome-actions\{grid-column:1/);
  assert.match(layoutSource, /max-width:none!important/);
});

test('heading can wrap safely when zoom narrows the card', () => {
  assert.match(layoutSource, /white-space:normal!important/);
  assert.doesNotMatch(layoutSource, /white-space:nowrap/);
});

test('community loader uses the cache-busted v75.3 layout', () => {
  assert.match(loaderSource, /home-layout-v75\.3\.js\?v=75\.3/);
});
