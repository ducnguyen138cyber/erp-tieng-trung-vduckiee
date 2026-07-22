const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const files = [
  "assets/developer-runtime/runtime.js","assets/developer-events/actions.js","assets/developer-tabs/evolution.js","assets/developer-tabs/animation.js","assets/developer-tabs/learning-speaking.js","assets/developer-tabs/inventory-progress.js","assets/developer-tabs/system.js","assets/developer-debug/debug.js","assets/developer-scenarios/scenarios.js","assets/developer-ui/developer-center.js","assets/developer/developer-control-center.js"
];

test("Developer Center is modular and exposes all twelve requested tabs", () => {
  files.forEach(file => assert.ok(fs.statSync(path.join(root, file)).size > 100, file));
  const source = files.map(read).join("\n");
  const tabs = ["evolution","animation","learning","speaking","inventory","progress","achievement","audio","responsive","performance","debug","scenario"];
  tabs.forEach(tab => assert.match(source, new RegExp(`id:"${tab}"`), tab));
});

test("layout uses sticky header tabs footer and bounded scrollable content", () => {
  const css = read("assets/developer-ui/developer-center.css");
  assert.match(css, /max-height:75vh/);
  assert.match(css, /vdev-header\{position:sticky/);
  assert.match(css, /vdev-tabs\{position:sticky/);
  assert.match(css, /vdev-footer\{position:sticky/);
  assert.match(css, /vdev-scroll\{min-height:0;overflow:auto/);
});

test("search favorites history quick actions and shortcuts are implemented", () => {
  const ui = read("assets/developer-ui/developer-center.js");
  const controller = read("assets/developer/developer-control-center.js");
  for (const marker of ["data-vdev-search","vdev-favorites","vdev-history","reset-preview","replay","reload-assets","reload-manifest","clear-runtime","reset-ui"]) assert.match(ui, new RegExp(marker));
  assert.match(controller, /ctrlKey&&event\.shiftKey/);
  assert.match(controller, /key==="Escape"/);
  assert.match(controller, /toLowerCase\(\)==="d"/);
});

test("sixteen complete website scenarios are registered", () => {
  const source = read("assets/developer-scenarios/scenarios.js");
  assert.equal((source.match(/scenario\("/g) || []).length, 16);
  for (const id of ["new-user","first-login","level-up","outfit-unlock","complete-hsk","ten-wrong","lose-streak","restore-streak","thousand-xp","mic-denied","supabase-offline","network-slow","ai-timeout","speech-error","asset-missing","animation-missing"]) assert.match(source, new RegExp(`scenario\\("${id}"`));
});

test("new Developer modules contain no persistence write calls", () => {
  const source = files.map(read).join("\n");
  const forbidden = [
    "local" + "Storage.setItem", "session" + "Storage.setItem",
    "award" + "EXP(", "save" + "Progress(", "customization" + "Store.save",
    "VDuckie" + "ProgressStore.set", "VDuckie" + "ProgressStore.refresh",
    "fetch" + "("
  ];
  forbidden.forEach(marker => assert.equal(source.includes(marker), false, marker));
});

test("production loader mounts Developer Center modules after V106 in dependency order", () => {
  const index = read("index.html");
  const ordered = ["mascot-polish-v106.js?v=106.1","developer-runtime/runtime.js?v=107.0","developer-events/actions.js?v=107.0","developer-tabs/evolution.js?v=107.0","developer-tabs/animation.js?v=107.0","developer-tabs/learning-speaking.js?v=107.0","developer-tabs/inventory-progress.js?v=107.0","developer-tabs/system.js?v=107.0","developer-debug/debug.js?v=107.0","developer-scenarios/scenarios.js?v=107.0","developer-ui/developer-center.js?v=107.0","developer/developer-control-center.js?v=107.0"];
  ordered.forEach(marker => assert.match(index, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));
  for (let i = 1; i < ordered.length; i += 1) assert.ok(index.indexOf(ordered[i - 1]) < index.indexOf(ordered[i]), `${ordered[i - 1]} before ${ordered[i]}`);
  assert.match(index, /developer-center\.css\?v=107\.0/);
});
