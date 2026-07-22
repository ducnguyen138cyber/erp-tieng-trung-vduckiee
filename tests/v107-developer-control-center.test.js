const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const changedModules = [
  "assets/developer-ui/developer-center.js",
  "assets/developer-ui/developer-center.css",
  "assets/developer-tabs/overview.js",
  "assets/developer-debug/debug.js",
  "assets/developer/developer-control-center.js"
];

test("Developer Center exposes eleven workflow tabs and renders one active panel", () => {
  changedModules.forEach(file => assert.ok(fs.statSync(path.join(root, file)).size > 100, file));
  const ui = read("assets/developer-ui/developer-center.js");
  assert.match(ui, /var visibleTabs = \["overview", "evolution", "animation", "learning", "speaking", "progress", "inventory", "audio", "responsive", "scenario", "debug"\]/);
  assert.match(ui, /content\.innerHTML = '<section class="vdev-panel"/);
  assert.doesNotMatch(ui, /visibleTabs\.map\([^\n]*tab\.render/);
  assert.match(ui, /ui\.activeTab === "progress" && ns\.tabs\.achievement/);
});

test("modal is viewport bounded and mobile becomes true full-screen", () => {
  const css = read("assets/developer-ui/developer-center.css");
  assert.match(css, /width:min\(1100px,calc\(100vw - 48px\)\)/);
  assert.match(css, /height:min\(780px,calc\(100dvh - 48px\)\)/);
  assert.match(css, /max-height:calc\(100dvh - 48px\)/);
  assert.match(css, /grid-template-rows:auto auto minmax\(0,1fr\) auto/);
  assert.match(css, /\.vdev-scroll\{[^}]*overflow:auto/);
  assert.match(css, /@media\(max-width:600px\)[\s\S]*width:100vw;height:100dvh/);
  assert.doesNotMatch(css, /\.vdev-center\{[^}]*transform:scale/);
});

test("header tabs footer remain outside the scrolling content body", () => {
  const ui = read("assets/developer-ui/developer-center.js");
  const header = ui.indexOf('<header class="vdev-header">');
  const tabs = ui.indexOf('<nav class="vdev-tabs"');
  const body = ui.indexOf('<main class="vdev-scroll"');
  const footer = ui.indexOf('<footer class="vdev-footer">');
  assert.ok(header >= 0 && header < tabs && tabs < body && body < footer);
});

test("search navigates and focuses instead of executing every matching action", () => {
  const ui = read("assets/developer-ui/developer-center.js");
  assert.match(ui, /data-vdev-search-open/);
  assert.match(ui, /pendingFocus = \{ type: type, id: id \}/);
  assert.match(ui, /activateTab\(tab, false\)/);
  assert.match(ui, /target\.focus/);
  assert.doesNotMatch(ui, /searchTarget[\s\S]{0,180}actions\.run/);
});

test("production loader mounts overview before specialist tabs and busts V107 cache", () => {
  const index = read("index.html");
  const ordered = [
    "mascot-polish-v106.js?v=106.1",
    "developer-runtime/runtime.js?v=107.1",
    "developer-events/actions.js?v=107.1",
    "developer-tabs/overview.js?v=107.1",
    "developer-tabs/evolution.js?v=107.1",
    "developer-debug/debug.js?v=107.1",
    "developer-ui/developer-center.js?v=107.1",
    "developer/developer-control-center.js?v=107.1"
  ];
  ordered.forEach(marker => assert.ok(index.includes(marker), marker));
  for (let i = 1; i < ordered.length; i += 1) assert.ok(index.indexOf(ordered[i - 1]) < index.indexOf(ordered[i]), `${ordered[i - 1]} before ${ordered[i]}`);
  assert.match(index, /developer-center\.css\?v=107\.1/);
});

test("changed Developer modules retain preview-only safety", () => {
  const source = changedModules.filter(file => file.endsWith(".js")).map(read).join("\n");
  const forbidden = [
    "local" + "Storage.setItem", "session" + "Storage.setItem",
    "award" + "EXP(", "save" + "Progress(", "customization" + "Store.save",
    "VDuckie" + "ProgressStore.set", "VDuckie" + "ProgressStore.refresh",
    "fetch" + "("
  ];
  forbidden.forEach(marker => assert.equal(source.includes(marker), false, marker));
});
