const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const guide = read("docs/vduckie-visual-style.md");
const normal = read("assets/vduckie/lv1/egg-normal.svg");
const cracked = read("assets/vduckie/lv1/egg-cracked.svg");
const hatching = read("assets/vduckie/lv1/egg-hatching.svg");
const sprite = read("assets/vduckie/lv2/duckling-sprite.svg");
const manifestSource = read("assets/v96/mascot-manifest-v96.js");
const mascotSource = read("assets/v96/vduckie-mascot-v96.js");
const sharedMascotSource = read("assets/v95/vduckie-mascot-v95.js");
const css = read("assets/v96/vduckie-lv1-lv2-v96.css");
const developer = read("assets/v96/developer-preview-v96.js");
const index = read("index.html");

function loadBrowserModule(source, seed) {
  const window = seed || {};
  const context = vm.createContext({ window, Object, Array, Number, String, Boolean, Math, JSON, Date, console });
  vm.runInContext(source, context);
  return window;
}

function mockV95Manifest() {
  const levels = {};
  for (let level = 1; level <= 10; level += 1) {
    levels[level] = Object.freeze({ level, name: `Level ${level}`, defaultAsset: `legacy-${level}.webp`, renderMode: level === 1 ? "css-egg" : "full-skin" });
  }
  const defaults = Object.freeze({ skin: "default", outfit: "stage-default", glasses: "none", accessory: "none", background: "default", effect: "none" });
  const items = Object.freeze({ outfit: [], accessory: [], background: [], effect: [], skin: [], glasses: [] });
  return {
    VDuckieMascotManifest: Object.freeze({
      version: "95.0",
      states: Object.freeze(["idle", "hover", "tap", "success", "sad", "outfit-change", "level-up", "hatching", "glow"]),
      renderModes: Object.freeze(["full-skin", "sprite", "lottie", "css-egg"]),
      levels: Object.freeze(levels),
      items,
      defaults,
      categories: Object.freeze([]),
      variants: Object.freeze([]),
      motion: Object.freeze({ 1: {}, 2: {} }),
      resolve(query) { return Object.freeze({ level: Number(query.level), asset: `legacy-${query.level}.webp`, renderMode: "full-skin", missingCombination: false }); },
      getItems() { return []; },
      getItem() { return null; }
    })
  };
}

