const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const changedModules = [
  "assets/developer-ui/developer-center-core.js",
  "assets/developer-ui/developer-center.js",
  "assets/developer-ui/developer-center.css",
  "assets/developer-tabs/overview.js",
  "assets/developer-tabs/evolution.js",
  "assets/developer-tabs/animation.js",
  "assets/developer-debug/debug.js",
  "assets/developer/developer-control-center.js",
  "assets/v93/developer-preview-v93.js"
];

test("canonical Developer Center exposes exactly eight workflow tabs", () => {
  changedModules.forEach(file => assert.ok(fs.statSync(path.join(root, file)).size > 100, file));
  const core = read("assets/developer-ui/developer-center-core.js");
  const ui = read("assets/developer-ui/developer-center.js");
  assert.match(core, /var tabs=\["overview","evolution","animation","learning","speaking","progress","scenario","debug"\]/);
  assert.match(ui, /data-tab-panel/);
  assert.match(ui, /p\.hidden=id!==ui\.activeTab/);
});

test("legacy sidebar renderer is removed and old enhancer scripts are absent from production loader", () => {
  const legacy = read("assets/v93/developer-preview-v93.js");
  const index = read("index.html");
  assert.doesNotMatch(legacy, /panelMarkup|ensurePanel|v93DeveloperPreview|document\.body\.appendChild\(panel\)/);
  for (const old of [
    "developer-preview-v93.js", "developer-preview-v95.js", "developer-preview-v96.js",
    "developer-preview-v97.js", "developer-preview-v98.js", "developer-preview-v99.js",
    "developer-preview-v100.js", "developer-preview-v101.js"
  ]) assert.equal(index.includes(old), false, old);
});

test("production loader uses one canonical V108 entrypoint in dependency order", () => {
  const index = read("index.html");
  const ordered = [
    "mascot-polish-v106.js?v=106.1",
    "developer-runtime/runtime.js?v=108.0",
    "developer-events/actions.js?v=108.0",
    "developer-tabs/overview.js?v=108.0",
    "developer-tabs/evolution.js?v=108.0",
    "developer-tabs/animation.js?v=108.0",
    "developer-debug/debug.js?v=108.0",
    "developer-ui/developer-center-core.js?v=108.0",
    "developer-ui/developer-center.js?v=108.0",
    "developer/developer-control-center.js?v=108.0"
  ];
  ordered.forEach(marker => assert.ok(index.includes(marker), marker));
  for (let i = 1; i < ordered.length; i += 1) assert.ok(index.indexOf(ordered[i - 1]) < index.indexOf(ordered[i]), `${ordered[i - 1]} before ${ordered[i]}`);
  assert.match(index, /developer-center\.css\?v=108\.0/);
});

test("controller authorizes from session without recursively listening to bridge authorization", () => {
  const controller = read("assets/developer/developer-control-center.js");
  assert.match(controller, /core\.onSession/);
  assert.match(controller, /evolution\.requestDeveloperBridge\(\)/);
  assert.doesNotMatch(controller, /vduckie:developer-preview-authorized/);
  assert.match(controller, /purgeLegacy/);
});

test("Developer modules retain preview-only safety", () => {
  const source = changedModules.filter(file => file.endsWith(".js")).map(read).join("\n");
  const forbidden = [
    "local" + "Storage.setItem", "session" + "Storage.setItem",
    "award" + "EXP(", "save" + "Progress(", "customization" + "Store.save",
    "VDuckie" + "ProgressStore.set", "VDuckie" + "ProgressStore.refresh",
    "fetch" + "("
  ];
  forbidden.forEach(marker => assert.equal(source.includes(marker), false, marker));
});
