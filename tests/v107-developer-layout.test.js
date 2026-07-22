const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("only the active tab panel exists in the content layout", () => {
  const ui = read("assets/developer-ui/developer-center.js");
  assert.match(ui, /renderTabBody\(state\)/);
  assert.match(ui, /id="vdev-active-panel" role="tabpanel"/);
  assert.match(ui, /content\.innerHTML =/);
  assert.doesNotMatch(ui, /ns\.tabOrder\.map\(function[^}]+\.render/);
});

test("Debug uses closed accordions with bounded monospace code and Copy", () => {
  const debug = read("assets/developer-debug/debug.js");
  const css = read("assets/developer-ui/developer-center.css");
  assert.match(debug, /<details data-vdev-debug-key=/);
  assert.doesNotMatch(debug, /<details[^>]*\sopen(?:\s|>)/);
  for (const label of ["Runtime State", "Renderer Lifecycle", "Asset Runtime", "Asset Manifest", "Character Preview Level 1–10", "Event Queue", "Animation Queue", "Timer information", "Listener information", "Raw JSON"]) assert.ok(debug.includes(label), label);
  assert.match(debug, /data-vdev-copy-debug/);
  assert.match(css, /\.vdev-debug-body pre\{max-height:270px;overflow:auto/);
  assert.match(css, /Consolas,"SFMono-Regular",Menlo,monospace/);
});

test("Level 1–10 character preview stays on one canvas with a selector", () => {
  const overview = read("assets/developer-tabs/overview.js");
  const index = read("index.html");
  assert.equal((overview.match(/renderer\.render\(\{/g) || []).length, 1);
  assert.ok(index.includes("developer-tabs/evolution.js?v=107.1"));
  const debug = read("assets/developer-debug/debug.js");
  assert.match(debug, /dùng một canvas duy nhất trong tab Evolution/);
  assert.match(debug, /data-vdev-tab-jump="evolution"/);
});

test("action controls remain readable and responsive without scaling the Center", () => {
  const css = read("assets/developer-ui/developer-center.css");
  assert.match(css, /\.vdev-action-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\);gap:10px\}/);
  assert.match(css, /min-height:40px/);
  assert.match(css, /font-size:12px/);
  assert.match(css, /@media\(max-width:900px\)[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:340px\)[\s\S]*grid-template-columns:1fr/);
});

test("body scroll lock restores exact scroll position and focus is trapped", () => {
  const ui = read("assets/developer-ui/developer-center.js");
  assert.match(ui, /body\.style\.position = "fixed"/);
  assert.match(ui, /body\.style\.top = \(-bodyLock\.y\) \+ "px"/);
  assert.match(ui, /root\.scrollTo\(saved\.x, saved\.y\)/);
  assert.match(ui, /function trapFocus\(event\)/);
  assert.match(ui, /event\.key !== "Tab"/);
  assert.match(ui, /previousFocus && previousFocus\.isConnected/);
  assert.match(ui, /focusTarget\.focus/);
});

test("minimize restores a compact DEV launcher without losing active tab", () => {
  const ui = read("assets/developer-ui/developer-center.js");
  assert.match(ui, /function minimize\(\) \{\s*closeInternal\(true\)/);
  assert.match(ui, /launcher\.textContent = ui\.minimized \? "DEV"/);
  assert.doesNotMatch(ui, /ui\.activeTab = "overview";[\s\S]{0,120}function minimize/);
});

test("dialog and tabs expose required accessibility semantics", () => {
  const ui = read("assets/developer-ui/developer-center.js");
  assert.match(ui, /role="dialog" aria-modal="true" aria-labelledby="vdev-dialog-title"/);
  assert.match(ui, /role="tablist"/);
  assert.match(ui, /role="tab"/);
  assert.match(ui, /aria-selected=/);
  assert.match(ui, /ArrowLeft/);
  assert.match(ui, /ArrowRight/);
  const controller = read("assets/developer/developer-control-center.js");
  assert.match(controller, /event\.key === "Escape"/);
  assert.match(controller, /ns\.ui\.state\(\)\.open/);
});
