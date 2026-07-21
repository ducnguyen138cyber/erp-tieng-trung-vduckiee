const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'assets/v91/three-column-scroll-v91.6.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

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

test('v91.6 scrolling stylesheet is cache-busted', () => {
  assert.match(index, /app-shell-v88\.html\?v=91\.6/);
  assert.match(index, /three-column-scroll-v91\.6\.css\?v=91\.6/);
});
