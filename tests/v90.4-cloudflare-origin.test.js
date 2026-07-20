const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const shell = read('app-shell-v88.html');
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

test('entry loader cache-busts the deployment-aware Supabase files', () => {
  assert.match(index, /app-shell-v88\.html\?v=90\.4/);
  assert.match(index, /supabase-config\.js\?v=90\.4/);
  assert.match(index, /supabase-sync\.js\?v=90\.4/);
  assert.match(index, /vduckie-welcome\.webp\?v=90\.4/);
});

test('runtime source has no old GitHub Pages production URL or fixed repository prefix', () => {
  [index, shell, config, sync, dialogue, expCore].forEach((source) => {
    assert.doesNotMatch(source, oldProduction);
    assert.doesNotMatch(source, hardCodedRepoPrefix);
  });
});

test('HTML assets remain relative so root and repository-subpath deployments both work', () => {
  [index, shell].forEach((source) => {
    const references = Array.from(source.matchAll(/\b(?:src|href)="([^"]+)"/g), (match) => match[1]);
    references.forEach((reference) => {
      if (!reference || reference.startsWith('#') || /^(?:https?:|data:|blob:)/i.test(reference)) return;
      assert.ok(reference.startsWith('./'), `Expected relative asset path, received: ${reference}`);
    });
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
