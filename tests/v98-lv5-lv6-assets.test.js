const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const manifestSource = read("assets/v98/mascot-manifest-v98.js");
const renderer = read("assets/v98/vduckie-mascot-v98.js");
const css = read("assets/v98/vduckie-lv5-lv6-v98.css");
const developer = read("assets/v98/developer-preview-v98.js");
const thoughts = read("assets/v95/thoughts-v95.js");
const index = read("index.html");

function baseManifest() {
  const levels = {};
  for (let level = 1; level <= 10; level += 1) levels[level] = Object.freeze({ level, name: `Level ${level}`, defaultAsset: `before-${level}.webp`, renderMode: level <= 4 ? "sprite" : "full-skin" });
  return Object.freeze({ version: "97.0", states: Object.freeze(["idle", "hover", "tap", "success", "sad", "outfit-change", "outfit-confirm", "level-up", "hatching", "glow"]), renderModes: Object.freeze(["full-skin", "sprite"]), levels: Object.freeze(levels), items: Object.freeze({}), defaults: Object.freeze({ outfit: "stage-default", accessory: "none" }), categories: Object.freeze([]), variants: Object.freeze([]), motion: Object.freeze({}), eggAssets: Object.freeze({}), level2Sprite: Object.freeze({}), levelSprites: Object.freeze({ 3: {}, 4: {} }), resolve(query) { return Object.freeze({ level: Number(query.level), asset: `before-${query.level}.webp`, renderMode: "sprite" }); }, getItems() { return []; }, getItem() { return null; } });
}

test("Level 5-6 manifest uses new nine-frame full-skin sprites and preserves Level 1-4", () => {
  const window = { VDuckieMascotManifest: baseManifest() };
  vm.runInContext(manifestSource, vm.createContext({ window, Object, Array, Number, String, Math }));
  const manifest = window.VDuckieMascotManifest;
  assert.equal(manifest.version, "98.0");
  assert.equal(manifest.resolve({ level: 5, state: "hover" }).frames, 9);
  assert.equal(manifest.resolve({ level: 6, state: "sad" }).frames, 9);
  assert.match(manifest.getLevel(5).defaultAsset, /lv5\/office-employee-sprite\.webp/);
  assert.match(manifest.getLevel(6).defaultAsset, /lv6\/young-manager-sprite\.webp/);
  assert.equal(manifest.getLevel(4).defaultAsset, "before-4.webp");
  assert.ok(fs.statSync(path.join(root, "assets/vduckie/lv5/office-employee-sprite.webp")).size > 10000);
  assert.ok(fs.statSync(path.join(root, "assets/vduckie/lv6/young-manager-sprite.webp")).size > 10000);
});

test("Level 5-6 required interactions are frame-driven with reduced-motion fallbacks", () => {
  for (const name of ["v98-lv5-idle", "v98-lv5-hover", "v98-lv5-success", "v98-lv5-sad", "v98-lv5-outfit", "v98-lv6-idle", "v98-lv6-hover", "v98-lv6-success", "v98-lv6-sad", "v98-lv6-outfit"]) assert.match(css, new RegExp(name));
  assert.match(css, /background-size:900% 100%/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(renderer, /v98-character-sprite/);
  assert.match(renderer, /data-v95-render-mode=\\?"sprite/);
  assert.doesNotMatch(renderer + css, /glasses-layer|accessory-front-layer|outfit-layer/);
});

test("Level 5-6 thoughts remain centralized, bilingual and non-repeating", () => {
  const window = {};
  vm.runInContext(thoughts, vm.createContext({ window, Object, Array, Number, Math }));
  for (const level of [5, 6]) {
    const list = window.VDuckieThoughts.list(level);
    assert.ok(list.length >= 10);
    list.forEach(item => { assert.ok(item.zh.trim()); assert.ok(item.vi.trim()); });
    assert.notEqual(window.VDuckieThoughts.next(level).id, window.VDuckieThoughts.next(level).id);
  }
  assert.match(thoughts, /系统里的数据要一致/);
  assert.match(thoughts, /我们一起解决问题/);
});

test("Developer Preview covers every Level 5-6 runtime state without EXP writes", () => {
  for (const state of ["idle", "hover", "tap", "success", "sad", "outfit-change"]) assert.match(developer, new RegExp(`"${state}"`));
  assert.match(developer, /bridge\.enable\(Number\(level\)\)/);
  assert.doesNotMatch(developer, /awardEXP|total_exp|Supabase|streak/i);
});

test("V98 production patches load after V97 using only relative paths", () => {
  assert.match(index, /mascot-manifest-v97\.js\?v=97\.0[^\n]+mascot-manifest-v98\.js\?v=98\.0[^\n]+vduckie-mascot-v95\.js/);
  assert.match(index, /vduckie-mascot-v97\.js\?v=100\.0[^\n]+vduckie-mascot-v98\.js\?v=100\.0[^\n]+customization-store-v94\.js/);
  assert.match(index, /vduckie-lv5-lv6-v98\.css\?v=98\.0/);
  assert.match(index, /developer-preview-v98\.js\?v=98\.0/);
  assert.doesNotMatch(manifestSource + renderer + index, /https:\/\/vduckie\.pages\.dev/);
});
