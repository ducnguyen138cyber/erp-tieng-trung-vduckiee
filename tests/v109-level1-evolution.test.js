const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");
const occurrences = (text, token) => text.split(token).length - 1;
const NEWBORN = "assets/vduckie/lv1/v109/newborn-vduckie-hatching.webp";

function webpDimensions(buffer) {
  assert.equal(buffer.toString("ascii", 0, 4), "RIFF");
  assert.equal(buffer.toString("ascii", 8, 12), "WEBP");
  assert.equal(buffer.toString("ascii", 12, 16), "VP8L");
  assert.equal(buffer[20], 0x2f);
  const bits = buffer.readUInt32LE(21);
  return {
    width: (bits & 0x3fff) + 1,
    height: ((bits >>> 14) & 0x3fff) + 1,
    alpha: !!(bits & (1 << 28))
  };
}

function loadRenderer() {
  const delegated = [];
  const preloaded = [];
  const base = {
    version: "current-runtime",
    render(options) {
      delegated.push({ ...options });
      const level = Number(options.level || 1);
      if (level === 1) {
        return '<button class="v95-mascot v95-size-large v95-level-1 is-egg is-' + (options.animationState || "idle") + '" data-v95-level="1" data-v95-render-mode="svg-sequence" data-v95-resolved-asset="legacy"><span class="v95-background bg-default"></span><span class="v95-character"><span class="v95-visual"><span class="v96-egg-sequence is-normal" data-v96-egg-state="normal" aria-hidden="true"><img class="v96-egg-frame frame-normal"><img class="v96-egg-frame frame-cracked"><img class="v96-egg-frame frame-hatching"></span></span></span></button>';
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
    preloadAsset(asset) { preloaded.push(asset); },
    registerRenderer() {}
  };
  const fakeDocument = { body: null, querySelectorAll() { return []; } };
  const context = { window: { VDuckieMascot: base, VDuckieAvatar: base }, document: fakeDocument };
  context.window.window = context.window;
  vm.runInNewContext(read("assets/v109/level1-manifest-v109.js"), context);
  vm.runInNewContext(read("assets/v109/vduckie-level1-v109.js"), context);
  return { api: context.window.VDuckieMascot, delegated, preloaded, manifest: context.window.VDuckieLevel1Manifest };
}

test("Level 1 maps exact EXP boundaries and delegates to Level 2 at 100%", () => {
  const { api } = loadRenderer();
  const cases = [[0,"resting"],[24,"resting"],[25,"first-crack"],[49,"first-crack"],[50,"peek"],[74,"peek"],[75,"ready"],[99,"ready"],[100,"hatched"]];
  for (const [progress, expected] of cases) assert.equal(api.getLevel1State(progress), expected, String(progress));

  for (const [progress, expected] of cases.slice(0, -1)) {
    const html = api.render({ level: 1, progressPercent: progress, animationState: "idle" });
    assert.match(html, new RegExp('data-v109-egg-stage="' + expected + '"'));
    assert.equal(occurrences(html, "data-v109-visual-root="), 1, `visual root at ${progress}%`);
    assert.equal(occurrences(html, "data-v109-level1-image"), 1, `active image at ${progress}%`);
    assert.doesNotMatch(html, /v96-egg-sequence|v96-egg-frame|v95-egg|v109-egg-sequence|v109-hatch-preview/);
  }

  const hatched = api.render({ level: 1, progressPercent: 100, animationState: "level-up" });
  assert.match(hatched, /data-v95-level="2"/);
  assert.match(hatched, /data-v109-origin-level="1"/);
  assert.doesNotMatch(hatched, /data-v109-level1|v96-egg|v95-egg|v109-hatch-preview/);
});

test("75-99% and hatch use the new VDuckie newborn asset only", () => {
  const { api, manifest, preloaded } = loadRenderer();
  const ready = api.render({ level: 1, progressPercent: 75, animationState: "idle" });
  const almost = api.render({ level: 1, progressPercent: 99, animationState: "idle" });
  const hatching = api.render({ level: 1, progressPercent: 99, animationState: "hatching" });
  for (const html of [ready, almost, hatching]) {
    assert.equal(occurrences(html, "data-v109-level1-image"), 1);
    assert.match(html, /newborn-vduckie-hatching\.webp\?v=109\.2/);
    assert.doesNotMatch(html, /egg-ready\.svg|egg-hatching\.svg|newborn-0\.webp|newborn-sprite|duckling-0|hatch-preview/);
  }
  assert.equal(manifest.assets.ready, manifest.assets.hatching);
  assert.equal(preloaded.filter(asset => asset === manifest.newbornAsset).length, 1, "newborn is preloaded once");
});

test("newborn WebP is a real transparent production asset with stable dimensions", () => {
  const file = fs.readFileSync(path.join(ROOT, NEWBORN));
  assert.ok(file.length > 10000, "asset is not a placeholder");
  const dimensions = webpDimensions(file);
  assert.deepEqual(dimensions, { width: 448, height: 448, alpha: true });
});

test("old generated newborn assets are absent from the active Level 1 path", () => {
  const manifest = read("assets/v109/level1-manifest-v109.js");
  const runtime = read("assets/v109/vduckie-level1-v109.js");
  for (const oldAsset of ["egg-ready.svg", "egg-hatching.svg", "newborn-sprite-v103.webp", "newborn-0.webp", "duckling-0.webp"]) {
    assert.doesNotMatch(manifest, new RegExp(oldAsset.replaceAll(".", "\\.")));
    assert.doesNotMatch(runtime, new RegExp(oldAsset.replaceAll(".", "\\.")));
  }
});

test("repeated rendering and hover states never accumulate visual nodes", () => {
  const { api } = loadRenderer();
  for (let pass = 0; pass < 4; pass += 1) {
    for (const progress of [0, 25, 50, 75, 99]) {
      for (const animationState of ["idle", "hover", "tap"]) {
        const html = api.render({ level: 1, progressPercent: progress, animationState });
        assert.equal(occurrences(html, "data-v109-visual-root="), 1);
        assert.equal(occurrences(html, "data-v109-level1-image"), 1);
      }
    }
  }
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

test("early egg states keep one integrated 16:9 vector composition", () => {
  for (const name of ["egg-resting.svg","egg-first-crack.svg","egg-peek.svg"]) {
    const svg = read("assets/vduckie/lv1/v109/" + name);
    assert.match(svg, /viewBox="0 0 960 540"/);
    assert.doesNotMatch(svg, /<image|href=|<filter|blur\(/i);
  }
});

test("Level 1 CSS has no overlay, crossfade, background image or Level 2 override", () => {
  const css = read("assets/v109/vduckie-level1-v109.css");
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /v1091-egg-hover-once/);
  assert.match(css, /v1091-egg-hatch-single/);
  assert.doesNotMatch(css, /v95-level-(?:2|3|4|5|6|7|8|9|10)/);
  assert.doesNotMatch(css, /rotate\(|opacity\s*:|background-image\s*:\s*url/i);
});

test("runtime assertion destroys stale visual children and keeps one active image", () => {
  const runtime = read("assets/v109/vduckie-level1-v109.js");
  assert.match(runtime, /version: "109\.2"/);
  assert.match(runtime, /single-image-v109\.2/);
  assert.match(runtime, /function ensureSingleVisual/);
  assert.match(runtime, /visual\.children/);
  assert.match(runtime, /child\.remove\(\)/);
  assert.match(runtime, /visualRoot\.children/);
  assert.match(runtime, /data-v109-visual-root-count/);
  assert.match(runtime, /MutationObserver/);
  assert.doesNotMatch(runtime, /v109-hatch-preview|v109-egg-frame|duckling-0\.webp/);
});

test("manifest exposes the new cache-busted asset", () => {
  const manifest = read("assets/v109/level1-manifest-v109.js");
  assert.match(manifest, /version: "109\.2"/);
  assert.match(manifest, /newborn-vduckie-hatching\.webp\?v=109\.2/);
});
