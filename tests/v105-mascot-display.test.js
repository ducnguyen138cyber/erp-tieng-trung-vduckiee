const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("desktop mascot stage expands to 360px and full width", () => {
  const css = read("assets/v105/mascot-display-v105.css");
  assert.match(css, /\.v92-evolution-card\{width:100%/);
  assert.match(css, /\.v92-evolution-visual[^}]+min-height:390px/);
  assert.match(css, /\.v92-evolution-visual \.v95-mascot[^}]+640px[^}]+max-height:360px/);
  assert.match(css, /\.v95-size-large[^}]+--v95-size:290px[^}]+max-height:360px/);
});

test("animation containers stay visible while sprite frame clipping remains isolated", () => {
  const css = read("assets/v105/mascot-display-v105.css");
  const sprite = read("assets/v102/sprite-runtime-v102.css");
  assert.match(css, /v95-character[^}]+overflow:visible/);
  assert.match(css, /v95-visual[^}]+overflow:visible/);
  assert.match(css, /v92-stage-card-visual[^}]+overflow:visible/);
  assert.match(sprite, /\.v95-sprite-stack\{overflow:hidden\}/);
});

test("all display contexts and responsive breakpoints receive proportional sizes", () => {
  const css = read("assets/v105/mascot-display-v105.css");
  assert.match(css, /v95-size-medium[^}]+223px/);
  assert.match(css, /v95-size-compact[^}]+140px/);
  assert.match(css, /v95-wardrobe-preview[^}]+padding:24px/);
  for (const width of [1180,900,700,390]) assert.match(css, new RegExp(`max-width:${width}px`));
});

test("production loads V105 after all earlier mascot runtime layers", () => {
  const index = read("index.html");
  assert.ok(index.indexOf("mascot-runtime-v104.css") < index.indexOf("mascot-display-v105.css"));
  assert.match(index, /mascot-display-v105\.css\?v=105\.0/);
});
