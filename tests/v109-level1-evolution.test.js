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
  assert.equal(buffer.toString("ascii", 12, 16), "VP8X");
  return {
    width: buffer.readUIntLE(24, 3) + 1,
    height: buffer.readUIntLE(27, 3) + 1,
    alpha: !!(buffer[20] & 0x10)
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
    getStage() {}, getStages() {}, getItem() {}, getItems() {}, getCategories() {},
    defaults() { return {}; }, normalizeSelection() {}, resolveSelection() {}, resolveAsset() {},
    selectionStatus() {}, isCompatible() {}, incompatibilityReason() {}, itemThumbnail() { return ""; },
    preloadItem() {}, preloadAsset(asset) { preloaded.push(asset); }, registerRenderer() {}
  };
  const fakeDocument = { body: null, querySelectorAll() { return []; } };
  const context = { window: { VDuckieMascot: base, VDuckieAvatar: base }, document: fakeDocument };
  context.window.window = context.window;
  vm.runInNewContext(read("assets/v109/level1-manifest-v109.js"), context);
  vm.runInNewContext(read("assets/v109/vduckie-level1-v109.js"), context);
  return { api: context.window.VDuckieMascot, delegated, preloaded, manifest: context.window.VDuckieLevel1Manifest };
}

test("Level 1 maps exact EXP boundaries and delegates to Level 2 only at 100%", () => {
  const { api } = loadRenderer();
  const cases = [[0,"resting"],[24,"resting"],[25,"first-crack"],[49,"first-crack"],[50,"peek"],[74,"peek"],[75,"ready"],[99,"ready"],[100,"hatched"]];
  for (const [progress, expected] of cases) assert.equal(api.getLevel1State(progress), expected, String(progress));

  for (const [progress, expected] of cases.slice(0, -1)) {
    const html = api.render({ level: 1, progressPercent: progress, animationState: "idle" });
    assert.match(html, new RegExp('data-v109-egg-stage="' + expected + '"'));
    assert.equal(occurrences(html, "data-v109-visual-root="), 1, `visual root at ${progress}%`);
    assert.equal(occurrences(html, "data-v109-motion-root="), 1, `motion root at ${progress}%`);
    assert.equal(occurrences(html, "data-v109-level1-image"), 1, `active image at ${progress}%`);
    assert.doesNotMatch(html, /v96-egg-sequence|v96-egg-frame|v95-egg|v109-egg-sequence|v109-hatch-preview/);
  }

  const hatched = api.render({ level: 1, progressPercent: 100, animationState: "level-up" });
  assert.match(hatched, /data-v95-level="2"/);
  assert.match(hatched, /data-v109-origin-level="1"/);
  assert.doesNotMatch(hatched, /data-v109-level1|data-v109-visual-root|data-v109-level1-image/);
});

test("each progress band resolves its own asset and 0% never resolves the newborn", () => {
  const { api, manifest } = loadRenderer();
  const expected = [
    [0, "egg-resting.svg"],
    [25, "egg-first-crack.svg"],
    [50, "egg-peek.svg"],
    [75, "newborn-vduckie-hatching.webp"],
    [99, "newborn-vduckie-hatching.webp"]
  ];
  for (const [progress, file] of expected) {
    const html = api.render({ level: 1, progressPercent: progress, animationState: "idle" });
    assert.match(html, new RegExp(file.replaceAll(".", "\\.")));
  }
  const zeroHatching = api.render({ level: 1, progressPercent: 0, animationState: "hatching" });
  assert.match(zeroHatching, /egg-resting\.svg\?v=109\.3/);
  assert.doesNotMatch(zeroHatching, /newborn-vduckie-hatching/);
  assert.equal(manifest.assetFor(25, "level-up"), manifest.assets["first-crack"]);
  assert.equal(manifest.assetFor(50, "hatching"), manifest.assets.peek);
  assert.equal(manifest.assetFor(75, "hatching"), manifest.assets.hatching);
});

test("75-99% uses the new transparent newborn asset and preloads it once", () => {
  const { api, manifest, preloaded } = loadRenderer();
  for (const animationState of ["idle", "hover", "hatching", "level-up"]) {
    const html = api.render({ level: 1, progressPercent: 99, animationState });
    assert.equal(occurrences(html, "data-v109-level1-image"), 1);
    assert.match(html, /newborn-vduckie-hatching\.webp\?v=109\.3/);
    assert.doesNotMatch(html, /egg-ready\.svg|egg-hatching\.svg|newborn-0\.webp|newborn-sprite|duckling-0|hatch-preview/);
  }
  assert.equal(manifest.assets.ready, manifest.assets.hatching);
  assert.equal(preloaded.filter(asset => asset === manifest.newbornAsset).length, 1);
});

