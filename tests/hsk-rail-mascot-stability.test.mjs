import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(path, 'utf8');

test('legacy and professional HSK rails use compact labels without cramped badges', () => {
  const legacy = read('hsk-lessons.js');
  const pro = read('assets/hsk-content/hsk-professional-runtime.js');
  const css = read('assets/design-system/hsk-rail-stability-v1.css');
  assert.doesNotMatch(legacy, /<span class="hsk-level-medal" aria-hidden="true">/);
  assert.match(legacy, /if \(root\.document\.body && root\.document\.body\.getAttribute\("data-hsk-prof-ready"\) === "true"\) return;/);
  assert.match(pro, /if \(node\.innerHTML !== html\) node\.innerHTML = html;/);
  assert.match(css, /#hskJourney #hskLevels/);
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
  assert.match(css, /max-height:60px!important/);
});

test('new Duckie artwork owns all legacy home fallback images and favicon', () => {
  const manifest = read('assets/v95/mascot-manifest-v95.js');
  const swap = read('assets/design-system/mascot-swap-v1.js');
  const index = read('index.html');
  const shell = read('app-shell-v88.html');
  const worker = read('service-worker.js');
  assert.doesNotMatch(manifest, /assets\/home\/vduckie-(welcome|vocabulary|grammar|listening|speaking)\.webp/);
  assert.match(swap, /\.v95-mascot-image/);
  assert.match(index, /mascot-swap-v1\.js\?v=7/);
  assert.match(index, /duckie-reader-icon-32\.png\?v=4\.0/);
  assert.match(shell, /duckie-reader-icon-32\.png\?v=4\.0/);
  assert.doesNotMatch(shell, /<svg class="home-welcome-mascot vduckie-mascot"/);
  assert.match(shell, /<img class="home-welcome-mascot" src="\.\/assets\/mascot\/duckie-reader-2d-v2\.webp\?v=2\.0"/);
  assert.match(worker, /vduckie-pwa-v23/);
  assert.match(worker, /hsk-rail-stability-v1\.css\?v=1/);
});

test('changed scripts and index bootstrap remain syntactically valid', () => {
  for (const p of ['hsk-lessons.js', 'assets/hsk-content/hsk-professional-runtime.js',
    'assets/design-system/mascot-swap-v1.js', 'assets/v95/mascot-manifest-v95.js']) {
    assert.doesNotThrow(() => new vm.Script(read(p)), p);
  }
  const scripts = [...read('index.html').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  for (const m of scripts) {
    if (/\btype=["']application\/ld\+json["']/i.test(m[1])) {
      assert.doesNotThrow(() => JSON.parse(m[2]), 'JSON-LD must be valid JSON');
    } else {
      assert.doesNotThrow(() => new vm.Script(m[2]), 'Executable inline script must parse');
    }
  }
});
