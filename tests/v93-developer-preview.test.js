const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const evolution = fs.readFileSync(path.join(root, "assets/v92/vduckie-evolution-v92.js"), "utf8");
const developer = fs.readFileSync(path.join(root, "assets/v93/developer-preview-v93.js"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/v93/developer-preview-v93.css"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

test("developer preview is restricted to the exact verified Supabase account", () => {
  assert.match(evolution, /DEVELOPER_EMAIL = "ducnguyenn138@gmail\.com"/);
  assert.match(developer, /DEVELOPER_EMAIL = "ducnguyenn138@gmail\.com"/);
  assert.match(evolution, /client\.auth\.getUser\(session\.access_token\)/);
  assert.match(evolution, /verified\.id !== user\.id/);
  assert.match(evolution, /normalizedEmail\(verified\.email\) !== DEVELOPER_EMAIL/);
  assert.doesNotMatch(developer, /localStorage|URLSearchParams|location\.search/);
});

test("preview overrides display only and preserves the real progress snapshot", () => {
  assert.match(evolution, /var realSnapshot = null/);
  assert.match(evolution, /buildPreviewSnapshot/);
  assert.match(evolution, /totalEXP: Number\(base\.totalEXP/);
  assert.match(evolution, /snapshot = preview\.active && canUseDeveloper\(\) \? buildPreviewSnapshot\(\) : next/);
  assert.match(evolution, /disablePreviewInternal/);
  assert.doesNotMatch(evolution, /awardEXP|recordLearningEvent|\.from\(|\.upsert\(|\.insert\(|\.update\(/);
  assert.doesNotMatch(developer, /\.from\(|\.rpc\(|\.upsert\(|\.insert\(|\.update\(/);
});

test("all developer controls and wardrobe categories are available", () => {
  ["level-up", "egg-hatching", "success", "sad", "hover", "glow"].forEach((name) => {
    assert.match(developer, new RegExp(`data-v93-test="${name}"`));
  });
  ["skin", "glasses", "accessory", "background", "effect"].forEach((group) => {
    assert.match(evolution, new RegExp(`${group}: Object\\.freeze`));
  });
  assert.match(developer, /Level preview/);
  assert.match(evolution, /data-v93-preview-level/);
  assert.match(evolution, /v93LevelUpOverlay/);
});

test("developer panel is removable and real data is restored", () => {
  assert.match(developer, /data-v93-real/);
  assert.match(developer, /bridge\.disable\(\)/);
  assert.match(evolution, /preview\.active = false/);
  assert.match(evolution, /snapshot = realSnapshot/);
  assert.match(evolution, /vduckie:developer-preview-revoked/);
});

test("v93 assets are loaded after the existing Evolution module", () => {
  assert.match(index, /developer-preview-v93\.css\?v=93\.0/);
  assert.match(index, /vduckie-evolution-v92\.js\?v=93\.0[\s\S]*developer-preview-v93\.js\?v=93\.0/);
  assert.match(index, /app-shell-v88\.html\?v=93\.0/);
  assert.match(css, /\.v93-developer-panel/);
  assert.match(css, /@keyframes v93-egg-hatching/);
});
