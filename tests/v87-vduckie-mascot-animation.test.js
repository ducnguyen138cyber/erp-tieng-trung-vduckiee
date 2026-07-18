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
  path.join(root, 'assets', 'home', 'home-layout-stability-v87.2.js'),
  'utf8'
);
const personalSource = fs.readFileSync(
  path.join(root, 'assets', 'v85', 'personal-dashboard-v85.js'),
  'utf8'
);
const premiumSource = fs.readFileSync(
  path.join(root, 'assets', 'v86', 'premium-learning-v86.js'),
  'utf8'
);
const loaderSource = fs.readFileSync(
  path.join(root, 'assets', 'v86', 'experience-suite-loader-v86.js'),
  'utf8'
);

test('welcome mascot uses inline SVG groups around the current WebP artwork', () => {
  assert.match(indexSource, /<svg class="home-welcome-mascot vduckie-mascot"/);
  assert.match(indexSource, /id="vduckie-body-head"[^>]+data-part="body-head"/);
  assert.match(indexSource, /id="vduckie-eyes"[^>]+data-part="eyes"/);
  assert.match(indexSource, /id="vduckie-wing"[^>]+data-part="wing"/);
  assert.match(indexSource, /href="\.\/assets\/home\/vduckie-welcome\.webp\?v=73\.0"/);
  assert.match(indexSource, /vduckie-mascot-v87\.css\?v=87\.2/);
  assert.match(indexSource, /id="vduckieWingAlpha"/);
  assert.match(indexSource, /mask="url\(#vduckieWingAlpha\)"/);
});

test('wing selection follows only the painted hand, cuff and green sleeve', () => {
  assert.match(indexSource, /id="vduckieWingShape" d="M171 216C145 214 118 221 92 232L92 132H0V286H72C92 296 118 306 145 305C156 286 166 252 171 216Z"/);
  assert.match(indexSource, /M161 216C170 239 162 279 147 305L136 301C151 274 158 241 154 219Z/);
  assert.doesNotMatch(indexSource, /<circle cx="154" cy="235" r="22"/);
  assert.match(cssSource, /transform-origin: 45\.97% 38\.57%/);
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

test('first paint starts in the final home grid mode and waits for a stable shell', () => {
  assert.match(indexSource, /classList\.add\("vduckie-layout-booting"\)/);
  assert.match(indexSource, /if\(isHome\)html\.classList\.add\("v865-home-mode"\)/);
  assert.match(indexSource, /id="v865HomeDashboardCss"/);
  assert.match(indexSource, /home-layout-stability-v87\.2\.js\?v=87\.2/);
  assert.match(cssSource, /\.vduckie-layout-booting\.v865-home-mode #homeHub/);
  assert.match(cssSource, /visibility: hidden !important/);
  assert.match(stabilitySource, /vduckie:experience-v86-ready/);
  assert.match(stabilitySource, /data-layout-version/);
  assert.match(stabilitySource, /requestAnimationFrame/);
  assert.match(stabilitySource, /stableFrames>=6/);
});

test('personal and premium renderers stay inside the final home main column', () => {
  assert.match(personalSource, /main=document\.getElementById\("v865HomeMain"\)/);
  assert.match(personalSource, /node\.style\.order="4"/);
  assert.match(premiumSource, /main=document\.getElementById\("v865HomeMain"\)/);
  assert.match(premiumSource, /node\.style\.order="5"/);
  assert.match(premiumSource, /if\(rendered\|\|tries>40\)clearInterval/);
  assert.match(loaderSource, /personal-dashboard-v85\.js\?v=85\.2/);
  assert.match(loaderSource, /premium-learning-v86\.js\?v=86\.3/);
});
