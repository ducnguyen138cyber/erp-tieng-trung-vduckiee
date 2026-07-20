const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const entry = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'assets/v86/home-dashboard-v86.5.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/v89/hsk-roadmap-v89.2.css'), 'utf8');

test('v89.2 stylesheet is loaded without changing roadmap data or click logic', () => {
  assert.match(entry, /hsk-roadmap-v89\.2\.css\?v=89\.2/);
  assert.match(dashboard, /stage\.current=stage\.level===current/);
  assert.match(dashboard, /stage\.progress=stage\.active\?levelProgress/);
  assert.match(dashboard, /data-v865-level/);
  assert.match(dashboard, /navigateHskLevel\(Number\(button\.getAttribute\("data-v865-level"\)\)\)/);
});

test('all seven roadmap stages have their own coordinated palette', () => {
  ['0','1','2','3','4','5','7'].forEach((level) => {
    assert.match(css, new RegExp('data-v865-level="' + level + '"'));
  });
  assert.match(css, /--road-color/);
  assert.match(css, /--road-border/);
  assert.match(css, /--road-track/);
  assert.match(css, /linear-gradient\(90deg,var\(--road-dark\),var\(--road-color\)\)/);
});

test('hover, current and locked states remain distinct and accessible', () => {
  assert.match(css, /\.v865-road-stage:not\(\.locked\):hover/);
  assert.match(css, /translateY\(-6px\).*rotateX\(2\.5deg\).*rotateY\(-2deg\).*scale\(1\.018\)/s);
  assert.match(css, /rotate\(180deg\) scale\(1\.08\)/);
  assert.match(css, /\.v865-road-stage\.current/);
  assert.match(css, /content: "Đang học"/);
  assert.match(css, /\.v865-road-stage\.locked/);
  assert.match(css, /cursor: not-allowed/);
  assert.match(css, /:focus-visible/);
});

test('progress, mobile and reduced-motion fallbacks are present', () => {
  assert.match(css, /@keyframes v89-road-progress-in/);
  assert.match(css, /animation: v89-road-progress-in/);
  assert.match(css, /@media \(max-width:860px\)/);
  assert.match(css, /@media \(max-width:620px\)/);
  assert.match(css, /@media \(hover:none\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /scroll-snap-type: x proximity/);
  assert.match(css, /text-overflow: ellipsis/);
});
