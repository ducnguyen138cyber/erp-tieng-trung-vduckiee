const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const cssSource = fs.readFileSync(
  path.join(root, 'assets', 'home', 'vduckie-mascot-v87.css'),
  'utf8'
);
const stabilitySource = fs.readFileSync(
  path.join(root, 'assets', 'home', 'home-layout-stability-v87.1.js'),
  'utf8'
);

test('welcome mascot uses inline SVG groups around the current WebP artwork', () => {
  assert.match(indexSource, /<svg class="home-welcome-mascot vduckie-mascot"/);
  assert.match(indexSource, /id="vduckie-body-head"[^>]+data-part="body-head"/);
  assert.match(indexSource, /id="vduckie-eyes"[^>]+data-part="eyes"/);
  assert.match(indexSource, /id="vduckie-wing"[^>]+data-part="wing"/);
  assert.match(indexSource, /href="\.\/assets\/home\/vduckie-welcome\.webp\?v=73\.0"/);
  assert.match(indexSource, /vduckie-mascot-v87\.css\?v=87\.1/);
  assert.match(indexSource, /id="vduckieWingAlpha"/);
  assert.match(indexSource, /mask="url\(#vduckieWingAlpha\)"/);
});

test('idle animation breathes and blinks continuously', () => {
  assert.match(cssSource, /@keyframes vduckie-breathe/);
  assert.match(cssSource, /@keyframes vduckie-blink/);
  assert.match(cssSource, /\.vduckie-idle\s*\{[^}]*animation: vduckie-breathe[^;]+infinite/s);
  assert.match(cssSource, /\.vduckie-eyelids\s*\{[^}]*animation: vduckie-blink[^;]+infinite/s);
});

test('hover waves the separated wing and success bounces for one second', () => {
  assert.match(cssSource, /\.home-welcome-card:hover \.vduckie-wing/);
  assert.match(cssSource, /@keyframes vduckie-wave/);
  assert.match(cssSource, /\.home-welcome-mascot\.vduckie-success/);
  assert.match(cssSource, /animation: vduckie-success-bounce 1s/);
});

test('motion respects the reduced-motion preference', () => {
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)/);
});

test('first paint waits for the final v86.5 home shell', () => {
  assert.match(indexSource, /classList\.add\("vduckie-layout-booting"\)/);
  assert.match(indexSource, /id="v865HomeDashboardCss"/);
  assert.match(indexSource, /home-layout-stability-v87\.1\.js\?v=87\.1/);
  assert.match(cssSource, /\.vduckie-layout-booting #homeHub/);
  assert.match(stabilitySource, /vduckie:experience-v86-ready/);
  assert.match(stabilitySource, /data-layout-version/);
  assert.match(stabilitySource, /requestAnimationFrame/);
});
