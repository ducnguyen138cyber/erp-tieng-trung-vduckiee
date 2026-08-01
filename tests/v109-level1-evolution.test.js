const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");

function loadRenderer() {
  const delegated = [];
  const base = {
    version: "current-runtime",
    render(options) {
      delegated.push({ ...options });
      const level = Number(options.level || 1);
      if (level === 1) {
        return '<button class="v95-mascot v95-size-large v95-level-1 is-egg is-' + (options.animationState || "idle") + '" data-v95-level="1" data-v95-render-mode="svg-sequence" data-v95-resolved-asset="legacy"><span class="v95-character"><span class="v95-visual"><span class="v96-egg-sequence is-normal" data-v96-egg-state="normal" aria-hidden="true"><img class="v96-egg-frame frame-normal"><img class="v96-egg-frame frame-cracked"><img class="v96-egg-frame frame-hatching"></span></span></span></button>';
      }
      return '<button class="v95-mascot v95-level-' + level + '" data-v95-level="' + level + '" data-v95-render-mode="sprite" data-v95-resolved-asset="current-level-' + level + '"></button>';
    },
    hydrate() {},
    getStage() {},
    getStages() {},
    getItem() {},
    getItems() {},
    getCategories() {},
    defaults() { return {}; },
    normalizeSelection() {},
    resolveSelection() {},
    resolveAsset() {},
    selectionStatus() {},
    isCompatible() {},
    incompatibilityReason() {},
    itemThumbnail() { return ""; },
    preloadItem() {},
    preloadAsset() {},
    registerRenderer() {}
  };
  const context = { window: { VDuckieMascot: base, VDuckieAvatar: base } };
  context.window.window = context.window;
  vm.runInNewContext(read("assets/v109/level1-manifest-v109.js"), context);
  vm.runInNewContext(read("assets/v109/vduckie-level1-v109.js"), context);
  return { api: context.window.VDuckieMascot, delegated };
}

test("Level 1 maps exact EXP boundaries to four polished states and Level 2 at 100%", () => {
  const { api } = loadRenderer();
  const cases = [[0,"resting"],[24,"resting"],[25,"first-crack"],[49,"first-crack"],[50,"peek"],[74,"peek"],[75,"ready"],[99,"ready"],[100,"hatched"]];
  for (const [progress, expected] of cases) assert.equal(api.getLevel1State(progress), expected, String(progress));
  for (const [progress, expected] of cases.slice(0, -1)) {
    const html = api.render({ level: 1, progressPercent: progress, animationState: "idle" });
    assert.match(html, new RegExp('data-v109-egg-stage="' + expected + '"'));
    assert.match(html, /data-v95-level="1"/);
    assert.doesNotMatch(html, /v96-egg-sequence/);
  }
  const hatched = api.render({ level: 1, progressPercent: 100, animationState: "idle" });
  assert.match(hatched, /data-v95-level="2"/);
  assert.match(hatched, /data-v109-origin-level="1"/);
});

test("Level 2 through Level 10 delegate unchanged to the existing renderer", () => {
  const { api, delegated } = loadRenderer();
  for (let level = 2; level <= 10; level += 1) {
    const options = { level, progressPercent: 37, animationState: "idle", marker: "same-contract" };
    const html = api.render(options);
    assert.match(html, new RegExp('data-v95-level="' + level + '"'));
    assert.equal(delegated[delegated.length - 1].level, level);
    assert.equal(delegated[delegated.length - 1].marker, "same-contract");
  }
});

test("Level 1 assets share a fixed 16:9 canvas and current Level 2 palette", () => {
  const assets = ["egg-resting.svg","egg-first-crack.svg","egg-peek.svg","egg-ready.svg"];
  for (const name of assets) {
    const svg = read("assets/vduckie/lv1/v109/" + name);
    assert.match(svg, /viewBox="0 0 960 540"/);
    for (const token of ["#293D36","#FFFDF4","#EED496","#FFD447","#F28A2E"]) assert.match(svg, new RegExp(token, "i"));
    assert.match(svg, /<ellipse cx="480" cy="477"/);
    assert.doesNotMatch(svg, /<filter|blur\(/i);
  }
});

test("Level 1 CSS is scoped and respects reduced motion", () => {
  const css = read("assets/v109/vduckie-level1-v109.css");
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /v109-egg-hover-once/);
  assert.match(css, /v109-shell-open/);
  assert.doesNotMatch(css, /v95-level-(?:2|3|4|5|6|7|8|9|10)/);
  assert.doesNotMatch(css, /rotate\(/);
});

test("Home loads V109 after the existing mascot stack and before Evolution captures it", () => {
  const index = read("index.html");
  assert.match(index, /vduckie-level1-v109\.css\?v=109\.0/);
  assert.match(index, /level1-manifest-v109\.js\?v=109\.0/);
  assert.match(index, /vduckie-level1-v109\.js\?v=109\.0/);
  assert.ok(index.indexOf("vduckie-mascot-v99.js?v=100.0") < index.indexOf("vduckie-level1-v109.js?v=109.0"));
  assert.ok(index.indexOf("vduckie-level1-v109.js?v=109.0") < index.indexOf("vduckie-evolution-v95.js?v=104.0"));
});

test("obsolete PR-wide Adam workflows are removed while HSK CI remains", () => {
  assert.equal(fs.existsSync(path.join(ROOT, ".github/workflows/build-adam-clips.yml")), false);
  assert.equal(fs.existsSync(path.join(ROOT, ".github/workflows/publish-adam-60.yml")), false);
  const hsk = read(".github/workflows/hsk-content-quality.yml");
  assert.match(hsk, /pull_request:/);
  assert.match(hsk, /push:/);
  assert.match(hsk, /branches: \[main\]/);
});
