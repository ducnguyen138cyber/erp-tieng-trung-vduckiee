const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'v75', 'home-welcome-v75.1.js'), 'utf8');

test('home guidance tells beginners where to start', () => {
  assert.match(source, /Bạn là một người mới chưa biết bắt đầu học tiếng Trung từ đâu\?/);
  assert.match(source, /Bắt đầu học HSK/);
  assert.match(source, /Học từ vựng ERP/);
});

test('welcome heading uses a consistent sans-serif type scale', () => {
  assert.match(source, /Segoe UI/);
  assert.match(source, /font-size:clamp\(31px,2\.8vw,38px\)/);
  assert.match(source, /font-weight:800/);
});
