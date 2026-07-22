const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const scripts = [
  "assets/v95/mascot-manifest-v95.js", "assets/v96/mascot-manifest-v96.js",
  "assets/v97/mascot-manifest-v97.js", "assets/v98/mascot-manifest-v98.js",
  "assets/v99/mascot-manifest-v99.js", "assets/v100/mascot-manifest-v100.js",
  "assets/v95/vduckie-mascot-v95.js", "assets/v96/vduckie-mascot-v96.js",
  "assets/v97/vduckie-mascot-v97.js", "assets/v98/vduckie-mascot-v98.js",
  "assets/v99/vduckie-mascot-v99.js"
];

function runtime() {
  const document = {};
  const window = { document, setTimeout, clearTimeout, location: { hostname: "example.com" } };
  window.window = window;
  const context = vm.createContext({ window, document, console, Object, Array, String, Number, Math, WeakSet, Image: function Image() {} });
  scripts.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  return window;
}

function localPath(url) { return path.join(root, String(url).replace(/^\.\//, "").replace(/\?.*$/, "")); }

test("Level 2-8 resolve to existing primary and distinct static fallback assets", () => {
  const window = runtime();
  for (let level = 2; level <= 8; level += 1) {
    const resolved = window.VDuckieMascot.resolveAsset(level, {}, "idle", false);
    assert.equal(resolved.renderMode, "sprite", `Level ${level} render mode`);
    assert.ok(fs.statSync(localPath(resolved.asset)).size > 100, `Level ${level} primary`);
    assert.ok(fs.statSync(localPath(resolved.fallbackAsset)).size > 100, `Level ${level} fallback`);
    assert.notEqual(resolved.asset, resolved.fallbackAsset, `Level ${level} fallback must be independent`);
    assert.deepEqual(Array.from(resolved.candidates).slice(0, 2), [resolved.asset, resolved.fallbackAsset]);
  }
});

test("shared renderer always emits visible fallback plus runtime diagnostics for Level 2-8", () => {
  const window = runtime();
  for (let level = 2; level <= 8; level += 1) {
    const html = window.VDuckieMascot.render({ level, animationState: "idle" });
    assert.match(html, /class="v95-mascot-image v95-sprite-fallback"/);
    assert.match(html, /data-v95-sprite-src=/);
    assert.match(html, /data-v95-load-status="loading"/);
    assert.match(html, /data-v95-using-fallback="true"/);
  }
});

test("thought bubble uses one pointerenter trigger and stable-open guard", () => {
  const source = fs.readFileSync(path.join(root, "assets/v95/vduckie-evolution-v95.js"), "utf8");
  assert.match(source, /addEventListener\("pointerenter"/);
  assert.doesNotMatch(source, /addEventListener\("pointerover"/);
  assert.match(source, /activeThought === node && node\.classList\.contains\("is-thinking"\)/);
  assert.match(source, /thoughtCloseTimer = root\.setTimeout[\s\S]*?, 200\)/);
  assert.doesNotMatch(source, /setInterval\(/);
});

test("production shell loads V100 manifest before the shared renderer", () => {
  const source = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.ok(source.indexOf("mascot-manifest-v100.js") < source.indexOf("vduckie-mascot-v95.js?v=100.0"));
  assert.match(source, /vduckie-evolution-v95\.js\?v=100\.0/);
  assert.match(source, /regression-v100\.css\?v=100\.0/);
});
