(function (root) {
  "use strict";
  if (root.__VDUCKIE_LEVEL1_MANIFEST_V109__) return;
  root.__VDUCKIE_LEVEL1_MANIFEST_V109__ = true;

  var ASSETS = Object.freeze({
    resting: "./assets/vduckie/lv1/v109/egg-resting.svg?v=109.0",
    "first-crack": "./assets/vduckie/lv1/v109/egg-first-crack.svg?v=109.0",
    peek: "./assets/vduckie/lv1/v109/egg-peek.svg?v=109.0",
    ready: "./assets/vduckie/lv1/v109/egg-ready.svg?v=109.0"
  });

  function clamp(value) {
    return Math.max(0, Math.min(100, Number(value || 0)));
  }

  function stateFor(progressPercent) {
    var progress = clamp(progressPercent);
    if (progress >= 100) return "hatched";
    if (progress >= 75) return "ready";
    if (progress >= 50) return "peek";
    if (progress >= 25) return "first-crack";
    return "resting";
  }

  root.VDuckieLevel1Manifest = Object.freeze({
    version: "109.0",
    assets: ASSETS,
    thresholds: Object.freeze([
      Object.freeze({ min: 0, max: 24, state: "resting" }),
      Object.freeze({ min: 25, max: 49, state: "first-crack" }),
      Object.freeze({ min: 50, max: 74, state: "peek" }),
      Object.freeze({ min: 75, max: 99, state: "ready" }),
      Object.freeze({ min: 100, max: 100, state: "hatched", targetLevel: 2 })
    ]),
    hatchTarget: Object.freeze({
      level: 2,
      fallbackAsset: "./assets/vduckie/lv2/v103/duckling-0.webp?v=103.0"
    }),
    clampProgress: clamp,
    stateFor: stateFor,
    assetFor: function (progressPercent) {
      return ASSETS[stateFor(progressPercent)] || "";
    }
  });
})(window);
