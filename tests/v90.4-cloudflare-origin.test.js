const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  getRuntimeSnapshot,
  assertAssetLoaded,
  getRelativeRuntimeAssets
} = require('./helpers/runtime-snapshot');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const snapshot = getRuntimeSnapshot();
const index = snapshot.indexSource;
const shell = snapshot.shellSource;
const config = read('supabase-config.js');
const sync = read('supabase-sync.js');
const dialogue = read('dialogue.js');
const expCore = read('assets/v90/exp-core-v90.js');

const oldProduction = /https:\/\/ducnguyen138cyber\.github\.io\/erp-tieng-trung-vduckiee\/?/i;
const hardCodedRepoPrefix = /["'`]\/erp-tieng-trung-vduckiee\//i;

test('Supabase OAuth callback follows the deployment that opened the app', () => {
  assert.match(config, /redirectUrl:\s*new URL\("\.\/", window\.location\.href\)\.href/);
  assert.match(sync, /options:\s*\{\s*redirectTo:\s*redirectUrl\(\)\s*\}/);
  assert.doesNotMatch(config, oldProduction);
  assert.doesNotMatch(config, hardCodedRepoPrefix);
});

test('entry loader cache-busts deployment-aware shell, auth and mascot assets', () => {
  for (const asset of ['app-shell-v88.html', 'supabase-config.js', 'supabase-sync.js', 'vduckie-welcome.webp']) {
    assertAssetLoaded(assert, asset, { snapshot });
  }
});

test('runtime source has no old GitHub Pages production URL or fixed repository prefix', () => {
  [index, shell, config, sync, dialogue, expCore].forEach((source) => {
    assert.doesNotMatch(source, oldProduction);
    assert.doesNotMatch(source, hardCodedRepoPrefix);
  });
});

test('runtime assets remain relative for root and repository-subpath deployments', () => {
  const references = getRelativeRuntimeAssets(snapshot);
  assert.ok(references.length > 20, 'Expected a populated runtime asset list');
  references.forEach((reference) => {
    assert.ok(reference.startsWith('./'), `Expected relative asset path, received: ${reference}`);
    assert.doesNotMatch(reference, /\\\.|\\\//, `Escaped regex text was parsed as an asset: ${reference}`);
  });
});

test('audio and authentication runtime do not depend on a deployment hostname', () => {
  assert.match(dialogue, /URL\.createObjectURL\(blob\)/);
  assert.match(dialogue, /speechSynthesis/);
  assert.doesNotMatch(dialogue, /github\.io|pages\.dev/i);
  assert.doesNotMatch(sync, /github\.io|pages\.dev/i);
});

test('there is no service worker or manifest scope retaining the old deployment path', () => {
  assert.doesNotMatch(index + shell, /navigator\.serviceWorker\.register/);
  assert.doesNotMatch(index + shell, /rel=["']manifest["']/i);
});
