const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { getRuntimeSnapshot, assertAssetLoaded } = require("./helpers/runtime-snapshot");

const root = path.resolve(__dirname, "..");
const snapshot = getRuntimeSnapshot();
const html = snapshot.effectiveHtml;
const css = fs.readFileSync(path.join(root, "v72-layout.css"), "utf8");

for (const requiredId of ["brandHome", "homeHub", "homeHubTitle", "homeRecommendedTitle", "homeJourney"]) {
  assert.match(html, new RegExp(`id="${requiredId}"`), `Missing #${requiredId}`);
}

assert.match(html, /class="home-hub" id="homeHub"/);
assert.match(html, /class="hero hidden" id="erpHero"/);
assert.match(html, /id="cards" class="panel hidden"/);
assert.match(html, /class="journey-card hidden" id="erpJourney"/);
assert.match(html, /function selectHome\(updateUrl\)/);
assert.match(html, /else selectHome\(false\)/);
assert.match(html, /\$\("brandHome"\)\.onclick=function\(\)\{selectHome\(\)\}/);
assert.match(html, /data-home-area="hsk"/);
assert.match(html, /data-home-view="cards"/);
assert.match(html, /data-home-view="dialogue"/);

for (const className of [
  "home-overview-grid",
  "home-resource-grid",
  "home-course-grid",
  "home-route-list"
]) {
  assert.match(css, new RegExp(`\\.${className}`), `Missing .${className}`);
}

const mascotFiles = [
  'duckie-reader-2d-v2.webp', 'duckie-flashcards-2d-v3.webp',
  'duckie-writing-2d-v3.webp', 'duckie-listening-2d-v3.webp', 'duckie-speaking-2d-v5.webp'
];
for (const file of mascotFiles) {
  const filePath = path.join(root, 'assets/mascot', file);
  assert.ok(fs.existsSync(filePath), `Missing mascot ${file}`);
  const size = fs.statSync(filePath).size;
  assert.ok(size > 1000 && size < 300000, `${file} is outside the homepage image budget`);
  assertAssetLoaded(assert, file, {snapshot});
}

console.log("v73 home hub tests passed");
