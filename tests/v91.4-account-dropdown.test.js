const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'assets/v91/header-account-dropdown-v91.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('account dropdown uses one explicit open state', () => {
  assert.match(script, /var trigger,dropdown,modal,account,accountObserver,lastFocus,syncQueued=false,isOpen=false/);
  assert.match(script, /function applyOpenState\(open\)/);
  assert.match(script, /dropdown\.hidden=!isOpen/);
  assert.match(script, /dropdown\.style\.display=isOpen\?"block":"none"/);
  assert.match(script, /dropdown\.classList\.toggle\("is-open",isOpen\)/);
});

test('account trigger owns a capture-phase click handler', () => {
  assert.match(script, /trigger\.addEventListener\("click"/);
  assert.match(script, /event\.stopImmediatePropagation\(\)/);
  assert.match(script, /toggle\(\)\},true\)/);
});

test('v91.4 assets are cache-busted', () => {
  assert.match(index, /header-account-dropdown-v91\.css\?v=91\.4/);
  assert.match(index, /header-account-dropdown-v91\.js\?v=91\.4/);
  assert.match(index, /app-shell-v88\.html\?v=91\.4/);
});
