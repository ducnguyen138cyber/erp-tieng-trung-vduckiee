const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("dialog has required desktop bounds and mobile full-screen layout", () => {
  const css = read("assets/developer-ui/developer-center.css");
  assert.match(css, /width:min\(1100px,calc\(100vw - 48px\)\)/);
  assert.match(css, /height:min\(780px,calc\(100dvh - 48px\)\)/);
  assert.match(css, /max-height:calc\(100dvh - 48px\)/);
  assert.match(css, /@media\(max-width:640px\)[\s\S]*width:100vw;height:100dvh/);
  assert.doesNotMatch(css, /dev-center-dialog\{[^}]*transform:scale/);
});

test("header tabs body footer are separate and only body scrolls", () => {
  const ui = read("assets/developer-ui/developer-center.js");
  const header = ui.indexOf('<header class="dev-center-header">');
  const tabs = ui.indexOf('<nav class="dev-center-tabs"');
  const body = ui.indexOf('<main class="dev-center-body"');
  const footer = ui.indexOf('<footer class="dev-center-footer">');
  assert.ok(header >= 0 && header < tabs && tabs < body && body < footer);
  const css = read("assets/developer-ui/developer-center.css");
  assert.match(css, /\.dev-center-body\{[^}]*overflow:auto/);
});

test("inactive tabpanels use hidden and do not participate in layout", () => {
  const ui = read("assets/developer-ui/developer-center.js");
  assert.match(ui, /p\.setAttribute\("role","tabpanel"\)/);
  assert.match(ui, /p\.setAttribute\("data-tab-panel",id\)/);
  assert.match(ui, /panels\[x\]\.hidden=x!==id/);
  const css = read("assets/developer-ui/developer-center.css");
  assert.match(css, /\.dev-center-backdrop\[hidden\],\.dev-center-panel\[hidden\],\.dev-center-history\[hidden\]\{display:none!important\}/);
});

test("Evolution renders one selected Level preview instead of ten vertical previews", () => {
  const evolution = read("assets/developer-tabs/evolution.js");
  assert.equal((evolution.match(/renderer\.render\(\{/g) || []).length, 1);
  assert.match(evolution, /for\(var level=1;level<=10;level\+=1\)/);
  assert.match(evolution, /data-dev-single-preview/);
  assert.doesNotMatch(evolution, /Level 2 & Character Preview|Level 10 & Character Preview/);
});

test("Debug is closed accordion with bounded raw JSON", () => {
  const debug = read("assets/developer-debug/debug.js");
  for (const label of ["Runtime State", "Renderer Lifecycle", "Asset Resolver", "Manifest", "Animation Queue", "Event Queue", "Timers", "Listeners", "Raw JSON"]) assert.ok(debug.includes(label), label);
  assert.doesNotMatch(debug, /<details[^>]*\sopen(?:\s|>)/);
  const css = read("assets/developer-ui/developer-center.css");
  assert.match(css, /\.vdev-debug-body pre\{max-height:270px;overflow:auto/);
});

test("body lock, focus trap, ESC and singleton lifecycle are implemented", () => {
  const ui = read("assets/developer-ui/developer-center.js");
  const core = read("assets/developer-ui/developer-center-core.js");
  const controller = read("assets/developer/developer-control-center.js");
  assert.match(core, /b\.classList\.add\("dev-center-open"\)/);
  assert.match(core, /b\.classList\.remove\("dev-center-open"\)/);
  assert.match(core, /root\.scrollTo\(s\.x,s\.y\)/);
  assert.match(core, /function trap\(event,dialog\)/);
  assert.match(ui, /document\.getElementById\("vduckie-developer-center"\)/);
  assert.match(controller, /event\.key === "Escape"/);
});
