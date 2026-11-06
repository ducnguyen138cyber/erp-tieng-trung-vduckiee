const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'v75', 'home-welcome-v75.1.js'), 'utf8');

test('home guidance tells beginners where to start', () => {
  assert.match(source, /Mới bắt đầu\? Học HSK từ nền tảng/);
  assert.match(source, /Học HSK từ nền tảng/);
  assert.match(source, /Học tiếng Trung công xưởng/);
});

test('welcome heading uses a consistent sans-serif type scale', () => {
  assert.match(source, /Segoe UI/);
  assert.match(source, /font-size:clamp\(31px,2\.8vw,38px\)/);
  assert.match(source, /font-weight:800/);
});
