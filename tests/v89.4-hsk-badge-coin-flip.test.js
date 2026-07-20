const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const entry = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'assets/v89/hsk-roadmap-v89.4.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/v89/hsk-roadmap-v89.4.css'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.5.js'), 'utf8');

test('entry loads only badge-flip roadmap v89.4', () => {
  assert.match(entry, /hsk-roadmap-v89\.4\.css\?v=89\.4/);
  assert.match(entry, /hsk-roadmap-v89\.4\.js\?v=89\.4/);
  assert.doesNotMatch(entry, /hsk-roadmap-v89\.3/);
});

test('runtime creates two faces only inside the round badge', () => {
  assert.match(ui, /hsk-level-badge/);
  assert.match(ui, /hsk-badge-inner/);
  assert.match(ui, /hsk-badge-front/);
  assert.match(ui, /hsk-badge-back/);
  assert.doesNotMatch(ui, /hsk-card-inner/);
  assert.doesNotMatch(ui, /hsk-card-front/);
  assert.doesNotMatch(ui, /hsk-card-back/);
});

test('HSK 5 through HSK 9 remain separate locked cards', () => {
  [5, 6, 7, 8, 9].forEach((level) => {
    assert.match(ui, new RegExp('level: ' + level + ', label: "HSK ' + level + '"'));
  });
  assert.match(ui, /data-roadmap-card-count", "10"/);
  assert.match(ui, /button\.disabled = true/);
});

test('only the badge performs the two-sided coin flip', () => {
  assert.match(css, /\.hsk-level-badge[\s\S]*perspective:\s*700px/);
  assert.match(css, /\.hsk-badge-inner[\s\S]*transform-style:\s*preserve-3d/);
  assert.match(css, /\.hsk-badge-face[\s\S]*backface-visibility:\s*hidden/);
  assert.match(css, /\.hsk-badge-front\s*\{\s*transform:\s*rotateX\(0deg\)/);
  assert.match(css, /\.hsk-badge-back\s*\{\s*transform:\s*rotateX\(180deg\)/);
  assert.match(css, /\.hsk-roadmap-card:hover \.hsk-badge-inner[\s\S]*hsk-badge-coin-flip 740ms/);
  assert.match(css, /50%\s*\{\s*transform:rotateX\(180deg\) scale\(\.9\)/);
  assert.match(css, /100%\s*\{\s*transform:rotateX\(360deg\) scale\(1\)/);
  assert.doesNotMatch(css, /infinite/);
});

test('card text, progress and card body never receive flip transforms', () => {
  assert.match(css, /\.hsk-roadmap-card[\s\S]*transform:\s*none/);
  assert.match(css, /\.hsk-roadmap-card strong[\s\S]*transform:\s*none/);
  assert.match(css, /\.hsk-roadmap-card small[\s\S]*transform:\s*none/);
  assert.match(css, /\.hsk-roadmap-track[\s\S]*transform:\s*none/);
  assert.doesNotMatch(css, /\.hsk-roadmap-card[^\{]*\{[^\}]*rotateX/s);
  assert.doesNotMatch(css, /\.hsk-roadmap-card[^\{]*\{[^\}]*animation:\s*hsk-badge-coin-flip/s);
});

test('all ten palettes and accessibility fallbacks remain present', () => {
  for (let level = 0; level <= 9; level += 1) {
    assert.match(css, new RegExp('data-v865-level="' + level + '"'));
  }
  assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)/);
  assert.match(css, /@media \(hover:none\), \(pointer:coarse\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /scroll-snap-type:\s*x proximity/);
  assert.match(css, /text-overflow:\s*ellipsis/);
});

test('existing progress and click logic remains unchanged', () => {
  assert.match(dashboard, /stage\.progress=stage\.active\?levelProgress/);
  assert.match(dashboard, /navigateHskLevel\(Number\(button\.getAttribute\("data-v865-level"\)\)\)/);
});
