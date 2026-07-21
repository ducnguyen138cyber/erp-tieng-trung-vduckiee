(function (root, document) {
  "use strict";
  if (root.VDuckieAvatar) return;

  var config = root.VDuckieAvatarConfig;
  if (!config) return;

  function esc(value) {
    var core = root.VDuckieEXPCore;
    return core && core.escapeHtml ? core.escapeHtml(value) : String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function getStage(level) {
    var normalized = Math.max(1, Math.min(10, Math.floor(Number(level || 1))));
    return config.levels[normalized] || config.levels[1];
  }

  function getItem(type, code) {
    var list = config.items[type] || [];
    for (var index = 0; index < list.length; index += 1) {
      if (list[index].code === code) return list[index];
    }
    return null;
  }

  function copySelection(source) {
    source = source && typeof source === "object" ? source : {};
    var result = {};
    Object.keys(config.defaults).forEach(function (key) {
      result[key] = getItem(key, source[key]) ? source[key] : config.defaults[key];
    });
    return result;
  }

  function isCompatible(item, level) {
    if (!item) return false;
    var normalized = Math.max(1, Math.min(10, Number(level || 1)));
    if (normalized < Number(item.minimumLevel || 1)) return false;
    if (Array.isArray(item.compatibleLevels) && item.compatibleLevels.indexOf(normalized) === -1) return false;
    return item.status !== "disabled";
  }

  function incompatibilityReason(item, level) {
    if (!item) return "Item không tồn tại.";
    var normalized = Number(level || 1);
    if (normalized < Number(item.minimumLevel || 1)) return "Cần đạt Level " + item.minimumLevel + ".";
    if (Array.isArray(item.compatibleLevels) && item.compatibleLevels.indexOf(normalized) === -1) {
      return "Asset này không tương thích với Level " + normalized + ".";
    }
    if (item.status === "disabled") return "Item đang tạm khóa.";
    return "";
  }

  function resolveSelection(level, source, allowIncompatible) {
    var selection = copySelection(source);
    Object.keys(selection).forEach(function (type) {
      var selected = getItem(type, selection[type]);
      if (!allowIncompatible && !isCompatible(selected, level)) selection[type] = config.defaults[type];
    });
    return selection;
  }

  function layerStyle(item) {
    if (!item) return "";
    return "--v94-x:" + Number(item.offsetX || 0) + "px;--v94-y:" + Number(item.offsetY || 0) + "px;--v94-scale:" + Number(item.scale || 1) + ";--v94-z:" + Number(item.zIndex || 20) + ";";
  }

  function imageMarkup(className, item, alt) {
    if (!item || !item.asset) return "";
    return '<img class="' + className + '" src="' + esc(item.asset) + '" alt="' + esc(alt || "") + '" style="' + layerStyle(item) + '" loading="lazy" decoding="async" draggable="false" data-v94-asset onerror="this.hidden=true;this.parentNode.classList.add(\'has-missing-layer\')">';
  }

  function baseImageMarkup(asset, alt, skin) {
    if (!asset) return "";
    var filter = skin && skin.filter ? skin.filter : "none";
    return '<img class="v94-base-layer" src="' + esc(asset) + '" alt="' + esc(alt) + '" style="--v94-skin-filter:' + esc(filter) + '" loading="eager" decoding="async" draggable="false" data-v94-asset onerror="this.hidden=true;this.parentNode.classList.add(\'has-missing-base\')">';
  }

  function eggMarkup(progressPercent) {
    var progress = Math.max(0, Math.min(100, Number(progressPercent || 0)));
    var state = progress < 34 ? "intact" : progress < 67 ? "cracked" : "hatching";
    return '<span class="v94-egg egg-' + state + '" aria-hidden="true"><i></i><b></b><em></em></span>';
  }

  function effectMarkup(item) {
    if (!item || item.code === "none") return '<span class="v94-effect-layer fx-none" aria-hidden="true"></span>';
    return '<span class="v94-effect-layer ' + esc(item.cssClass || "") + '" style="' + layerStyle(item) + '" aria-hidden="true"><i></i><b></b><em></em></span>';
  }

  function backgroundMarkup(item) {
    return '<span class="v94-background-layer ' + esc(item && item.cssClass || "bg-default") + '" style="' + layerStyle(item) + '" aria-hidden="true"></span>';
  }

  function render(options) {
    options = options || {};
    var stage = getStage(options.level);
    var allowIncompatible = !!options.allowIncompatible;
    var selection = resolveSelection(stage.level, options.selectedItems, allowIncompatible);
    var skin = getItem("skin", selection.skin);
    var outfit = getItem("outfit", selection.outfit);
    var glasses = getItem("glasses", selection.glasses);
    var accessory = getItem("accessory", selection.accessory);
    var background = getItem("background", selection.background);
    var effect = getItem("effect", selection.effect);
    var fullSkin = outfit && outfit.renderMode === "full-skin" ? outfit.asset : stage.asset;
    var layeredOutfit = outfit && outfit.renderMode === "layered" ? outfit : null;
    var accessoryBehind = accessory && Number(accessory.zIndex || 50) < 20 ? accessory : null;
    var accessoryFront = accessory && !accessoryBehind && accessory.renderMode !== "none" ? accessory : null;
    var size = /^(tiny|compact|medium|large)$/.test(options.size || "") ? options.size : "large";
    var animation = options.animationState || "idle";
    var thought = options.thought || stage.thought;
    var classes = [
      "v94-avatar",
      "v94-size-" + size,
      "v94-level-" + stage.level,
      "v94-motion-" + stage.animation,
      "is-" + animation
    ];
    if (options.previewMode) classes.push("is-preview");
    if (stage.level === 1) classes.push("is-egg");
    if (effect && effect.code !== "none") classes.push("has-effect-" + effect.code);
    if (background) classes.push("has-background-" + background.code);
    var visual = stage.level === 1 ? eggMarkup(options.progressPercent) :
      baseImageMarkup(fullSkin, "VDuckie " + stage.name, skin) +
      imageMarkup("v94-outfit-layer", layeredOutfit, "") +
      imageMarkup("v94-accessory-behind-layer", accessoryBehind, "") +
      imageMarkup("v94-glasses-layer", glasses && glasses.renderMode !== "none" ? glasses : null, "") +
      imageMarkup("v94-accessory-front-layer", accessoryFront, "");
    return '<button type="button" class="' + classes.join(" ") + '" data-v94-avatar data-v94-level="' + stage.level + '" data-v94-animation="' + esc(animation) + '" aria-label="VDuckie Level ' + stage.level + ': ' + esc(stage.name) + '. Chạm để VDuckie phản ứng" aria-expanded="false">' +
      backgroundMarkup(background) +
      '<span class="v94-character-stack">' + visual + '<span class="v94-missing-fallback" aria-hidden="true">' + esc(stage.symbol) + '</span></span>' +
      effectMarkup(effect) +
      '<span class="v94-thought-bubble" role="status">' + esc(thought) + '</span>' +
      '</button>';
  }

  function itemThumbnail(item, level) {
    var stage = getStage(level);
    if (item && item.asset && item.type === "outfit") {
      return '<img src="' + esc(item.asset) + '" alt="" loading="lazy" decoding="async" onerror="this.hidden=true">';
    }
    if (item && item.asset && (item.type === "glasses" || item.type === "accessory")) {
      return '<span class="v94-item-layer-preview"><img src="' + esc(stage.asset) + '" alt="" loading="lazy" decoding="async" onerror="this.hidden=true"><img src="' + esc(item.asset) + '" alt="" loading="lazy" decoding="async" onerror="this.hidden=true"></span>';
    }
    return '<span class="v94-item-emoji" aria-hidden="true">' + esc(item && item.thumbnail || "•") + '</span>';
  }

  function preloadItem(type, code) {
    var item = getItem(type, code);
    if (!item || !item.asset || !root.Image) return;
    var image = new Image();
    image.decoding = "async";
    image.src = item.asset;
  }

  root.VDuckieAvatar = Object.freeze({
    render: render,
    getStage: getStage,
    getItem: getItem,
    getItems: function (type) { return (config.items[type] || []).slice(); },
    getCategories: function () { return config.categories.slice(); },
    defaults: function () { return copySelection(config.defaults); },
    normalizeSelection: copySelection,
    resolveSelection: resolveSelection,
    isCompatible: isCompatible,
    incompatibilityReason: incompatibilityReason,
    itemThumbnail: itemThumbnail,
    preloadItem: preloadItem
  });
})(window, document);