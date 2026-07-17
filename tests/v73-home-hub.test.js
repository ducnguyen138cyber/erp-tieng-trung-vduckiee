const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
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
  "vduckie-welcome.webp",
  "vduckie-vocabulary.webp",
  "vduckie-grammar.webp",
  "vduckie-listening.webp",
  "vduckie-speaking.webp"
];

for (const file of mascotFiles) {
  const filePath = path.join(root, "assets", "home", file);
  assert.ok(fs.existsSync(filePath), `Missing mascot ${file}`);
  const size = fs.statSync(filePath).size;
  assert.ok(size > 1_000, `${file} is unexpectedly small`);
  assert.ok(size < 100_000, `${file} is too large for the homepage`);
  assert.ok(html.includes(`./assets/home/${file}?v=73.0`), `Homepage does not use ${file}`);
}

console.log("v73 home hub tests passed");
