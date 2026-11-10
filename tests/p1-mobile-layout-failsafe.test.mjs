// Prevent a slow mobile cold start from exposing the unfinished home grid.
// This checks the actual bootstrap script, not a rewritten test-only copy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const shell = readFileSync(new URL('../app-shell-v88.html', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../assets/home/vduckie-mascot-v87.css', import.meta.url), 'utf8');
const stability = readFileSync(new URL('../assets/home/home-layout-stability-v87.3.js', import.meta.url), 'utf8');
const headBootstrap = shell.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
assert.ok(headBootstrap?.includes('__VDUCKIE_LAYOUT_FAILSAFE__'), 'bootstrap script not found');

function boot(search='', hash='') {
  const classes = new Set();
  const timers = [];
  const root = {
    document: { documentElement: { classList: {
      add(...values) { values.forEach(value => classes.add(value)); },
      remove(...values) { values.forEach(value => classes.delete(value)); },
      contains(value) { return classes.has(value); }
    } } },
    location: {search,hash},
    setTimeout(callback, delay) { timers.push({callback,delay}); return timers.length; }
  };
  runInNewContext(headBootstrap, {window:root,URLSearchParams});
  return {classes,timers,root};
}

test('home remains guarded during a throttled 16+ second cold load', () => {
  const {classes,timers,root}=boot();
  assert.ok(classes.has('v865-home-mode'));
  assert.ok(classes.has('vduckie-layout-booting'));
  assert.equal(root.__VDUCKIE_LAYOUT_FAILSAFE__,1);
  assert.equal(timers.length,1);
  assert.ok(timers[0].delay>=20000, 'five-second failsafe exposes a shifting unfinished home');
  assert.ok(timers[0].delay<=35000, 'recovery must still be bounded if bootstrap fails');
  assert.match(styles,/\.vduckie-layout-booting\.v865-home-mode\s+#homeHub\s*\{[^}]*visibility:\s*hidden/i);
  assert.match(stability,/clearTimeout\(root\.__VDUCKIE_LAYOUT_FAILSAFE__\)/);
  assert.match(stability,/classList\.add\("vduckie-layout-ready"\)/);
  assert.ok(classes.has('vduckie-layout-booting'), 'timers should not execute early');
  timers[0].callback();
  assert.ok(!classes.has('vduckie-layout-booting'), 'failed load eventually unblocks the screen');
});

test('ERP and HSK deep links do not inherit home-only layout mode', () => {
  for(const [search,hash] of [['?area=erp',''],['?area=hsk',''],['','#hsk']]){
    const {classes}=boot(search,hash);
    assert.ok(!classes.has('v865-home-mode'),search||hash);
  }
});
