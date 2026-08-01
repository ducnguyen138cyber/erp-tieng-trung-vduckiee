(function (root) {
  "use strict";
  if (root.__VDUCKIE_LEVEL1_MANIFEST_V109__) return;
  root.__VDUCKIE_LEVEL1_MANIFEST_V109__ = true;

  var CACHE_VERSION = "109.3";
  var NEWBORN_ASSET = "./assets/vduckie/lv1/v109/newborn-vduckie-hatching.webp?v=" + CACHE_VERSION;
  var ASSETS = Object.freeze({
    resting: "./assets/vduckie/lv1/v109/egg-resting.svg?v=" + CACHE_VERSION,
    "first-crack": "./assets/vduckie/lv1/v109/egg-first-crack.svg?v=" + CACHE_VERSION,
    peek: "./assets/vduckie/lv1/v109/egg-peek.svg?v=" + CACHE_VERSION,
    ready: NEWBORN_ASSET,
    hatching: NEWBORN_ASSET
  });

  function clamp(value) {
    var progress = Number(value);
    if (!Number.isFinite(progress)) progress = 0;
    return Math.max(0, Math.min(100, progress));
  }

  function stateFor(progressPercent) {
    var progress = clamp(progressPercent);
    if (progress >= 100) return "hatched";
    if (progress >= 75) return "ready";
    if (progress >= 50) return "peek";
    if (progress >= 25) return "first-crack";
    return "resting";
  }

  function isHatchAnimation(animationState) {
    return animationState === "hatching" || animationState === "level-up";
  }

  function assetFor(progressPercent, animationState) {
    var state = stateFor(progressPercent);
    if (state === "hatched") return "";
    if (state === "ready" && isHatchAnimation(animationState)) return ASSETS.hatching;
    return ASSETS[state] || ASSETS.resting;
  }

  root.VDuckieLevel1Manifest = Object.freeze({
    version: CACHE_VERSION,
    assets: ASSETS,
    newbornAsset: NEWBORN_ASSET,
    thresholds: Object.freeze([
      Object.freeze({ min: 0, max: 24, state: "resting", asset: ASSETS.resting }),
      Object.freeze({ min: 25, max: 49, state: "first-crack", asset: ASSETS["first-crack"] }),
      Object.freeze({ min: 50, max: 74, state: "peek", asset: ASSETS.peek }),
      Object.freeze({ min: 75, max: 99, state: "ready", asset: ASSETS.ready }),
      Object.freeze({ min: 100, max: 100, state: "hatched", targetLevel: 2 })
    ]),
    hatchTarget: Object.freeze({ level: 2 }),
    clampProgress: clamp,
    stateFor: stateFor,
    isHatchAnimation: isHatchAnimation,
    assetFor: assetFor
  });
})(window);
