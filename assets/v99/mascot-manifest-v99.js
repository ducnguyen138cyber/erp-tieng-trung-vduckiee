(function (root) {
  "use strict";
  if (root.__VDUCKIE_MASCOT_MANIFEST_V99__) return;
  root.__VDUCKIE_MASCOT_MANIFEST_V99__ = true;
  var base = root.VDuckieMascotManifest;
  if (!base) return;
  var VERSION = "99.0";
  var SPRITES = Object.freeze({
    7: Object.freeze({ asset: "./assets/vduckie/lv7/expert-sprite.webp?v=99.0", fallbackAsset: "./assets/vduckie/lv7/expert-sprite.webp?v=99.0", frames: 9, columns: 9, rows: 1, fps: 12, frameMap: Object.freeze({ default: 0, blink: 1, checkTablet: 2, inspectBadge: 3, lookLeft: 4, lookRight: 5, happy: 6, sad: 7, outfitCheck: 8 }) }),
    8: Object.freeze({ asset: "./assets/vduckie/lv8/leader-sprite.webp?v=99.0", fallbackAsset: "./assets/vduckie/lv8/leader-sprite.webp?v=99.0", frames: 9, columns: 9, rows: 1, fps: 12, frameMap: Object.freeze({ default: 0, blink: 1, adjustWatch: 2, adjustCuff: 3, lookLeft: 4, lookRight: 5, happy: 6, sad: 7, outfitCheck: 8 }) })
  });
  var levels = Object.assign({}, base.levels);
  [7, 8].forEach(function (level) { levels[level] = Object.freeze(Object.assign({}, base.levels[level], { defaultAsset: SPRITES[level].asset, renderMode: "sprite" })); });
  levels = Object.freeze(levels);
  function normalizedLevel(value) { return Math.max(1, Math.min(10, Math.floor(Number(value || 1)))); }
  function resolve(query) {
    query = query || {};
    var level = normalizedLevel(query.level);
    if (level !== 7 && level !== 8) return base.resolve(query);
    var sprite = SPRITES[level];
    var outfit = String(query.outfit || base.defaults.outfit);
    var accessory = String(query.accessory || base.defaults.accessory);
    var state = base.states.indexOf(query.state) >= 0 ? query.state : "idle";
    var customized = outfit !== "stage-default" || accessory !== "none";
    return Object.freeze({ level: level, state: state, outfit: outfit, accessory: accessory, asset: sprite.asset, fallbackAsset: sprite.fallbackAsset, renderMode: "sprite", frames: sprite.frames, fps: sprite.fps, columns: sprite.columns, rows: sprite.rows, exactCombination: !customized, missingCombination: customized, source: Object.freeze({ level: level, state: state, asset: sprite.asset, animationType: "sprite", renderMode: "sprite", fallbackAsset: sprite.fallbackAsset, frames: sprite.frames, columns: sprite.columns, rows: sprite.rows, fps: sprite.fps }) });
  }
  var combinedSprites = Object.freeze(Object.assign({}, base.levelSprites || {}, SPRITES));
  var manifest = Object.freeze({ version: VERSION, states: base.states, renderModes: base.renderModes, levels: levels, items: base.items, defaults: base.defaults, categories: base.categories, variants: base.variants, motion: base.motion, eggAssets: base.eggAssets, level2Sprite: base.level2Sprite, levelSprites: combinedSprites, resolve: resolve, getLevel: function (level) { return levels[normalizedLevel(level)]; }, getItems: function (type) { return base.getItems(type); }, getItem: function (type, code) { return base.getItem(type, code); } });
  root.VDuckieMascotManifest = manifest;
  root.VDuckieAvatarConfig = Object.freeze({ version: VERSION, levels: levels, items: base.items, defaults: base.defaults, categories: base.categories });
})(window);
