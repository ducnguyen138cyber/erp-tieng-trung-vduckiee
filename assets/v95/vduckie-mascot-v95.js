(function (root, document) {
  "use strict";
  if (root.VDuckieMascot) return;

  var manifest = root.VDuckieMascotManifest;
  if (!manifest) return;

  var renderers = Object.create(null);
  var hydratedLottie = typeof WeakSet === "function" ? new WeakSet() : null;
  var hydratedSprites = typeof WeakSet === "function" ? new WeakSet() : null;

  function esc(value) {
    var core = root.VDuckieEXPCore;
    return core && core.escapeHtml ? core.escapeHtml(value) : String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function getStage(level) {
    return manifest.getLevel(level);
  }

  function getItem(type, code) {
    return manifest.getItem(type, code);
  }

  function copySelection(source) {
    source = source && typeof source === "object" ? source : {};
    var result = {};
    Object.keys(manifest.defaults).forEach(function (type) {
      result[type] = getItem(type, source[type]) ? source[type] : manifest.defaults[type];
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
    var normalized = Math.max(1, Math.min(10, Number(level || 1)));
    if (normalized < Number(item.minimumLevel || 1)) return "Cần đạt Level " + item.minimumLevel + ".";
    if (Array.isArray(item.compatibleLevels) && item.compatibleLevels.indexOf(normalized) === -1) return "Không tương thích với Level " + normalized + ".";
    if (item.status === "disabled") return "Item đang tạm khóa.";
    return "";
  }

  function resolveSelection(level, source, allowIncompatible) {
    var selection = copySelection(source);
    ["outfit", "accessory", "background", "effect"].forEach(function (type) {
      var selected = getItem(type, selection[type]);
      if (!allowIncompatible && !isCompatible(selected, level)) selection[type] = manifest.defaults[type];
    });
    selection.skin = "default";
    selection.glasses = "none";
    return selection;
  }

  function resolveAsset(level, selection, state, allowIncompatible) {
    var normalized = resolveSelection(level, selection, allowIncompatible);
    return manifest.resolve({
      level: level,
      outfit: normalized.outfit,
      accessory: normalized.accessory,
      state: state || "idle"
    });
  }

  function eggMarkup(progressPercent) {
    var progress = Math.max(0, Math.min(100, Number(progressPercent || 0)));
    var state = progress < 34 ? "intact" : progress < 67 ? "cracked" : "hatching";
    return '<span class="v95-egg egg-' + state + '" aria-hidden="true"><i></i><b></b><em></em></span>';
  }

  function fullSkinMarkup(resolved, stage, loading) {
    if (!resolved.asset) return '<span class="v95-missing-symbol" aria-hidden="true">' + esc(stage.symbol) + '</span>';
    return '<img class="v95-mascot-image" src="' + esc(resolved.asset) + '" alt="VDuckie ' + esc(stage.name) + '" loading="' + esc(loading || "eager") + '" decoding="async" draggable="false" data-v95-asset>';
  }

  function spriteMarkup(resolved, stage) {
    var style = [
      "--v95-sprite-url:url(&quot;" + esc(resolved.asset) + "&quot;)",
      "--v95-sprite-frames:" + Number(resolved.frames || 1),
      "--v95-sprite-fps:" + Number(resolved.fps || 12),
      "--v95-sprite-columns:" + Number(resolved.columns || resolved.frames || 1),
      "--v95-sprite-rows:" + Number(resolved.rows || 1)
    ].join(";");
    var fallback = resolved.fallbackAsset || stage.fallbackAsset || stage.defaultAsset;
    var states = root.VDuckieMascotStates;
    var plan = states && states.framePlans && states.framePlans[stage.level];
    var columns = Number(resolved.columns || resolved.frames || plan && plan.columns || 1);
    function shift(frame) { return (-100 * Number(frame || 0) / columns).toFixed(6).replace(/0+$/, "").replace(/\.$/, "") + "%"; }
    var stripStyle = "width:" + (columns * 100) + "%;--v102-blink:" + shift(plan && plan.blink) + ";--v102-hover-a:" + shift(plan && plan.hoverA) + ";--v102-hover-b:" + shift(plan && plan.hoverB) + ";--v102-hover:" + shift(plan && (plan.hover == null ? plan.hoverB : plan.hover)) + ";--v102-success:" + shift(plan && plan.success) + ";--v102-sad:" + shift(plan && plan.sad) + ";--v102-outfit:" + shift(plan && plan.outfit);
    return '<span class="v95-sprite-stack">' + (fallback ? '<img class="v95-mascot-image v95-sprite-fallback" src="' + esc(fallback) + '" alt="VDuckie ' + esc(stage.name) + '" loading="eager" decoding="async" draggable="false" data-v95-asset data-v95-fallback-asset>' : '') + '<img class="v102-sprite-strip" src="' + esc(resolved.asset) + '" alt="" aria-hidden="true" draggable="false" decoding="async" style="' + stripStyle + '"><span class="v95-sprite" role="img" aria-label="VDuckie ' + esc(stage.name) + '" style="' + style + '" data-v95-sprite-src="' + esc(resolved.asset) + '"></span></span>';
  }

  function lottieMarkup(resolved, stage) {
    var fallback = resolved.fallbackAsset || stage.defaultAsset;
    return '<span class="v95-lottie-host" role="img" aria-label="VDuckie ' + esc(stage.name) + '" data-v95-lottie-src="' + esc(resolved.asset) + '" data-v95-lottie-state="' + esc(resolved.state) + '">' +
      (fallback ? '<img class="v95-mascot-image v95-lottie-fallback" src="' + esc(fallback) + '" alt="" loading="eager" decoding="async" draggable="false" data-v95-asset>' : '<span class="v95-missing-symbol" aria-hidden="true">' + esc(stage.symbol) + '</span>') +
      '</span>';
  }

  function backgroundMarkup(item) {
    var cssClass = item && item.cssClass || "bg-default";
    return '<span class="v95-background ' + esc(cssClass) + '" aria-hidden="true"></span>';
  }

  function effectMarkup(item) {
    var cssClass = item && item.cssClass || "fx-none";
    return '<span class="v95-effect ' + esc(cssClass) + '" aria-hidden="true"><i></i><b></b><em></em></span>';
  }

  function thoughtMarkup() {
    return '<span class="v95-thought" role="status" aria-live="polite" aria-atomic="true">' +
      '<span class="v95-thought-tail" aria-hidden="true"><i></i><b></b></span>' +
      '<span class="v95-thought-cloud"><strong data-v95-thought-zh></strong><span data-v95-thought-vi></span></span>' +
      '</span>';
  }

  function render(options) {
    options = options || {};
    var stage = getStage(options.level);
    var selection = resolveSelection(stage.level, options.selectedItems, !!options.allowIncompatible);
    var state = manifest.states.indexOf(options.animationState) >= 0 ? options.animationState : "idle";
    var resolved = resolveAsset(stage.level, selection, state, !!options.allowIncompatible);
    var background = getItem("background", selection.background);
    var effect = getItem("effect", selection.effect);
    var motion = manifest.motion[stage.level] || manifest.motion[1];
    var size = /^(tiny|compact|medium|large)$/.test(options.size || "") ? options.size : "large";
    var classes = [
      "v95-mascot",
      "v95-size-" + size,
      "v95-level-" + stage.level,
      "v95-profile-" + motion.profile,
      "is-" + state
    ];
    if (stage.level === 1) classes.push("is-egg");
    if (options.previewMode) classes.push("is-preview");
    if (resolved.missingCombination) classes.push("has-missing-combination");
    if (effect && effect.code !== "none") classes.push("has-effect-" + effect.code);
    if (background) classes.push("has-background-" + background.code);

    var visual;
    if (stage.level === 1 || resolved.renderMode === "css-egg") visual = eggMarkup(options.progressPercent);
    else if (resolved.renderMode === "sprite") visual = spriteMarkup(resolved, stage);
    else if (resolved.renderMode === "lottie") visual = lottieMarkup(resolved, stage);
    else visual = fullSkinMarkup(resolved, stage, size === "compact" || size === "tiny" ? "lazy" : "eager");

    var style = "--v95-origin:" + esc(motion.transformOrigin) + ";--v95-accent-x:" + esc(motion.accentX) + ";--v95-accent-y:" + esc(motion.accentY) + ";";
    return '<button type="button" class="' + classes.join(" ") + '" style="' + style + '" data-v95-mascot data-v94-avatar data-v95-level="' + stage.level + '" data-v95-state="' + esc(state) + '" data-v95-requested-state="' + esc(resolved.requestedState || state) + '" data-v95-resolved-state="' + esc(resolved.resolvedState || resolved.state || "idle") + '" data-v95-runtime-state="loading" data-v95-animation-ready="false" data-v95-animation-class="is-' + esc(state) + '" data-v95-animation-duration="0" data-v95-render-mode="' + esc(resolved.renderMode) + '" data-v95-resolved-asset="' + esc(resolved.asset || '') + '" data-v95-fallback-asset="' + esc(resolved.fallbackAsset || stage.fallbackAsset || stage.defaultAsset || '') + '" data-v95-load-status="loading" data-v95-using-fallback="true" data-v95-missing-combination="' + (resolved.missingCombination ? "true" : "false") + '" aria-label="VDuckie Level ' + stage.level + ': ' + esc(stage.name) + '. Chạm để xem suy nghĩ" aria-expanded="false">' +
      backgroundMarkup(background) +
      '<span class="v95-character"><span class="v95-visual">' + visual + '</span><span class="v95-motion-accent" aria-hidden="true"></span><span class="v95-fallback-symbol" aria-hidden="true">' + esc(stage.symbol) + '</span></span>' +
      effectMarkup(effect) +
      thoughtMarkup() +
      '</button>';
  }

  function findPreviewAsset(item, level) {
    if (!item) return null;
    if (item.type === "outfit") return manifest.resolve({ level: level, outfit: item.code, accessory: "none", state: "idle" });
    if (item.type === "accessory") return manifest.resolve({ level: level, outfit: "stage-default", accessory: item.code, state: "idle" });
    return null;
  }

  function itemThumbnail(item, level) {
    var resolved = findPreviewAsset(item, level);
    if (resolved && resolved.exactCombination && resolved.asset && resolved.renderMode === "full-skin") {
      return '<img src="' + esc(resolved.asset) + '" alt="" loading="lazy" decoding="async" data-v95-asset>';
    }
    return '<span class="v95-item-emoji" aria-hidden="true">' + esc(item && item.thumbnail || "•") + '</span>';
  }

  function preloadAsset(asset) {
    if (!asset || !root.Image) return;
    var image = new Image();
    image.decoding = "async";
    image.src = asset;
  }

  function preloadItem(type, code, level, selection) {
    var nextSelection = copySelection(selection || manifest.defaults);
    nextSelection[type] = code;
    var resolved = resolveAsset(level || 1, nextSelection, "idle", true);
    if (resolved && resolved.asset && resolved.renderMode === "full-skin") preloadAsset(resolved.asset);
  }

  function selectionStatus(level, selection, allowIncompatible) {
    var normalized = resolveSelection(level, selection, allowIncompatible);
    var outfit = getItem("outfit", normalized.outfit);
    var accessory = getItem("accessory", normalized.accessory);
    var outfitReason = incompatibilityReason(outfit, level);
    var accessoryReason = incompatibilityReason(accessory, level);
    var resolved = resolveAsset(level, normalized, "idle", allowIncompatible);
    var reason = outfitReason || accessoryReason || (resolved.missingCombination ? "Chưa có hình phù hợp cho tổ hợp trang phục và phụ kiện này." : "");
    return Object.freeze({
      selection: Object.freeze(normalized),
      resolved: resolved,
      valid: !outfitReason && !accessoryReason && !resolved.missingCombination,
      compatible: !outfitReason && !accessoryReason,
      missingCombination: resolved.missingCombination,
      reason: reason
    });
  }

  function hydrate(scope) {
    var host = scope && scope.querySelectorAll ? scope : document;
    Array.prototype.forEach.call(host.querySelectorAll("[data-v95-asset]"), function (image) {
      if (image.__v95Bound) return;
      image.__v95Bound = true;
      function loaded() {
        image.classList.add("is-loaded");
        var mascot = image.closest && image.closest("[data-v95-mascot]");
        if (mascot) { mascot.classList.add("has-loaded-asset"); mascot.setAttribute("data-v95-runtime-state", "ready"); if (!image.hasAttribute("data-v95-fallback-asset")) mascot.setAttribute("data-v95-load-status", "loaded"); }
      }
      function failed() {
        image.hidden = true;
        var mascot = image.closest && image.closest("[data-v95-mascot]");
        if (mascot) { mascot.classList.add("has-missing-asset"); mascot.setAttribute("data-v95-load-status", "failed"); mascot.setAttribute("data-v95-runtime-state", "error"); }
      }
      image.addEventListener("load", loaded, { once: true });
      image.addEventListener("error", failed, { once: true });
      if (image.complete) {
        if (image.naturalWidth > 0) loaded();
        else failed();
      }
    });
    Array.prototype.forEach.call(host.querySelectorAll("[data-v95-sprite-src]"), function (element) {
      if (hydratedSprites && hydratedSprites.has(element)) return;
      if (hydratedSprites) hydratedSprites.add(element);
      var mascot = element.closest && element.closest("[data-v95-mascot]");
      var source = element.getAttribute("data-v95-sprite-src");
      if (!source || !root.Image) return;
      var settled = false;
      var image = new Image();
      var timeout = root.setTimeout(function () { failed("timeout"); }, 5000);
      function loaded() {
        if (settled) return;
        settled = true; root.clearTimeout(timeout);
        if (mascot) { mascot.classList.add("has-decoded-sprite"); mascot.classList.remove("has-missing-asset"); mascot.setAttribute("data-v95-load-status", "loaded"); mascot.setAttribute("data-v95-runtime-state", "ready"); mascot.setAttribute("data-v95-animation-ready", "true"); mascot.setAttribute("data-v95-using-fallback", "false"); }
      }
      function failed(reason) {
        if (settled) return;
        settled = true; root.clearTimeout(timeout); element.hidden = true;
        if (mascot) { mascot.classList.add("has-sprite-fallback"); mascot.setAttribute("data-v95-load-status", "failed"); mascot.setAttribute("data-v95-runtime-state", "error"); mascot.setAttribute("data-v95-animation-ready", "false"); mascot.setAttribute("data-v95-using-fallback", "true"); }
        if (root.location && /^(localhost|127\.0\.0\.1)$/.test(root.location.hostname) && root.console && console.warn) console.warn("VDuckie sprite fallback", source, reason || "load-error");
      }
      image.onload = loaded; image.onerror = failed; image.decoding = "async"; image.src = source;
    });
    Array.prototype.forEach.call(host.querySelectorAll("[data-v95-lottie-src]"), function (element) {
      if (hydratedLottie && hydratedLottie.has(element)) return;
      if (hydratedLottie) hydratedLottie.add(element);
      if (typeof renderers.lottie === "function") {
        try { renderers.lottie(element, { src: element.getAttribute("data-v95-lottie-src"), state: element.getAttribute("data-v95-lottie-state") }); } catch (error) {}
      } else {
        document.dispatchEvent(new CustomEvent("vduckie:lottie-request", { detail: { element: element, src: element.getAttribute("data-v95-lottie-src"), state: element.getAttribute("data-v95-lottie-state") } }));
      }
    });
  }

  var API = Object.freeze({
    version: "95.0",
    render: render,
    hydrate: hydrate,
    getStage: getStage,
    getStages: function () { return Object.keys(manifest.levels).map(function (key) { return manifest.levels[key]; }); },
    getItem: getItem,
    getItems: function (type) { return manifest.getItems(type); },
    getCategories: function () { return manifest.categories.slice(); },
    defaults: function () { return copySelection(manifest.defaults); },
    normalizeSelection: copySelection,
    resolveSelection: resolveSelection,
    resolveAsset: resolveAsset,
    selectionStatus: selectionStatus,
    isCompatible: isCompatible,
    incompatibilityReason: incompatibilityReason,
    itemThumbnail: itemThumbnail,
    preloadItem: preloadItem,
    preloadAsset: preloadAsset,
    registerRenderer: function (mode, renderer) { if (typeof renderer === "function") renderers[String(mode)] = renderer; }
  });

  root.VDuckieMascot = API;
  root.VDuckieAvatar = API;
})(window, document);
