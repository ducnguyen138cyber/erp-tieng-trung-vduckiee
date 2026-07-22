const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("production loads V106 after the stable V105 renderer display layer", () => {
  const index = read("index.html");
  assert.ok(index.indexOf("mascot-display-v105.css") < index.indexOf("mascot-polish-v106.css"));
  assert.ok(index.indexOf("learning-events-v103.js") < index.indexOf("mascot-polish-v106.js"));
  assert.match(index, /mascot-polish-v106\.css\?v=106\.0/);
  assert.match(index, /mascot-polish-v106\.js\?v=106\.0/);
});

test("all ten levels receive distinct slow idle and micro behaviours", () => {
  const css = read("assets/v106/mascot-polish-v106.css");
  const names = ["egg", "baby", "student", "university", "office", "manager", "expert", "leader", "master", "grandmaster"];
  names.forEach((name, index) => {
    assert.match(css, new RegExp(`v106-idle-${name}`));
    assert.match(css, new RegExp(`v95-level-${index + 1}\\.is-idle`));
  });
  assert.match(css, /scale\(1\.12\)/);
  assert.match(css, /transform-origin:center bottom/);
  assert.match(css, /v95-motion-accent/);
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

test("preload is limited to the current and next level", () => {
  const js = read("assets/v106/mascot-polish-v106.js");
  assert.match(js, /\[safeLevel\(level\),safeLevel\(level\+1\)\]/);
  assert.doesNotMatch(js, /for\s*\([^)]*<=\s*10/);
  assert.match(js, /preloadImages\.length=0/);
});

test("level-up cinematic contains the complete visual sequence and unlock gift", () => {
  const js = read("assets/v106/mascot-polish-v106.js");
  const css = read("assets/v106/mascot-polish-v106.css");
  assert.match(js, /v106-cinematic-progress/);
  assert.match(js, /v106-cinematic-old/);
  assert.match(js, /v106-cinematic-new/);
  assert.match(js, /谢谢你陪我成长。/);
  assert.match(js, /Cảm ơn vì đã cùng tôi trưởng thành/);
  assert.match(js, /v106-unlock-gift/);
  assert.match(css, /v106-xp-fill/);
  assert.match(css, /v106-gift-open/);
});

test("UI sound stays quiet and lifecycle cleanup is bounded", () => {
  const js = read("assets/v106/mascot-polish-v106.js");
  assert.match(js, /"level-up":\[740,\.055/);
  assert.match(js, /document\.addEventListener\("click",onClick,true\)/);
  assert.match(js, /document\.removeEventListener\("click",onClick,true\)/);
  assert.match(js, /timers\.forEach\(root\.clearTimeout\)/);
  assert.match(js, /cancelAnimationFrame/);
  assert.match(js, /audio\.close\(\)/);
});

test("reduced motion disables decorative movement but keeps the new mascot visible", () => {
  const css = read("assets/v106/mascot-polish-v106.css");
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /\.v106-cinematic-new,.v106-cinematic-thought,.v106-unlock-gift\{opacity:1;transform:none\}/);
  assert.match(css, /\.v106-cinematic-old\{display:none\}/);
});
