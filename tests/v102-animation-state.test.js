const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("one shared state vocabulary drives preview, renderer and CSS", () => {
  const window = {};
  vm.runInContext(read("assets/v102/mascot-states-v102.js"), vm.createContext({ window, Object }));
  const config = window.VDuckieMascotStates;
  assert.deepEqual(Object.values(config.values), ["idle", "hover", "tap", "success", "sad", "level-up", "hatching", "glow", "outfit-change", "outfit-confirm"]);
  assert.equal(config.aliases["egg-hatching"], "hatching");
  assert.equal(config.aliases["outfit-check"], "outfit-change");
  for (let level = 2; level <= 8; level += 1) assert.ok(config.framePlans[level].columns >= 6);
});

test("six Developer Preview buttons map to six distinct requested states", () => {
  const preview = read("assets/v93/developer-preview-v93.js");
  const evolution = read("assets/v95/vduckie-evolution-v95.js");
  for (const state of ["level-up", "egg-hatching", "correct-answer", "wrong-answer", "hover", "streak-lost"]) {
    assert.match(preview, new RegExp(`data-v93-test="${state}"`));
  }
  assert.match(preview, /bridge\.test\(test\.getAttribute\("data-v93-test"\)\)/);
  assert.match(evolution, /normalizedAnimation\(name\)/);
  assert.match(evolution, /reportDeveloperAnimation\(name, resolvedName\)/);
});

test("real multi-frame strips are exposed instead of resolving every state to frame zero", () => {
  const renderer = read("assets/v95/vduckie-mascot-v95.js");
  const states = read("assets/v102/mascot-states-v102.js");
  assert.match(renderer, /class="v102-sprite-strip"/);
  assert.match(renderer, /width:" \+ \(columns \* 100\) \+ "%/);
  for (const key of ["hoverA", "hoverB", "success", "sad", "outfit"]) assert.match(states, new RegExp(`${key}: [1-9]`));
});

test("each test state has a distinct one-shot animation and safe idle reset", () => {
  const css = read("assets/v102/sprite-runtime-v102.css");
  const evolution = read("assets/v95/vduckie-evolution-v95.js");
  for (const state of ["hover", "success", "sad", "level-up", "glow"]) {
    assert.match(css, new RegExp(`is-${state}[^}]+animation:v102-${state}`));
  }
  assert.match(css, /not\(\.has-decoded-sprite\)\.is-success/);
  assert.match(css, /not\(\.has-decoded-sprite\)\.is-sad/);
  assert.match(evolution, /clearNodeAnimation\(node\)/);
  assert.match(evolution, /node\.classList\.add\("is-" \+ state\)/);
  assert.match(evolution, /void node\.offsetWidth/);
  assert.match(evolution, /data-v95-animation-class", "is-idle"/);
  assert.match(evolution, /data-v95-animation-duration", "0"/);
});

test("hatching is Level 1-only and pointer hover cannot override a test animation", () => {
  const evolution = read("assets/v95/vduckie-evolution-v95.js");
  assert.match(evolution, /preview\.level = 1/);
  assert.match(evolution, /Egg Hatching chỉ áp dụng cho Level 1/);
  assert.match(evolution, /requestMascotEvent\("hover", \{ force:false \}\)/);
  assert.match(evolution, /state !== current && PRIORITIES\[state\] < \(PRIORITIES\[current\]/);
});

test("glow keeps the current asset and fallback is never removed from the DOM", () => {
  const renderer = read("assets/v95/vduckie-mascot-v95.js");
  const evolution = read("assets/v95/vduckie-evolution-v95.js");
  assert.match(renderer, /v95-sprite-fallback/);
  assert.match(renderer, /v102-sprite-strip/);
  assert.doesNotMatch(evolution.slice(evolution.indexOf("function playNode"), evolution.indexOf("function play(")), /resolved-asset|\.src\s*=/);
});
