const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getRuntimeSnapshot, assertAssetLoaded } = require('./helpers/runtime-snapshot');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'assets/v91/header-account-dropdown-v91.js'), 'utf8');
const snapshot = getRuntimeSnapshot();

test('account dropdown uses one explicit open state', () => {
  assert.match(script, /var trigger,dropdown,modal,account,accountObserver,lastFocus,syncQueued=false,isOpen=false/);
  assert.match(script, /function applyOpenState\(open\)/);
  assert.match(script, /dropdown\.hidden=!isOpen/);
  assert.match(script, /dropdown\.style\.display=isOpen\?"block":"none"/);
  assert.match(script, /dropdown\.classList\.toggle\("is-open",isOpen\)/);
});

test('account trigger owns a capture-phase pointer handler', () => {
  assert.match(script, /function handleAccountPointer\(event\)/);
  assert.match(script, /event\.stopImmediatePropagation\(\)/);
  assert.match(script, /root\.addEventListener\("pointerdown",handleAccountPointer,true\)/);
  assert.match(script, /toggle\(\)/);
});

test('current account assets and app shell are cache-busted', () => {
  assertAssetLoaded(assert, 'header-account-dropdown-v91.css', { snapshot });
  assertAssetLoaded(assert, 'header-account-dropdown-v91.js', { snapshot });
  assertAssetLoaded(assert, 'app-shell-v88.html', { snapshot });
});
