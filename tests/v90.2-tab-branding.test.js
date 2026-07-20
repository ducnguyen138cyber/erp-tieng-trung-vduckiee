const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const svg = fs.readFileSync(path.join(root, 'assets', 'favicon-vduckie.svg'), 'utf8');

test('browser tab uses the VDuckie title and versioned relative favicon paths', () => {
  assert.match(index, /<title>VDuckie – Học tiếng Trung<\/title>/);
  assert.match(index, /href="\.\/assets\/favicon-vduckie\.svg\?v=2"/);
  assert.match(index, /href="\.\/assets\/favicon-vduckie-32\.png\?v=2"/);
  assert.match(index, /href="\.\/assets\/vduckie-app-icon\.png\?v=2"/);
  assert.doesNotMatch(index, /href="\/assets\//);
});

test('document-written app shell receives the same title and favicon set', () => {
  assert.match(index, /source=source\.replace\(\/<title>\[\\s\\S\]\*\?<\\\/title>\/i,'<title>VDuckie – Học tiếng Trung<\/title>'\)/);
  assert.match(index, /source=source\.replace\("<\/head>"/);
  assert.match(index, /vduckie-logo\\\.png\\\?v=1/);
});

test('favicon SVG is a simple high-contrast duck head mark', () => {
  assert.match(svg, /viewBox="0 0 64 64"/);
  assert.match(svg, /#ffd63d/);
  assert.match(svg, /#173c34/);
  assert.match(svg, /aria-label="VDuckie"/);
});

test('PNG fallback and Apple touch icon exist', () => {
  const png32 = fs.statSync(path.join(root, 'assets', 'favicon-vduckie-32.png'));
  const apple = fs.statSync(path.join(root, 'assets', 'vduckie-app-icon.png'));
  assert.ok(png32.size > 500);
  assert.ok(apple.size > 1000);
});
