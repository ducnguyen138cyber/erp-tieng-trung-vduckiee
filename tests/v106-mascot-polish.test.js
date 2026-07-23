const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("production loads V106.1 after the stable V105 renderer display layer", () => {
  const index = read("index.html") + "\n" + read("app-shell-v88.html");
  assert.ok(index.indexOf("mascot-display-v105.css") < index.indexOf("mascot-polish-v106.css"));
  assert.ok(index.indexOf("learning-events-v103.js") < index.indexOf("mascot-polish-v106.js"));
  assert.match(index, /progress-store-v92\.js\?v=106\.1/);
  assert.match(index, /mascot-polish-v106\.css\?v=106\.1/);
  assert.match(index, /mascot-polish-v106\.js\?v=106\.1/);
});

test("all ten levels retain distinct slow idle behaviours and common scale", () => {
  const css = read("assets/v106/mascot-polish-v106.css");
  const names = ["egg", "baby", "student", "university", "office", "manager", "expert", "leader", "master", "grandmaster"];
  names.forEach((name, index) => {
    assert.match(css, new RegExp(`v106-idle-${name}`));
    assert.match(css, new RegExp(`v95-level-${index + 1}\\.is-idle`));
  });
  assert.match(css, /scale\(1\.12\)/);
  assert.match(css, /transform-origin:center bottom/);
});

test("thought, shadow and parallax polish remain compositor friendly", () => {
  const css = read("assets/v106/mascot-polish-v106.css");
  const js = read("assets/v106/mascot-polish-v106.js");
  assert.match(css, /transition:opacity \.24s ease,transform \.26s/);
  assert.match(css, /v106-shadow-jump/);
  assert.match(js, /requestAnimationFrame/);
  assert.match(js, /x\*1\.1/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(js, /setInterval/);
});

test("preload remains limited to current and next level", () => {
  const js = read("assets/v106/mascot-polish-v106.js");
  assert.match(js, /\[safeLevel\(level\),safeLevel\(level\+1\)\]/);
  assert.doesNotMatch(js, /for\s*\([^)]*<=\s*10/);
  assert.match(js, /preloadImages\.length=0/);
});

test("cinematic owns timers, focus lock, legacy fallback guard and quiet SFX", () => {
  const js = read("assets/v106/mascot-polish-v106.js");
  const css = read("assets/v106/mascot-polish-v106.css");
  assert.match(js, /cinematicSequence/);
  assert.match(js, /entry\.timers\.forEach\(root\.clearTimeout\)/);
  assert.match(js, /handlesLevelUp:true/);
  assert.match(js, /Object\.defineProperty\(overlay,"hidden"/);
  assert.match(js, /document\.addEventListener\("focusin",onFocusIn,true\)/);
  assert.match(js, /"level-up":\[740,\.055/);
  assert.match(css, /pointer-events:auto/);
  assert.match(css, /v106-cinematic-open\{overflow:hidden\}/);
});

test("AudioContext resume is serialized and feedback buttons bypass generic click tone", () => {
  const js = read("assets/v106/mascot-polish-v106.js");
  assert.match(js, /audioResumePromise/);
  assert.match(js, /if\(audioResumePromise\)return audioResumePromise/);
  assert.match(js, /request!==toneSequence/);
  assert.match(js, /isFeedbackButton\(button\)/);
  assert.match(js, /ensureAudioReady\(\);return/);
});

test("reduced motion keeps the new mascot visible and lifecycle cleanup is bounded", () => {
  const css = read("assets/v106/mascot-polish-v106.css");
  const js = read("assets/v106/mascot-polish-v106.js");
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /\.v106-cinematic-new,.v106-cinematic-thought,.v106-unlock-gift\{opacity:1;transform:none\}/);
  assert.match(css, /\.v106-cinematic-old\{display:none\}/);
  assert.match(js, /if\(activeCinematic\)disposeCinematic\(activeCinematic,false\)/);
  assert.match(js, /restoreLegacyGuard\(\)/);
  assert.match(js, /audio\.close\(\)/);
});
