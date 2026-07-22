const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const manifestSource = read("assets/v97/mascot-manifest-v97.js");
const renderer = read("assets/v97/vduckie-mascot-v97.js");
const css = read("assets/v97/vduckie-lv3-lv4-v97.css");
const developer = read("assets/v97/developer-preview-v97.js");
const thoughts = read("assets/v95/thoughts-v95.js");
const index = read("index.html");

function baseManifest() {
  const levels = {};
  for (let level = 1; level <= 10; level += 1) levels[level] = Object.freeze({ level, name: `Level ${level}`, defaultAsset: `legacy-${level}.webp`, renderMode: "full-skin" });
  return Object.freeze({
    version: "96.0", states: Object.freeze(["idle", "hover", "tap", "success", "sad", "outfit-change", "outfit-confirm", "level-up", "hatching", "glow"]),
    renderModes: Object.freeze(["full-skin", "sprite"]), levels: Object.freeze(levels), items: Object.freeze({}), defaults: Object.freeze({ outfit: "stage-default", accessory: "none" }),
    categories: Object.freeze([]), variants: Object.freeze([]), motion: Object.freeze({}), eggAssets: Object.freeze({}), level2Sprite: Object.freeze({}),
    resolve(query) { return Object.freeze({ level: Number(query.level), asset: `legacy-${query.level}.webp`, renderMode: "full-skin" }); }, getItems() { return []; }, getItem() { return null; }
  });
}

test("Level 3 and Level 4 use new complete-skin WebP sprite assets", () => {
  const window = { VDuckieMascotManifest: baseManifest() };
  vm.runInContext(manifestSource, vm.createContext({ window, Object, Array, Number, String, Math }));
  const manifest = window.VDuckieMascotManifest;
  assert.equal(manifest.version, "97.0");
  assert.equal(manifest.resolve({ level: 3, state: "hover" }).frames, 8);
  assert.equal(manifest.resolve({ level: 4, state: "sad" }).frames, 9);
  assert.match(manifest.getLevel(3).defaultAsset, /lv3\/primary-student-sprite\.webp/);
  assert.match(manifest.getLevel(4).defaultAsset, /lv4\/university-student-sprite\.webp/);
  assert.equal(manifest.getLevel(5).defaultAsset, "legacy-5.webp");
  assert.ok(fs.statSync(path.join(root, "assets/vduckie/lv3/primary-student-sprite.webp")).size > 10000);
  assert.ok(fs.statSync(path.join(root, "assets/vduckie/lv4/university-student-sprite.webp")).size > 10000);
});

test("Level 3-4 animations switch character frames for every required interaction", () => {
  for (const name of ["v97-lv3-idle", "v97-lv3-hover", "v97-lv3-success", "v97-lv3-sad", "v97-lv3-outfit", "v97-lv4-idle", "v97-lv4-hover", "v97-lv4-success", "v97-lv4-sad", "v97-lv4-outfit"]) assert.match(css, new RegExp(name));
  assert.match(css, /background-size:800% 100%/);
  assert.match(css, /background-size:900% 100%/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(renderer, /is-sprite-level-/);
  assert.doesNotMatch(renderer + css, /glasses-layer|accessory-front-layer|outfit-layer/);
});

test("Level 3-4 thoughts are centralized, bilingual and have at least ten entries", () => {
  const window = {};
  vm.runInContext(thoughts, vm.createContext({ window, Object, Array, Number, Math }));
  for (const level of [3, 4]) {
    const list = window.VDuckieThoughts.list(level);
    assert.ok(list.length >= 10);
    list.forEach(item => { assert.ok(item.zh.trim()); assert.ok(item.vi.trim()); });
    const first = window.VDuckieThoughts.next(level);
    const second = window.VDuckieThoughts.next(level);
    assert.notEqual(first.id, second.id);
  }
});

test("Developer Preview covers Level 3-4 states without touching EXP", () => {
  for (const state of ["idle", "hover", "tap", "success", "sad", "outfit-change"]) assert.match(developer, new RegExp(`"${state}"`));
  assert.match(developer, /bridge\.enable\(Number\(level\)\)/);
  assert.doesNotMatch(developer, /awardEXP|total_exp|Supabase|streak/i);
});

test("V97 patches load in dependency order using relative URLs", () => {
  assert.match(index, /mascot-manifest-v97\.js\?v=97\.0[^\n]+vduckie-mascot-v95\.js\?v=96\.0/);
  assert.match(index, /vduckie-mascot-v97\.js\?v=97\.0[^\n]+customization-store-v94\.js\?v=96\.0/);
  assert.match(index, /developer-preview-v97\.js\?v=97\.0/);
  assert.match(index, /vduckie-lv3-lv4-v97\.css\?v=97\.0/);
  assert.doesNotMatch(manifestSource + renderer + index, /https:\/\/vduckie\.pages\.dev/);
});
