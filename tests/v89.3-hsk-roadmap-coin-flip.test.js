const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const entry = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'assets/v89/hsk-roadmap-v89.3.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/v89/hsk-roadmap-v89.3.css'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.5.js'), 'utf8');

test('entry loads only the corrected v89.3 roadmap layer', () => {
  assert.match(entry, /hsk-roadmap-v89\.3\.css\?v=89\.3/);
  assert.match(entry, /hsk-roadmap-v89\.3\.js\?v=89\.3/);
  assert.doesNotMatch(entry, /hsk-roadmap-v89\.2\.css/);
});

test('runtime creates the required two-sided 3D structure', () => {
  assert.match(ui, /hsk-roadmap-card/);
  assert.match(ui, /hsk-card-inner/);
  assert.match(ui, /hsk-card-front/);
  assert.match(ui, /hsk-card-back/);
  assert.match(ui, /aria-hidden="true"/);
});

test('HSK 5 through HSK 9 are separate locked cards', () => {
  [5, 6, 7, 8, 9].forEach((level) => {
    assert.match(ui, new RegExp('level: ' + level + ', label: "HSK ' + level + '"'));
  });
  assert.match(ui, /data-roadmap-card-count", "10"/);
  assert.match(ui, /button\.disabled = true/);
});

test('coin flip uses two hidden backfaces and stays readable at 50 percent', () => {
  assert.match(css, /transform-style:\s*preserve-3d/);
  assert.match(css, /backface-visibility:\s*hidden/);
  assert.match(css, /\.hsk-card-front\s*\{\s*transform:\s*rotateX\(0deg\)/);
  assert.match(css, /\.hsk-card-back[\s\S]*transform:\s*rotateX\(180deg\)/);
  assert.match(css, /50%\s*\{\s*transform:\s*rotateX\(180deg\) scale\(\.955\)/);
  assert.match(css, /100%\s*\{\s*transform:\s*rotateX\(360deg\) scale\(1\)/);
  assert.doesNotMatch(css, /rotate\(/);
  assert.doesNotMatch(css, /infinite/);
});

test('all ten stages have distinct palettes and responsive fallbacks', () => {
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
