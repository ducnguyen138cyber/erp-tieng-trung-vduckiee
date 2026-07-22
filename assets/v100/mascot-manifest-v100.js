(function (root) {
  "use strict";
  if (root.__VDUCKIE_MASCOT_MANIFEST_V100__) return;
  root.__VDUCKIE_MASCOT_MANIFEST_V100__ = true;
  var base = root.VDuckieMascotManifest;
  if (!base) return;
  var FALLBACKS = Object.freeze({
    2: "./assets/vduckie/fallback/lv2-default.svg?v=100.0",
    3: "./assets/vduckie/fallback/lv3-default.webp?v=100.0",
    4: "./assets/vduckie/fallback/lv4-default.webp?v=100.0",
    5: "./assets/vduckie/fallback/lv5-default.webp?v=100.0",
    6: "./assets/vduckie/fallback/lv6-default.webp?v=100.0",
    7: "./assets/vduckie/fallback/lv7-default.webp?v=100.0",
    8: "./assets/vduckie/fallback/lv8-default.webp?v=100.0"
  });
  function normalizedLevel(value) { return Math.max(1, Math.min(10, Math.floor(Number(value || 1)))); }
  function resolve(query) {
    query = query || {};
    var requestedState = String(query.state || "idle");
    var resolved = base.resolve(query);
    var level = normalizedLevel(resolved && resolved.level || query && query.level);
    var fallback = FALLBACKS[level] || resolved.fallbackAsset || base.getLevel(level).defaultAsset;
    return Object.freeze(Object.assign({}, resolved, {
      fallbackAsset: fallback,
      requestedState: requestedState,
      resolvedState: resolved.state || "idle",
      usedFallback: !resolved.asset,
      isValid: !!(resolved.asset || fallback),
      candidates: Object.freeze([resolved.asset, fallback, base.getLevel(level).defaultAsset].filter(function (asset, index, list) { return !!asset && list.indexOf(asset) === index; }))
    }));
  }
  var levels = Object.assign({}, base.levels);
  Object.keys(FALLBACKS).forEach(function (level) { levels[level] = Object.freeze(Object.assign({}, levels[level], { fallbackAsset: FALLBACKS[level] })); });
  levels = Object.freeze(levels);
  root.VDuckieMascotManifest = Object.freeze(Object.assign({}, base, { version: "101.0", levels: levels, fallbacks: FALLBACKS, resolve: resolve, resolveMascotAsset: resolve, getLevel: function (level) { return levels[normalizedLevel(level)]; } }));
})(window);
