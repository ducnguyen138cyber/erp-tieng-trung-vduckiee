const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

function manifestRuntime() {
  const window = {};
  const context = vm.createContext({ window, Object, Array, Number, String, Math });
  ["assets/v95/mascot-manifest-v95.js", "assets/v96/mascot-manifest-v96.js", "assets/v97/mascot-manifest-v97.js", "assets/v98/mascot-manifest-v98.js", "assets/v99/mascot-manifest-v99.js", "assets/v100/mascot-manifest-v100.js"].forEach(file => vm.runInContext(read(file), context));
  return window.VDuckieMascotManifest;
}

test("idle and unknown states always resolve to a valid Level 2-8 asset", () => {
  const manifest = manifestRuntime();
  for (let level = 2; level <= 8; level += 1) {
    const idle = manifest.resolveMascotAsset({ level, state: "idle" });
    const unknown = manifest.resolveMascotAsset({ level, state: "missing-state" });
    assert.equal(idle.isValid, true);
    assert.ok(idle.asset && idle.fallbackAsset);
    assert.equal(unknown.requestedState, "missing-state");
    assert.equal(unknown.resolvedState, "idle");
    assert.ok(unknown.asset && unknown.fallbackAsset);
  }
});

test("static fallback remains available under the sprite layer and returns in error state", () => {
  const css = read("assets/v101/mascot-stability-v101.css");
  const runtimeCss = read("assets/v102/sprite-runtime-v102.css");
  assert.match(css, /has-loaded-sprite[^}]+sprite-fallback\{opacity:1\}/);
  assert.match(css, /runtime-state="error"[^}]+sprite-fallback\{opacity:1;visibility:visible\}/);
  assert.match(runtimeCss, /has-decoded-sprite \.v95-sprite-fallback\{opacity:0\}/);
  assert.match(runtimeCss, /has-sprite-fallback \.v95-sprite-fallback[^}]+opacity:1/);
});

test("short animation states deterministically reset to visible idle", () => {
  const evolution = read("assets/v95/vduckie-evolution-v95.js");
  assert.match(evolution, /node\.classList\.add\("is-idle"\)/);
  assert.match(evolution, /data-v95-runtime-state", "idle"/);
  assert.match(evolution, /data-v95-resolved-state", "idle"/);
  assert.doesNotMatch(evolution, /setAttribute\([^,]+,\s*(?:null|undefined|"")\)/);
});

test("bubble state is separate from mascot animation state", () => {
  const evolution = read("assets/v95/vduckie-evolution-v95.js");
  const openThought = evolution.slice(evolution.indexOf("function openThought"), evolution.indexOf("function scheduleThoughtClose"));
  assert.doesNotMatch(openThought, /data-v95-state|data-v95-resolved-asset|innerHTML/);
  assert.match(openThought, /classList\.add\("is-thinking"\)/);
});

test("production keeps V101 stability and loads V102 animation runtime", () => {
  const index = read("index.html");
  assert.match(index, /mascot-stability-v101\.css\?v=101\.0/);
  assert.match(index, /developer-preview-v101\.js\?v=102\.0/);
  assert.match(index, /vduckie-mascot-v95\.js\?v=102\.0/);
  assert.match(index, /sprite-runtime-v102\.css\?v=102\.0/);
});
