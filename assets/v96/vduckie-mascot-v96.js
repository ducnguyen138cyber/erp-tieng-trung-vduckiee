(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_MASCOT_RENDERER_V96__) return;
  root.__VDUCKIE_MASCOT_RENDERER_V96__ = true;

  var base = root.VDuckieMascot;
  var manifest = root.VDuckieMascotManifest;
  if (!base || !manifest) return;

  function esc(value) {
    var core = root.VDuckieEXPCore;
    return core && core.escapeHtml ? core.escapeHtml(value) : String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function eggState(progressPercent) {
    var progress = Math.max(0, Math.min(100, Number(progressPercent || 0)));
    return progress < 34 ? "normal" : progress < 67 ? "cracked" : "hatching";
  }

  function eggSequenceMarkup(progressPercent, animationState) {
    var current = eggState(progressPercent);
    var sequence = animationState === "hatching" || animationState === "level-up";
    var assets = manifest.eggAssets;
    return '<span class="v96-egg-sequence is-' + current + (sequence ? ' is-sequence-active' : '') + '" data-v96-egg-state="' + current + '" aria-hidden="true">' +
      '<img class="v96-egg-frame frame-normal" src="' + esc(assets.normal) + '" alt="" loading="eager" decoding="async" draggable="false" data-v95-asset>' +
      '<img class="v96-egg-frame frame-cracked" src="' + esc(assets.cracked) + '" alt="" loading="eager" decoding="async" draggable="false" data-v95-asset>' +
      '<img class="v96-egg-frame frame-hatching" src="' + esc(assets.hatching) + '" alt="" loading="eager" decoding="async" draggable="false" data-v95-asset>' +
      '</span>';
  }

  function addClass(markup, className) {
    return markup.replace('class="v95-mascot ', 'class="v95-mascot ' + className + ' ');
  }

  function render(options) {
    options = options || {};
    var level = Math.max(1, Math.min(10, Number(options.level || 1)));
    var markup = base.render(options);

    if (level === 1) {
      markup = markup.replace(/<span class="v95-egg egg-[^"]+" aria-hidden="true"><i><\/i><b><\/b><em><\/em><\/span>/,
        eggSequenceMarkup(options.progressPercent, options.animationState || "idle"));
      markup = markup.replace('data-v95-render-mode="css-egg"', 'data-v95-render-mode="svg-sequence"');
      markup = addClass(markup, "v96-mascot");
      return markup;
    }

    if (level === 2) {
      markup = addClass(markup, "v96-mascot is-sprite-duckling");
      markup = markup.replace('class="v95-sprite"', 'class="v95-sprite v96-sprite-level-2" data-v96-sprite-level="2"');
    }
    return markup;
  }

  function hydrate(scope) {
    base.hydrate(scope);
  }

  function itemThumbnail(item, level) {
    var normalizedLevel = Math.max(1, Math.min(10, Number(level || 1)));
    if (normalizedLevel === 2 && item && (item.type === "outfit" || item.type === "accessory")) {
      return '<span class="v96-item-sprite-thumb" style="--v95-sprite-url:url(&quot;' + esc(manifest.level2Sprite.asset) + '&quot;)" aria-hidden="true"></span>';
    }
    return base.itemThumbnail(item, level);
  }

  function preloadItem(type, code, level, selection) {
    if (Number(level) === 2) {
      base.preloadAsset(manifest.level2Sprite.asset);
      return;
    }
    base.preloadItem(type, code, level, selection);
  }

  var API = Object.freeze({
    version: "96.0",
    render: render,
    hydrate: hydrate,
    getStage: base.getStage,
    getStages: base.getStages,
    getItem: base.getItem,
    getItems: base.getItems,
    getCategories: base.getCategories,
    defaults: base.defaults,
    normalizeSelection: base.normalizeSelection,
    resolveSelection: base.resolveSelection,
    resolveAsset: base.resolveAsset,
    selectionStatus: base.selectionStatus,
    isCompatible: base.isCompatible,
    incompatibilityReason: base.incompatibilityReason,
    itemThumbnail: itemThumbnail,
    preloadItem: preloadItem,
    preloadAsset: base.preloadAsset,
    registerRenderer: base.registerRenderer
  });

  root.VDuckieMascot = API;
  root.VDuckieAvatar = API;
})(window, document);
