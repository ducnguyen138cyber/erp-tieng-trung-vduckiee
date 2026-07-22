(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_MASCOT_RENDERER_V98__) return;
  root.__VDUCKIE_MASCOT_RENDERER_V98__ = true;
  var base = root.VDuckieMascot;
  var manifest = root.VDuckieMascotManifest;
  if (!base || !manifest) return;
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]; }); }
  function addClass(markup, className) { return markup.replace('class="v95-mascot ', 'class="v95-mascot ' + className + ' '); }
  function spriteMarkup(sprite, level) { var style = "--v95-sprite-url:url(&quot;" + esc(sprite.asset) + "&quot;);--v95-sprite-frames:" + sprite.frames + ";--v95-sprite-fps:" + sprite.fps + ";--v95-sprite-columns:" + sprite.columns + ";--v95-sprite-rows:1"; return '<span class="v95-sprite v98-character-sprite" role="img" aria-label="VDuckie Level ' + level + '" style="' + style + '" data-v95-sprite-src="' + esc(sprite.asset) + '" data-v98-sprite-level="' + level + '"></span>'; }
  function render(options) {
    options = options || {};
    var level = Math.max(1, Math.min(10, Number(options.level || 1)));
    var markup = base.render(options);
    if (level === 5 || level === 6) {
      var sprite = manifest.levelSprites[level];
      markup = addClass(markup, "v98-mascot is-sprite-level-" + level);
      markup = markup.replace(/<img class="v95-mascot-image"[^>]*>/, spriteMarkup(sprite, level));
      markup = markup.replace(/data-v95-render-mode="[^"]+"/, 'data-v95-render-mode="sprite"');
    }
    return markup;
  }
  function itemThumbnail(item, level) { var sprite = manifest.levelSprites && manifest.levelSprites[Number(level)]; if ((Number(level) === 5 || Number(level) === 6) && sprite && item && (item.type === "outfit" || item.type === "accessory")) return '<span class="v98-item-sprite-thumb level-' + Number(level) + '" style="--v95-sprite-url:url(&quot;' + sprite.asset + '&quot;)" aria-hidden="true"></span>'; return base.itemThumbnail(item, level); }
  function preloadItem(type, code, level, selection) { var sprite = manifest.levelSprites && manifest.levelSprites[Number(level)]; if ((Number(level) === 5 || Number(level) === 6) && sprite) { base.preloadAsset(sprite.asset); return; } base.preloadItem(type, code, level, selection); }
  var API = Object.freeze({ version: "98.0", render: render, hydrate: base.hydrate, getStage: base.getStage, getStages: base.getStages, getItem: base.getItem, getItems: base.getItems, getCategories: base.getCategories, defaults: base.defaults, normalizeSelection: base.normalizeSelection, resolveSelection: base.resolveSelection, resolveAsset: base.resolveAsset, selectionStatus: base.selectionStatus, isCompatible: base.isCompatible, incompatibilityReason: base.incompatibilityReason, itemThumbnail: itemThumbnail, preloadItem: preloadItem, preloadAsset: base.preloadAsset, registerRenderer: base.registerRenderer });
  root.VDuckieMascot = API;
  root.VDuckieAvatar = API;
})(window, document);
