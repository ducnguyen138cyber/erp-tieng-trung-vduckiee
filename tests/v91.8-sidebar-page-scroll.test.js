const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'assets/v91/three-column-scroll-v91.8.css'), 'utf8');
const script = fs.readFileSync(path.join(root, 'assets/v91/sidebar-wheel-v91.8.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

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

test('current v91.10 layout supersedes the old wheel patch', () => {
  assert.match(index, /three-column-scroll-v91\.10\.css\?v=91\.10/);
  assert.doesNotMatch(index, /sidebar-wheel-v91\.8\.js/);
  assert.match(index, /app-shell-v88\.html\?v=99\.0/);
});
