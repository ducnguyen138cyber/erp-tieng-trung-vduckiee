const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const evolution = read("assets/v95/vduckie-evolution-v95.js");
const controller = read("assets/developer/developer-control-center.js");
const tabs = ["assets/developer-tabs/evolution.js", "assets/developer-tabs/animation.js", "assets/developer-tabs/learning-speaking.js", "assets/developer-tabs/inventory-progress.js"].map(read).join("\n");
const css = read("assets/developer-ui/developer-center.css");
const legacy = read("assets/v93/developer-preview-v93.js");
const index = read("index.html");

test("Developer Center is restricted to the exact server-verified Supabase account", () => {
  assert.match(evolution, /DEVELOPER_EMAIL = "ducnguyenn138@gmail\.com"/);
  assert.match(controller, /DEVELOPER_EMAIL = "ducnguyenn138@gmail\.com"/);
  assert.match(evolution, /client\.auth\.getUser\(session\.access_token\)/);
  assert.match(evolution, /verified\.id !== user\.id/);
  assert.match(controller, /requestDeveloperBridge/);
  assert.doesNotMatch(controller, /localStorage|URLSearchParams|location\.search/);
});

test("preview overrides display only and preserves the real progress snapshot", () => {
  assert.match(evolution, /var realSnapshot = null/);
  assert.match(evolution, /buildPreviewSnapshot/);
  assert.match(evolution, /snapshot = preview\.active \? buildPreviewSnapshot/);
  assert.match(evolution, /disablePreviewInternal/);
  assert.doesNotMatch(evolution, /awardEXP|recordLearningEvent|\.from\(|\.upsert\(|\.insert\(|\.update\(/);
  assert.doesNotMatch(controller + tabs, /\.from\(|\.rpc\(|\.upsert\(|\.insert\(|\.update\(/);
});

test("current Developer Center exposes evolution, animation, learning and wardrobe controls", () => {
  for (const action of ["evolution.level-up", "evolution.egg-hatching", "evolution.correct", "evolution.wrong", "evolution.hover", "evolution.streak-lost", "inventory.equip"]) assert.match(tabs, new RegExp(action.replace(".", "\\.")));
  assert.match(tabs, /Level preview/);
  assert.match(tabs, /Thought Bubble/);
  assert.match(css, /dev-center/);
});

test("developer panel is removable and real data is restored", () => {
  assert.match(controller, /currentBridge\.disable\(\)/);
  assert.match(controller, /ns\.ui\.destroy\(\)/);
  assert.match(evolution, /preview\.active = false/);
  assert.match(evolution, /snapshot = realSnapshot/);
  assert.match(evolution, /vduckie:developer-preview-revoked/);
});

test("current Developer Center loads after Evolution and the old V93 runtime is retired", () => {
  assert.match(index, /developer-preview-v93\.css\?v=108\.1/);
  assert.match(index, /vduckie-evolution-v95\.js\?v=104\.0[\s\S]+developer-control-center\.js\?v=108\.1/);
  assert.match(index, /app-shell-v88\.html\?v=99\.0/);
  assert.match(legacy, /removed:\s*true/);
  assert.doesNotMatch(index, /developer-preview-v93\.js/);
});
