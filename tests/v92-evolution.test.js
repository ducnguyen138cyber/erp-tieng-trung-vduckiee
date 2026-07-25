const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getRuntimeSnapshot, assertAssetLoaded, assetPosition } = require('./helpers/runtime-snapshot');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const store = read('assets/v92/progress-store-v92.js');
const manifest = read('assets/v92/evolution-manifest-v92.js');
const evolution = read('assets/v95/vduckie-evolution-v95.js');
const mascot = read('assets/v95/vduckie-mascot-v95.js');
const coreCss = read('assets/v95/vduckie-mascot-core-v95.css');
const motionCss = read('assets/v95/vduckie-mascot-motion-v95.css');
const advancedCss = read('assets/v104/mascot-runtime-v104.css');
const snapshot = getRuntimeSnapshot();

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

test('current evolution renders a separate thought cloud and reduced-motion fallbacks', () => {
  assert.match(mascot, /v95-thought-cloud/);
  assert.match(mascot, /data-v95-thought-zh/);
  assert.match(evolution, /function openThought/);
  assert.match(coreCss, /\.v95-thought-cloud/);
  assert.match(motionCss, /@keyframes v95-success/);
  assert.match(motionCss, /@keyframes v95-sad/);
  assert.match(advancedCss, /@media\(prefers-reduced-motion:reduce\)/);
});

test('current evolution assets load after EXP and before Developer Center', () => {
  for (const asset of ['app-shell-v88.html', 'vduckie-evolution-v92.css', 'exp-core-v90.js', 'progress-store-v92.js', 'evolution-manifest-v92.js', 'vduckie-evolution-v95.js', 'mascot-runtime-v104.css', 'developer-control-center.js']) assertAssetLoaded(assert, asset, { snapshot });
  const exp = assetPosition('exp-core-v90.js', snapshot);
  const progress = assetPosition('progress-store-v92.js', snapshot);
  const manifestPosition = assetPosition('evolution-manifest-v92.js', snapshot);
  const evolutionPosition = assetPosition('vduckie-evolution-v95.js', snapshot);
  const developer = assetPosition('developer-control-center.js', snapshot);
  assert.ok(exp >= 0 && progress > exp, 'Progress store must load after EXP core');
  assert.ok(manifestPosition >= 0 && evolutionPosition > manifestPosition, 'Current evolution runtime must load after its manifest');
  assert.ok(developer > evolutionPosition, 'Developer Center must load after the current evolution runtime');
});
