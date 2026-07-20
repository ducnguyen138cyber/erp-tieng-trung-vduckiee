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
  path.join(root, 'assets', 'home', 'home-layout-stability-v87.3.js'),
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
const dashboardSource = fs.readFileSync(
  path.join(root, 'assets', 'v86', 'home-dashboard-v86.5.js'),
  'utf8'
);
const orderSource = fs.readFileSync(
  path.join(root, 'assets', 'v86', 'home-order-fix-v86.6.js'),
  'utf8'
);
const communitySource = fs.readFileSync(path.join(root, 'community.js'), 'utf8');
const loaderSource = fs.readFileSync(
  path.join(root, 'assets', 'v86', 'experience-suite-loader-v86.js'),
  'utf8'
);

test('welcome mascot restores the original WebP artwork', () => {
  assert.match(indexSource, /<svg class="home-welcome-mascot vduckie-mascot"/);
  assert.match(indexSource, /href="\.\/assets\/home\/vduckie-welcome\.webp\?v=73\.0"/);
  assert.match(cssSource, /background-image:\s*url\("\.\/vduckie-welcome\.webp\?v=73\.0"\)/);
  assert.match(cssSource, /\.vduckie-body-head image\s*\{[^}]*mask:\s*none !important/s);
  assert.match(cssSource, /\.vduckie-wing,[\s\S]*\.vduckie-eyelids\s*\{[^}]*display:\s*none !important/s);
});

test('welcome mascot is completely static', () => {
  assert.doesNotMatch(cssSource, /@keyframes\s+vduckie-/);
  assert.doesNotMatch(cssSource, /animation:\s*vduckie-/);
  assert.match(cssSource, /\.vduckie-mascot\s*\{[^}]*animation:\s*none !important/s);
  assert.match(cssSource, /\.home-welcome-card:hover \.vduckie-wing\s*\{[^}]*animation:\s*none !important/s);
});

test('first paint starts in the final home grid mode and waits for a stable shell', () => {
  assert.match(indexSource, /classList\.add\("vduckie-layout-booting"\)/);
  assert.match(indexSource, /if\(isHome\)html\.classList\.add\("v865-home-mode"\)/);
  assert.match(indexSource, /id="v865HomeDashboardCss"/);
  assert.match(indexSource, /home-layout-stability-v87\.3\.js\?v=87\.3/);
  assert.match(indexSource, /experience-suite-loader-v86\.js\?v=87\.5[\s\S]+home-layout-stability-v87\.3\.js\?v=87\.3/);
  assert.match(cssSource, /\.vduckie-layout-booting\.v865-home-mode #homeHub/);
  assert.match(cssSource, /visibility: hidden !important/);
  assert.match(cssSource, /scrollbar-gutter: stable/);
  assert.match(stabilitySource, /vduckie:experience-v86-ready/);
  assert.match(stabilitySource, /data-layout-version/);
  assert.match(stabilitySource, /setTimeout\(check,32\)/);
  assert.match(stabilitySource, /stableSamples>=4/);
});

test('personal and premium renderers stay inside the final home main column', () => {
  assert.match(personalSource, /main=document\.getElementById\("v865HomeMain"\)/);
  assert.match(personalSource, /node\.style\.order="4"/);
  assert.match(premiumSource, /main=document\.getElementById\("v865HomeMain"\)/);
  assert.match(premiumSource, /node\.style\.order="5"/);
  assert.match(premiumSource, /if\(rendered\|\|tries>40\)clearInterval/);
  assert.match(loaderSource, /personal-dashboard-v85\.js\?v=87\.5/);
  assert.match(loaderSource, /premium-learning-v86\.js\?v=87\.5/);
});

test('account refresh cannot paint the roadmap above the welcome card', () => {
  assert.match(dashboardSource, /roadNode\.style\.order="3"/);
  assert.match(dashboardSource, /oldRoad\.replaceWith\(roadNode\)/);
  assert.match(dashboardSource, /pinMainNode\(main,overview,1\)/);
  assert.match(dashboardSource, /pinMainNode\(main,recommended,2\)/);
  const ignoresNoopAccountRefresh = /changedKeys;return !Array\.isArray\(keys\)\|\|keys\.length>0/;
  assert.match(dashboardSource, ignoresNoopAccountRefresh);
  assert.match(personalSource, ignoresNoopAccountRefresh);
  assert.match(premiumSource, ignoresNoopAccountRefresh);
  assert.match(orderSource, ignoresNoopAccountRefresh);
  assert.match(loaderSource, /home-dashboard-v86\.5\.js\?v=87\.5/);
  assert.match(loaderSource, /home-order-fix-v86\.6\.js\?v=87\.5/);
  assert.match(indexSource, /community\.js\?v=87\.5/);
  assert.match(communitySource, /experience-suite-loader-v86\.js\?v=87\.5/);
});
