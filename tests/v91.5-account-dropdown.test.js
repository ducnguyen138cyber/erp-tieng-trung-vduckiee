const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'assets/v91/header-account-dropdown-v91.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/v91/header-account-dropdown-v91.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('the whole account card is a hit target', () => {
  assert.match(css, /\.v91-account-trigger>\*\{pointer-events:none!important\}/);
  assert.match(css, /min-height:64px!important/);
  assert.match(css, /z-index:20!important/);
});

test('pointer capture recognizes any coordinate inside the card rectangle', () => {
  assert.match(script, /function pointInsideTrigger\(event\)/);
  assert.match(script, /x>=rect\.left&&x<=rect\.right&&y>=rect\.top&&y<=rect\.bottom/);
  assert.match(script, /root\.addEventListener\("pointerdown",handleAccountPointer,true\)/);
  assert.match(script, /event\.stopImmediatePropagation\(\)/);
});

test('follow-up click cannot immediately close the dropdown', () => {
  assert.match(script, /suppressClickUntil=Date\.now\(\)\+650/);
  assert.match(script, /root\.addEventListener\("click",suppressFollowupClick,true\)/);
});

test('v91.5 assets are cache-busted', () => {
  assert.match(index, /header-account-dropdown-v91\.css\?v=91\.5/);
  assert.match(index, /header-account-dropdown-v91\.js\?v=91\.5/);
  assert.match(index, /app-shell-v88\.html\?v=91\.5/);
});