test("newborn WebP is a real transparent production asset with stable dimensions", () => {
  const file = fs.readFileSync(path.join(ROOT, NEWBORN));
  assert.ok(file.length > 10000, "asset is not a placeholder");
  assert.deepEqual(webpDimensions(file), { width: 320, height: 320, alpha: true });
});

test("old newborn and legacy egg paths are absent from active Level 1 source", () => {
  const manifest = read("assets/v109/level1-manifest-v109.js");
  const runtime = read("assets/v109/vduckie-level1-v109.js");
  for (const oldAsset of ["egg-ready.svg", "egg-hatching.svg", "newborn-sprite-v103.webp", "newborn-0.webp", "duckling-0.webp"]) {
    assert.doesNotMatch(manifest, new RegExp(oldAsset.replaceAll(".", "\\.")));
    assert.doesNotMatch(runtime, new RegExp(oldAsset.replaceAll(".", "\\.")));
  }
});

test("repeated rendering and hover states never accumulate visual or motion roots", () => {
  const { api } = loadRenderer();
  for (let pass = 0; pass < 4; pass += 1) {
    for (const progress of [0, 25, 50, 75, 99]) {
      for (const animationState of ["idle", "hover", "tap", "hatching"]) {
        const html = api.render({ level: 1, progressPercent: progress, animationState });
        assert.equal(occurrences(html, "data-v109-visual-root="), 1);
        assert.equal(occurrences(html, "data-v109-motion-root="), 1);
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

test("Level 1 CSS owns a clipped safe-zone and a stable center-bottom baseline", () => {
  const css = read("assets/v109/vduckie-level1-v109.css");
  assert.match(css, /--v109-safe-top:5%/);
  assert.match(css, /--v109-safe-bottom:7%/);
  assert.match(css, /overflow:clip!important/);
  assert.match(css, /object-fit:contain/);
  assert.match(css, /object-position:center bottom/);
  assert.match(css, /transform-origin:center bottom/);
  assert.match(css, /clamp\(210px,25vw,292px\)/);
  assert.match(css, /v109-level1-motion/);
  assert.match(css, /stage-ready:is\(\.is-hatching,\.is-level-up\)/);
  assert.doesNotMatch(css, /v95-level-(?:2|3|4|5|6|7|8|9|10)/);
  assert.doesNotMatch(css, /scale\(/, "Level 1 animation must not scale the visual root");
});

test("runtime reconciles active asset from EXP progress instead of stale animation classes", () => {
  const runtime = read("assets/v109/vduckie-level1-v109.js");
  assert.match(runtime, /version: "109\.3"/);
  assert.match(runtime, /single-image-v109\.3/);
  assert.match(runtime, /function reconcileStage/);
  assert.match(runtime, /config\.assetFor\(resolved\.progress, animationStateFor\(rootNode\)\)/);
  assert.match(runtime, /data-v109-motion-root/);
  assert.match(runtime, /visual\.children/);
  assert.match(runtime, /motionRoot\.children/);
  assert.match(runtime, /MutationObserver/);
  assert.doesNotMatch(runtime, /v109-hatch-preview|v109-egg-frame|duckling-0\.webp/);
});

test("manifest exposes cache version 109.3 and explicit threshold assets", () => {
  const manifest = read("assets/v109/level1-manifest-v109.js");
  assert.match(manifest, /CACHE_VERSION = "109\.3"/);
  assert.match(manifest, /newborn-vduckie-hatching\.webp\?v=" \+ CACHE_VERSION/);
  assert.match(manifest, /state: "resting", asset: ASSETS\.resting/);
  assert.match(manifest, /state: "ready", asset: ASSETS\.ready/);
});

if (fs.existsSync(path.join(ROOT, "index.html"))) {
  test("Home boots Level 1 CSS and runtime with cache version 109.3", () => {
    const index = read("index.html");
    assert.match(index, /vduckie-level1-v109\.css\?v=109\.3/);
    assert.match(index, /level1-manifest-v109\.js\?v=109\.3/);
    assert.match(index, /vduckie-level1-v109\.js\?v=109\.3/);
  });
}
