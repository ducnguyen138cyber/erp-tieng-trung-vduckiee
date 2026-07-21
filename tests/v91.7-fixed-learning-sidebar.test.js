const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'assets/v91/three-column-scroll-v91.7.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('desktop learning sidebar is fixed to the viewport', () => {
  assert.match(css, /@media \(min-width: 981px\)[\s\S]*?\.study-sidebar\s*\{[\s\S]*?position:\s*fixed\s*!important/);
  assert.match(css, /top:\s*96px\s*!important/);
  assert.match(css, /left:\s*max\(16px, calc\(\(100vw - 1500px\) \/ 2\)\)\s*!important/);
});

test('center and right columns keep their grid slots and scroll normally', () => {
  assert.match(css, /\.study-center\s*\{[\s\S]*?grid-column:\s*2\s*!important[\s\S]*?position:\s*static\s*!important/);
  assert.match(css, /\.study-rail\s*\{[\s\S]*?grid-column:\s*3\s*!important/);
  assert.match(css, /\.study-rail,[\s\S]*?\.v865-home-sidebar\s*\{[\s\S]*?position:\s*static\s*!important/);
});

test('tablet and mobile keep the existing drawer behavior', () => {
  assert.match(css, /@media \(max-width: 980px\)[\s\S]*?\.study-sidebar\s*\{[\s\S]*?left:\s*0\s*!important/);
  assert.match(css, /width:\s*min\(310px, 86vw\)\s*!important/);
});

test('v91.7 layout asset is cache-busted', () => {
  assert.match(index, /app-shell-v88\.html\?v=91\.7/);
  assert.match(index, /three-column-scroll-v91\.7\.css\?v=91\.7/);
});
