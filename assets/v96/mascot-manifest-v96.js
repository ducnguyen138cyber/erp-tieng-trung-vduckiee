(function (root) {
  "use strict";
  if (root.__VDUCKIE_MASCOT_MANIFEST_V96__) return;
  root.__VDUCKIE_MASCOT_MANIFEST_V96__ = true;

  var base = root.VDuckieMascotManifest;
  if (!base) return;

  var VERSION = "96.0";
  var EGG_ASSETS = Object.freeze({
    normal: "./assets/vduckie/lv1/egg-normal.svg?v=96.0",
    cracked: "./assets/vduckie/lv1/egg-cracked.svg?v=96.0",
    hatching: "./assets/vduckie/lv1/egg-hatching.svg?v=96.0"
  });
  var LV2_SPRITE = Object.freeze({
    asset: "./assets/vduckie/lv2/duckling-sprite.svg?v=96.0",
    frames: 6,
    columns: 6,
    rows: 1,
    fps: 12,
    frameMap: Object.freeze({ default: 0, blink: 1, lookLeft: 2, lookRight: 3, happy: 4, sad: 5 })
  });

  var LEVELS = Object.assign({}, base.levels);
  LEVELS[1] = Object.freeze(Object.assign({}, base.levels[1], {
    defaultAsset: EGG_ASSETS.normal,
    renderMode: "svg-sequence",
    motionProfile: "egg"
  }));
  LEVELS[2] = Object.freeze(Object.assign({}, base.levels[2], {
    defaultAsset: LV2_SPRITE.asset,
    renderMode: "sprite",
    motionProfile: "duckling"
  }));
  LEVELS = Object.freeze(LEVELS);

  var STATES = Object.freeze(base.states.indexOf("outfit-confirm") >= 0 ? base.states.slice() :
    base.states.slice(0, 6).concat(["outfit-confirm"]).concat(base.states.slice(6)));
  var RENDER_MODES = Object.freeze(base.renderModes.indexOf("svg-sequence") >= 0 ? base.renderModes.slice() :
    base.renderModes.concat(["svg-sequence"]));

  function normalizedLevel(value) {
    return Math.max(1, Math.min(10, Math.floor(Number(value || 1))));
  }

  function resolve(query) {
    query = query || {};
    var level = normalizedLevel(query.level);
    if (level > 2) return base.resolve(query);

    var outfit = String(query.outfit || base.defaults.outfit);
    var accessory = String(query.accessory || base.defaults.accessory);
    var state = STATES.indexOf(query.state) >= 0 ? query.state : "idle";
    var customized = outfit !== "stage-default" || accessory !== "none";

    if (level === 1) {
      return Object.freeze({
        level: 1,
        state: state,
        outfit: outfit,
        accessory: accessory,
        asset: EGG_ASSETS.normal,
        fallbackAsset: EGG_ASSETS.normal,
        renderMode: "svg-sequence",
        frames: 3,
        fps: 8,
        columns: 1,
        rows: 1,
        exactCombination: !customized,
        missingCombination: customized,
        source: Object.freeze({ level: 1, renderMode: "svg-sequence", asset: EGG_ASSETS.normal })
      });
    }

    return Object.freeze({
      level: 2,
      state: state,
      outfit: outfit,
      accessory: accessory,
      asset: LV2_SPRITE.asset,
      fallbackAsset: LV2_SPRITE.asset,
      renderMode: "sprite",
      frames: LV2_SPRITE.frames,
      fps: LV2_SPRITE.fps,
      columns: LV2_SPRITE.columns,
      rows: LV2_SPRITE.rows,
      exactCombination: !customized,
      missingCombination: customized,
      source: Object.freeze({ level: 2, renderMode: "sprite", asset: LV2_SPRITE.asset })
    });
  }

  var manifest = Object.freeze({
    version: VERSION,
    states: STATES,
    renderModes: RENDER_MODES,
    levels: LEVELS,
    items: base.items,
    defaults: base.defaults,
    categories: base.categories,
    variants: base.variants,
    motion: base.motion,
    eggAssets: EGG_ASSETS,
    level2Sprite: LV2_SPRITE,
    resolve: resolve,
    getLevel: function (level) { return LEVELS[normalizedLevel(level)]; },
    getItems: function (type) { return base.getItems(type); },
    getItem: function (type, code) { return base.getItem(type, code); }
  });

  root.VDuckieMascotManifest = manifest;
  root.VDuckieAvatarConfig = Object.freeze({
    version: VERSION,
    levels: LEVELS,
    items: base.items,
    defaults: base.defaults,
    categories: base.categories
  });
})(window);
