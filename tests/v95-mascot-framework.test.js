const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const thoughtsSource = read('assets/v95/thoughts-v95.js');
const manifestSource = read('assets/v95/mascot-manifest-v95.js');
const mascotSource = read('assets/v95/vduckie-mascot-v95.js');
const evolutionSource = read('assets/v95/vduckie-evolution-v95.js');
const developerSource = read('assets/v95/developer-preview-v95.js');
const css = ['core','motion','layout'].map(part => read(`assets/v95/vduckie-mascot-${part}-v95.css`)).join('\n');
const index = read('index.html');

function loadBrowserModule(source) {
  const window = {};
  const context = vm.createContext({ window, Math, Object, Array, Number, String, Boolean, JSON, Date, console });
  vm.runInContext(source, context);
  return window;
}

test('thought data has at least ten bilingual lines per level and avoids immediate repeats', () => {
  const window = loadBrowserModule(thoughtsSource);
  for (let level = 1; level <= 10; level += 1) {
    const list = window.VDuckieThoughts.list(level);
    assert.ok(list.length >= 10, `Level ${level} needs at least ten thoughts`);
    for (const thought of list) {
      assert.ok(thought.zh.trim());
      assert.ok(thought.vi.trim());
    }
    let previous = '';
    for (let index = 0; index < 35; index += 1) {
      const current = window.VDuckieThoughts.next(level);
      assert.notEqual(current.id, previous, `Level ${level} repeated immediately`);
      previous = current.id;
    }
  }
});

test('central manifest supports full-skin, sprite and lottie without clothing layers', () => {
  const window = loadBrowserModule(manifestSource);
  const manifest = window.VDuckieMascotManifest;
  assert.deepEqual(Array.from(manifest.states).slice(0, 7), ['idle', 'hover', 'tap', 'success', 'sad', 'outfit-change', 'level-up']);
  assert.match(manifestSource, /renderMode: "full-skin"/);
  assert.ok(Array.from(manifest.renderModes).includes('sprite'));
  assert.ok(Array.from(manifest.renderModes).includes('lottie'));
  assert.deepEqual(Array.from(manifest.categories).map(item => item.key), ['outfit', 'accessory', 'background', 'effect']);
  const missing = manifest.resolve({ level: 6, outfit: 'manager', accessory: 'tablet', state: 'idle' });
  assert.equal(missing.missingCombination, true);
  const available = manifest.resolve({ level: 4, outfit: 'university', accessory: 'book', state: 'hover' });
  assert.equal(available.missingCombination, false);
  assert.equal(available.renderMode, 'full-skin');
});

test('mascot renderer swaps complete assets and exposes future sprite/lottie adapters', () => {
  assert.match(mascotSource, /v95-mascot-image/);
  assert.match(mascotSource, /v95-sprite/);
  assert.match(mascotSource, /v95-lottie-host/);
  assert.match(mascotSource, /registerRenderer/);
  assert.match(mascotSource, /missingCombination/);
  assert.doesNotMatch(mascotSource, /glasses-layer|accessory-front-layer|accessory-behind-layer|outfit-layer/);
  assert.doesNotMatch(mascotSource, /position:\s*absolute[^\n]*glasses/i);
});

test('all levels have distinct idle, hover and tap animation profiles', () => {
  for (let level = 1; level <= 10; level += 1) {
    assert.match(css, new RegExp(`@keyframes v95-idle-${level}`));
    assert.match(css, new RegExp(`@keyframes v95-hover-${level}`));
    assert.match(css, new RegExp(`@keyframes v95-tap-${level}`));
    assert.match(css, new RegExp(`v95-level-${level}\\.is-hover`));
    assert.match(css, new RegExp(`v95-level-${level}\\.is-tap`));
  }
  for (const state of ['success', 'sad', 'outfit-change', 'outfit-confirm', 'level-up', 'hatching', 'glow']) {
    assert.match(css, new RegExp(`v95-${state}`));
  }
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /v95-page-hidden/);
});

test('thought bubble is a visible cloud and interaction uses one active random bubble', () => {
  assert.match(mascotSource, /v95-thought-cloud/);
  assert.match(mascotSource, /data-v95-thought-zh/);
  assert.match(mascotSource, /data-v95-thought-vi/);
  assert.match(css, /z-index:500/);
  assert.match(css, /v95-thought-tail/);
  assert.match(css, /overflow:visible!important/);
  assert.match(evolutionSource, /thoughts\.next\(level\)/);
  assert.match(evolutionSource, /activeThought/);
  assert.match(evolutionSource, /4700/);
  assert.match(evolutionSource, /positionThought/);
});

test('wardrobe previews one category, uses full asset fallback, and saves only on Use', () => {
  for (const token of ['data-v95-category', 'data-v95-item-code', 'data-v95-use', 'data-v95-reset', 'data-v95-close']) {
    assert.match(evolutionSource, new RegExp(token));
  }
  assert.match(evolutionSource, /wardrobeVisual/);
  assert.match(evolutionSource, /wardrobeSwapToken/);
  assert.match(evolutionSource, /root\.clearTimeout\(wardrobeSwapTimer\)/);
  assert.match(evolutionSource, /customizationStore\.save\(wardrobeDraft\)/);
  assert.match(evolutionSource, /Chưa có hình phù hợp/);
  assert.match(css, /grid-template-columns:repeat\(3/);
  assert.match(css, /grid-template-columns:repeat\(2/);
  assert.match(css, /max-height:410px;overflow:auto/);
});

test('developer preview gains tap, thought and outfit tests without changing XP', () => {
  assert.match(developerSource, /data-v93-test/);
  assert.match(developerSource, /"tap"/);
  assert.match(developerSource, /"thought"/);
  assert.match(developerSource, /"outfit-change"/);
  assert.match(evolutionSource, /client\.auth\.getUser\(session\.access_token\)/);
  assert.doesNotMatch(evolutionSource + developerSource, /awardEXP|recordLearningEvent|total_exp\s*[:=]|streak\s*[:=]/i);
});

test('production loads V95 in dependency order and no longer loads layered V94 renderer', () => {
  assert.match(index, /thoughts-v95\.js[^\n]+mascot-manifest-v95\.js/);
  assert.match(index, /vduckie-mascot-v95\.js[^\n]+customization-store-v94\.js[^\n]+vduckie-evolution-v95\.js[^\n]+developer-preview-v93\.js/);
  assert.match(index, /vduckie-mascot-v95\.css\?v=100\.0/);
  assert.match(index, /app-shell-v88\.html\?v=99\.0/);
  assert.doesNotMatch(index, /avatar-config-v94\.js|vduckie-avatar-v94\.js|evolution-customization-v94\.css/);
});
