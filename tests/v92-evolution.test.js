const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const store = read('assets/v92/progress-store-v92.js');
const manifest = read('assets/v92/evolution-manifest-v92.js');
const evolution = read('assets/v95/vduckie-evolution-v95.js');
const css = read('assets/v92/vduckie-evolution-v92.css');
const index = read('index.html');

test('progress store delegates level calculation to the existing EXP core', () => {
  assert.match(store, /core\.calculateUserLevel\(totalEXP\)/);
  assert.doesNotMatch(store, /required\s*=\s*level\s*\*\s*200/);
  assert.match(store, /exp\.getCurrentUserEXP\(\)/);
});

test('manifest contains exactly ten evolution stages and wardrobe opens at level seven', () => {
  const stageCount = (manifest.match(/\{ level:/g) || []).length;
  assert.equal(stageCount, 10);
  assert.match(evolution, /function isWardrobeUnlocked\(\) \{ return displayLevel\(\) >= 7 \|\| canUseDeveloper\(\); \}/);
  assert.match(manifest, /level: 7[\s\S]*?Mở khóa Tủ đồ/);
});

test('level one preview uses current progress percentage for the egg', () => {
  assert.match(evolution, /progressPercent: previewLevel === 1 \? clamp\(preview\.eggProgress, 0, 100\)/);
  assert.match(evolution, /progressPercent: options\.progressPercent/);
  assert.doesNotMatch(evolution, /totalEXP\s*[<>]=?\s*\d+/);
});

test('evolution renders separate HTML thought bubbles and reduced-motion CSS', () => {
  assert.match(css, /v92-thought-bubble/);
  assert.match(evolution, /function openThought/);
  assert.match(css, /@keyframes v92-idle/);
  assert.match(css, /@keyframes v92-success/);
  assert.match(css, /@keyframes v92-sad/);
  assert.match(css, /prefers-reduced-motion/);
});

test('current evolution assets load after EXP and before Developer Center', () => {
  assert.match(index, /app-shell-v88\.html\?v=99\.0/);
  assert.match(index, /vduckie-evolution-v92\.css\?v=96\.0/);
  assert.match(index, /exp-core-v90\.js\?v=90\.0[^\n]+progress-store-v92\.js\?v=106\.1/);
  assert.match(index, /evolution-manifest-v92\.js\?v=96\.0[^\n]+vduckie-evolution-v95\.js\?v=104\.0/);
  assert.match(index, /vduckie-evolution-v95\.js\?v=104\.0[\s\S]+developer-control-center\.js\?v=108\.1/);
});
