(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_LEVEL1_RENDERER_V109__) return;
  root.__VDUCKIE_LEVEL1_RENDERER_V109__ = true;

  var base = root.VDuckieMascot || root.VDuckieAvatar;
  var config = root.VDuckieLevel1Manifest;
  var observer = null;
  var STAGES = ["resting", "first-crack", "peek", "ready"];
  if (!base || !config || typeof base.render !== "function") return;

  function esc(value) {
    var core = root.VDuckieEXPCore;
    return core && core.escapeHtml ? core.escapeHtml(value) : String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function addClass(markup, className) {
    return markup.replace('class="v95-mascot ', 'class="v95-mascot ' + className + ' ');
  }

  function singleVisualMarkup(asset) {
    return '<span class="v109-level1-visual" data-v109-visual-root="single" data-v109-layout="safe-zone-v109.3" aria-hidden="true">' +
      '<span class="v109-level1-motion" data-v109-motion-root="single">' +
      '<img class="v109-level1-image" src="' + esc(asset) + '" alt="" loading="eager" decoding="async" draggable="false" data-v95-asset data-v109-level1-image>' +
      '</span></span>';
  }

  function annotateLevel1(markup, progress, state, asset) {
    markup = addClass(markup, "v109-level1 stage-" + state);
    markup = markup.replace('data-v95-level="1"', 'data-v95-level="1" data-v109-level1="true" data-v109-egg-progress="' + progress + '" data-v109-egg-stage="' + state + '" data-v109-visual-root-count="1"');
    markup = markup.replace(/data-v95-render-mode="[^"]*"/, 'data-v95-render-mode="single-image-v109.3"');
    markup = markup.replace(/data-v95-resolved-asset="[^"]*"/, 'data-v95-resolved-asset="' + esc(asset) + '"');
    return markup;
  }

  function render(options) {
    options = options || {};
    var level = Math.max(1, Math.min(10, Number(options.level || 1)));
    if (level !== 1) return base.render(options);

    var progress = config.clampProgress(options.progressPercent);
    var state = config.stateFor(progress);

    if (state === "hatched") {
      var level2Markup = base.render(Object.assign({}, options, {
        level: config.hatchTarget.level,
        progressPercent: 0,
        animationState: options.animationState === "level-up" ? "level-up" : "idle"
      }));
      return level2Markup.replace('data-v95-level="2"', 'data-v95-level="2" data-v109-origin-level="1" data-v109-egg-progress="100" data-v109-egg-stage="hatched"');
    }

    var asset = config.assetFor(progress, options.animationState || "idle");
    var markup = base.render(options);
    var replacement = singleVisualMarkup(asset);
    var v96Sequence = /<span class="v96-egg-sequence[\s\S]*?<\/span>/;
    var legacyEgg = /<span class="v95-egg egg-[^"]+" aria-hidden="true"><i><\/i><b><\/b><em><\/em><\/span>/;

    if (v96Sequence.test(markup)) markup = markup.replace(v96Sequence, replacement);
    else if (legacyEgg.test(markup)) markup = markup.replace(legacyEgg, replacement);
    else throw new Error("Không tìm thấy visual Level 1 cần thay thế.");

    return annotateLevel1(markup, progress, state, asset);
  }

  function rootsIn(scope) {
    if (!scope || !scope.querySelectorAll) return [];
    var roots = [];
    if (scope.matches && scope.matches('[data-v109-level1="true"]')) roots.push(scope);
    return roots.concat(Array.prototype.slice.call(scope.querySelectorAll('[data-v109-level1="true"]')));
  }

  function animationStateFor(rootNode) {
    if (rootNode.classList.contains("is-level-up")) return "level-up";
    if (rootNode.classList.contains("is-hatching")) return "hatching";
    return "idle";
  }

  function reconcileStage(rootNode) {
    var progress = config.clampProgress(rootNode.getAttribute("data-v109-egg-progress"));
    var state = config.stateFor(progress);
    var expectedClass = "stage-" + state;
    var stageIsCurrent = rootNode.getAttribute("data-v109-egg-stage") === state && rootNode.classList.contains(expectedClass);
    if (!stageIsCurrent) {
      STAGES.forEach(function (name) { rootNode.classList.remove("stage-" + name); });
      if (state !== "hatched") rootNode.classList.add(expectedClass);
      rootNode.setAttribute("data-v109-egg-stage", state);
    }
    rootNode.setAttribute("data-v109-egg-progress", String(progress));
    return { progress: progress, state: state };
  }

  function activeAsset(rootNode) {
    var resolved = reconcileStage(rootNode);
    return config.assetFor(resolved.progress, animationStateFor(rootNode));
  }

  function ensureSingleVisual(rootNode) {
    if (!rootNode || !rootNode.querySelector) return;
    var visual = rootNode.querySelector(".v95-visual");
    if (!visual) return;

    var visualRoot = visual.querySelector("[data-v109-visual-root]");
    if (!visualRoot) {
      visualRoot = document.createElement("span");
      visualRoot.className = "v109-level1-visual";
      visualRoot.setAttribute("data-v109-visual-root", "single");
      visualRoot.setAttribute("data-v109-layout", "safe-zone-v109.3");
      visualRoot.setAttribute("aria-hidden", "true");
      visual.appendChild(visualRoot);
    }

    Array.prototype.slice.call(visual.children).forEach(function (child) {
      if (child !== visualRoot) child.remove();
    });

    var motionRoot = visualRoot.querySelector("[data-v109-motion-root]");
    if (!motionRoot) {
      motionRoot = document.createElement("span");
      motionRoot.className = "v109-level1-motion";
      motionRoot.setAttribute("data-v109-motion-root", "single");
      visualRoot.appendChild(motionRoot);
    }

    Array.prototype.slice.call(visualRoot.children).forEach(function (child) {
      if (child !== motionRoot) child.remove();
    });

    var image = motionRoot.querySelector("[data-v109-level1-image]");
    if (!image) {
      image = document.createElement("img");
      image.className = "v109-level1-image";
      image.alt = "";
      image.loading = "eager";
      image.decoding = "async";
      image.draggable = false;
      image.setAttribute("data-v95-asset", "");
      image.setAttribute("data-v109-level1-image", "");
      motionRoot.appendChild(image);
    }

    Array.prototype.slice.call(motionRoot.children).forEach(function (child) {
      if (child !== image) child.remove();
    });

    visual.style.background = "none";
    visual.style.backgroundImage = "none";
    visual.style.removeProperty("--v95-sprite-url");
    rootNode.style.removeProperty("--v95-sprite-url");
    ["has-loaded-sprite", "has-sprite-fallback", "has-missing-asset", "is-sprite-duckling"].forEach(function (className) {
      if (rootNode.classList.contains(className)) rootNode.classList.remove(className);
    });

    var asset = activeAsset(rootNode);
    image.hidden = false;
    if (image.getAttribute("src") !== asset) image.setAttribute("src", asset);
    rootNode.setAttribute("data-v95-resolved-asset", asset);
    rootNode.setAttribute("data-v109-active-asset", asset);
    rootNode.setAttribute("data-v109-visual-root-count", "1");
  }

  function scan(scope) {
    rootsIn(scope).forEach(ensureSingleVisual);
  }

  function ensureObserver() {
    if (observer || !document || !document.body || typeof root.MutationObserver !== "function") return;
    observer = new root.MutationObserver(function (records) {
      records.forEach(function (record) {
        var owner = record.target && record.target.closest ? record.target.closest('[data-v109-level1="true"]') : null;
        if (owner) ensureSingleVisual(owner);
        Array.prototype.forEach.call(record.addedNodes || [], function (node) {
          if (!node || node.nodeType !== 1) return;
          if (node.matches && node.matches('[data-v109-level1="true"]')) ensureSingleVisual(node);
          else scan(node);
        });
      });
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"], childList: true });
  }

  function hydrate(scope) {
    if (typeof base.hydrate === "function") base.hydrate(scope);
    scan(scope || document);
    ensureObserver();
  }

  if (typeof base.preloadAsset === "function") {
    var preloaded = Object.create(null);
    Object.keys(config.assets).forEach(function (key) {
      var asset = config.assets[key];
      if (!asset || preloaded[asset]) return;
      preloaded[asset] = true;
      base.preloadAsset(asset);
    });
  }

  var api = Object.freeze(Object.assign({}, base, {
    version: "109.3",
    render: render,
    hydrate: hydrate,
    getLevel1State: config.stateFor,
    assertSingleLevel1Visual: ensureSingleVisual
  }));

  root.VDuckieMascot = api;
  root.VDuckieAvatar = api;
})(window, document);
