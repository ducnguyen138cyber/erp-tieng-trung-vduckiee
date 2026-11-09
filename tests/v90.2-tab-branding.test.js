const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const svg = fs.readFileSync(path.join(root, 'assets', 'favicon-vduckie.svg'), 'utf8');

const {getRuntimeSnapshot, assertAssetLoaded} = require('./helpers/runtime-snapshot');
const snapshot = getRuntimeSnapshot();
test('browser tab uses the public VDuckie title and deployment-relative icons', () => {
  assert.match(index, /<title>VDuckie – Tự học tiếng Trung HSK miễn phí<\/title>/);
  assertAssetLoaded(assert, 'duckie-reader-icon-192.png', {snapshot,cacheBusted:false});
  assertAssetLoaded(assert, 'duckie-reader-icon-180.png', {snapshot});
  assert.doesNotMatch(snapshot.effectiveHtml, /href="\/assets\//);
});
test('document-written shell receives the same title and current icon set', () => {
  const title = html => html.match(/<title>([^<]+)<\/title>/)[1];
  assert.equal(title(snapshot.effectiveHtml), title(index));
  assert.match(snapshot.effectiveHtml, /rel="icon"[^>]*duckie-reader-icon-192/);
  assert.match(snapshot.effectiveHtml, /rel="apple-touch-icon"[^>]*duckie-reader-icon-180/);
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