test("visual style guide fixes the shared canvas, safe zone, palette and proportions", () => {
  assert.match(guide, /512 × 512/);
  assert.match(guide, /Safe zone/);
  assert.match(guide, /#FFD447/);
  assert.match(guide, /Head-to-body visual ratio/);
  assert.match(guide, /Transparent background/);
  assert.match(guide, /complete mascot assets, not separate overlays/);
});

test("Level 1 has three aligned transparent SVG assets without complex clip paths", () => {
  for (const source of [normal, cracked, hatching]) {
    assert.match(source, /viewBox="0 0 512 512"/);
    assert.doesNotMatch(source, /<rect[^>]+fill="#fff"/i);
    assert.doesNotMatch(source, /clipPath|mask=/i);
  }
  assert.match(cracked, /stroke="#8C642D"/);
  assert.match(hatching, /VDuckie egg hatching/);
  assert.match(hatching, /ellipse cx="256" cy="235"/);
});

test("Level 2 sprite contains six 512px cells and visibly different character states", () => {
  assert.match(sprite, /viewBox="0 0 3072 512"/);
  for (const frame of ["default", "blink", "look left", "look right", "happy", "sad"]) {
    assert.match(sprite, new RegExp(`frame [0-5]: ${frame}`));
  }
  for (const offset of [0, 512, 1024, 1536, 2048, 2560]) {
    assert.match(sprite, new RegExp(`translate\\(${offset} 0\\)`));
  }
  assert.match(sprite, /eyes-open/);
  assert.match(sprite, /q34-30 68 0/);
  assert.match(sprite, /fill="#86CDE4"/);
});

test("V96 manifest maps only Level 1-2 to new assets and keeps Level 3-10 fallback assets", () => {
  const window = loadBrowserModule(manifestSource, mockV95Manifest());
  const manifest = window.VDuckieMascotManifest;
  assert.equal(manifest.version, "96.0");
  assert.equal(manifest.getLevel(1).renderMode, "svg-sequence");
  assert.equal(manifest.getLevel(2).renderMode, "sprite");
  assert.equal(manifest.level2Sprite.frames, 6);
  assert.equal(manifest.resolve({ level: 2, state: "hover" }).renderMode, "sprite");
  assert.equal(manifest.getLevel(3).defaultAsset, "legacy-3.webp");
  assert.doesNotMatch(manifestSource, /assets\/vduckie\/lv(?:3|4|5|6|7|8|9|10)\//);
});

test("renderer uses the Level 1 frame sequence and Level 2 sprite with safe fallbacks", () => {
  assert.match(mascotSource, /v96-egg-sequence/);
  assert.match(mascotSource, /frame-normal/);
  assert.match(mascotSource, /frame-cracked/);
  assert.match(mascotSource, /frame-hatching/);
  assert.match(mascotSource, /v96-sprite-level-2/);
  assert.match(sharedMascotSource, /hydratedSprites/);
  assert.match(sharedMascotSource, /has-sprite-fallback/);
  assert.doesNotMatch(mascotSource, /glasses-layer|accessory-front-layer|accessory-behind-layer|outfit-layer/);
});

test("Level 1 hatching and Level 2 state animation change frames, not only the whole image transform", () => {
  assert.match(css, /v96-egg-frame-normal/);
  assert.match(css, /v96-egg-frame-cracked/);
  assert.match(css, /v96-egg-frame-hatching/);
  for (const animation of ["v96-lv2-idle-frames", "v96-lv2-look-frames", "v96-lv2-happy-frames", "v96-lv2-sad-frames", "v96-lv2-outfit-frames"]) {
    assert.match(css, new RegExp(animation));
  }
  for (const position of ["20%", "40%", "60%", "80%", "100%"]) assert.match(css, new RegExp(`background-position:${position}`));
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test("Developer Preview can inspect all three egg states and Level 2 animation states", () => {
  for (const action of ["egg-normal", "egg-cracked", "egg-hatching", "lv2-idle", "lv2-hover", "lv2-success", "lv2-sad"]) {
    assert.match(developer, new RegExp(action));
  }
  assert.match(developer, /bridge\.setEggProgress\(12\)/);
  assert.match(developer, /bridge\.setEggProgress\(52\)/);
  assert.match(developer, /bridge\.setEggProgress\(92\)/);
  assert.match(developer, /bridge\.enable\(2\)/);
  assert.doesNotMatch(developer, /awardEXP|total_exp|streak/i);
});

test("production loads V96 patches after the V95 base in dependency order", () => {
  const thoughts = index.indexOf("thoughts-v95.js");
  const baseManifest = index.indexOf("mascot-manifest-v95.js?v=96.0");
  const manifest = index.indexOf("mascot-manifest-v96.js");
  const baseMascot = index.indexOf("vduckie-mascot-v95.js?v=96.0");
  const mascot = index.indexOf("vduckie-mascot-v96.js");
  const store = index.indexOf("customization-store-v94.js?v=96.0");
  const evolution = index.indexOf("vduckie-evolution-v95.js?v=96.0");
  const developerV96 = index.indexOf("developer-preview-v96.js?v=96.0");
  assert.ok(thoughts >= 0 && baseManifest > thoughts && manifest > baseManifest && baseMascot > manifest && mascot > baseMascot && store > mascot && evolution > store && developerV96 > evolution);
  assert.match(index, /vduckie-lv1-lv2-v96\.css\?v=96\.0/);
  assert.match(index, /app-shell-v88\.html\?v=99\.0/);
});
