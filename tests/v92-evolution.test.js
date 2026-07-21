const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const store = fs.readFileSync(path.join(root, 'assets/v92/progress-store-v92.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'assets/v92/evolution-manifest-v92.js'), 'utf8');
const evolution = fs.readFileSync(path.join(root, 'assets/v92/vduckie-evolution-v92.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/v92/vduckie-evolution-v92.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('progress store delegates level calculation to the existing EXP core', () => {
  assert.match(store, /core\.calculateUserLevel\(totalEXP\)/);
  assert.doesNotMatch(store, /required\s*=\s*level\s*\*\s*200/);
  assert.match(store, /exp\.getCurrentUserEXP\(\)/);
});

test('manifest contains exactly ten evolution stages and wardrobe unlocks at level seven', () => {
  const stageCount = (manifest.match(/\{ level:/g) || []).length;
  assert.equal(stageCount, 10);
  assert.match(evolution, /current\.level < 7/);
  assert.match(manifest, /level: 7[\s\S]*?Mở khóa Tủ đồ/);
});

test('level one egg state uses current level percentage rather than fixed EXP values', () => {
  assert.match(evolution, /function eggState\(progressPercent\)/);
  assert.match(evolution, /progress < 34[\s\S]*?progress < 67/);
  assert.doesNotMatch(evolution, /totalEXP\s*[<>]=?\s*\d+/);
});

test('evolution renders separate HTML thought bubbles and light CSS animations', () => {
  assert.match(evolution, /v92-thought-bubble/);
  assert.match(css, /@keyframes v92-idle/);
  assert.match(css, /@keyframes v92-success/);
  assert.match(css, /@keyframes v92-sad/);
  assert.match(css, /prefers-reduced-motion/);
});

test('v92 assets load after the existing EXP core and use cache busting', () => {
  assert.match(index, /app-shell-v88\.html\?v=92\.0/);
  assert.match(index, /vduckie-evolution-v92\.css\?v=92\.0/);
  assert.match(index, /exp-core-v90\.js\?v=90\.0[\s\S]*?progress-store-v92\.js\?v=92\.0/);
  assert.match(index, /evolution-manifest-v92\.js\?v=92\.0[\s\S]*?vduckie-evolution-v92\.js\?v=92\.0/);
});
