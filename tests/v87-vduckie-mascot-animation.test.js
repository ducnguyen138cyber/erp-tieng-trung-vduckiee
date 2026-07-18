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

test('welcome mascot uses inline SVG groups around the current WebP artwork', () => {
  assert.match(indexSource, /<svg class="home-welcome-mascot vduckie-mascot"/);
  assert.match(indexSource, /id="vduckie-body-head"[^>]+data-part="body-head"/);
  assert.match(indexSource, /id="vduckie-eyes"[^>]+data-part="eyes"/);
  assert.match(indexSource, /id="vduckie-wing"[^>]+data-part="wing"/);
  assert.match(indexSource, /href="\.\/assets\/home\/vduckie-welcome\.webp\?v=73\.0"/);
  assert.match(indexSource, /vduckie-mascot-v87\.css\?v=87\.0/);
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
