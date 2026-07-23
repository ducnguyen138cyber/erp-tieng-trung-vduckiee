const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

function loadRuntime() {
  const window = {};
  const context = vm.createContext({ window, Object, Math, Number, String });
  for (const file of [
    "assets/v95/mascot-manifest-v95.js", "assets/v96/mascot-manifest-v96.js",
    "assets/v97/mascot-manifest-v97.js", "assets/v98/mascot-manifest-v98.js",
    "assets/v99/mascot-manifest-v99.js", "assets/v100/mascot-manifest-v100.js",
    "assets/v103/mascot-manifest-v103.js", "assets/v104/mascot-manifest-v104.js"
  ]) vm.runInContext(read(file), context);
  return window.VDuckieMascotManifest;
}

test("Level 9-10 resolve to real nine-frame sprites and visible static fallback", () => {
  const manifest = loadRuntime();
  for (const level of [9, 10]) {
    for (const state of ["idle", "hover", "correct-answer", "wrong-answer", "pronunciation-good", "pronunciation-wrong", "lesson-complete", "level-up", "streak-lost", "outfit-change"]) {
      const resolved = manifest.resolve({ level, state });
      assert.equal(resolved.renderMode, "sprite");
      assert.equal(resolved.frames, 9);
      assert.equal(resolved.resolvedState, state);
      for (const asset of [resolved.asset, resolved.fallbackAsset]) assert.ok(fs.existsSync(path.join(root, asset.replace(/^\.\//, "").split("?")[0])));
    }
  }
});

test("Level 9-10 sprite sheets have nine square alpha frames without black edge bars", () => {
  for (const [level, name] of [[9, "master"], [10, "grandmaster"]]) {
    const sprite = path.join(root, `assets/vduckie/lv${level}/${name}-sprite-v104.webp`);
    const dimensions = execFileSync("identify", ["-format", "%wx%h %[opaque]", sprite], { encoding:"utf8" });
    assert.equal(dimensions.toLowerCase(), "4608x512 false");
    for (let frame = 0; frame < 9; frame += 1) {
      const file = path.join(root, `assets/vduckie/lv${level}/v104/frame-${frame}.webp`);
      assert.ok(fs.statSync(file).size > 1000);
      assert.equal(execFileSync("identify", ["-format", "%wx%h %[pixel:p{0,256}] %[pixel:p{511,256}]", file], { encoding:"utf8" }), "512x512 srgba(0,0,0,0) srgba(0,0,0,0)");
    }
  }
});

test("Master and Grandmaster behavior/state mappings are explicit and one-shot", () => {
  const behavior = read("assets/v104/mascot-behaviors-v104.js");
  const css = read("assets/v104/mascot-runtime-v104.css");
  const evolution = read("assets/v95/vduckie-evolution-v95.js");
  for (const marker of ["master-look-up-smile-nod", "grandmaster-close-book-nod-adjust-glasses", "grandmaster-lower-book-sigh"]) assert.match(behavior, new RegExp(marker));
  assert.match(css, /v104-hover-master 1\.18s[^}]+both/);
  assert.match(css, /v104-hover-grandmaster 1\.28s[^}]+both/);
  assert.doesNotMatch(css, /is-hover[^}]+infinite/);
  assert.match(evolution, /pointerInsideMascot/);
  assert.match(evolution, /eventLevel === 9[^]*再听一次/);
  assert.match(evolution, /eventLevel === 10[^]*慢一点/);
});

test("Level 9 and 10 each have at least twenty age-appropriate bilingual thoughts", () => {
  const window = {};
  vm.runInContext(read("assets/v95/thoughts-v95.js"), vm.createContext({ window, Object, Math }));
  for (const level of [9, 10]) {
    const thoughts = window.VDuckieThoughts.list(level);
    assert.ok(thoughts.length >= 20);
    assert.ok(thoughts.every(item => item.zh && item.vi));
  }
});

test("production loads V104 behavior, manifest and CSS before the shared renderer", () => {
  const index = read("index.html") + "\n" + read("app-shell-v88.html");
  assert.match(index, /mascot-runtime-v104\.css\?v=104\.0/);
  assert.ok(index.indexOf("mascot-behaviors-v104.js") < index.indexOf("vduckie-mascot-v95.js?v=104.0"));
  assert.ok(index.indexOf("mascot-manifest-v104.js") < index.indexOf("vduckie-mascot-v95.js?v=104.0"));
  assert.match(index, /vduckie-evolution-v95\.js\?v=104\.0/);
});
