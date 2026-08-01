(function (root) {
  "use strict";
  if (root.__VDUCKIE_LEVEL1_RENDERER_V109__) return;
  root.__VDUCKIE_LEVEL1_RENDERER_V109__ = true;

  var base = root.VDuckieMascot || root.VDuckieAvatar;
  var config = root.VDuckieLevel1Manifest;
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

  function level1Markup(progressPercent) {
    var state = config.stateFor(progressPercent);
    var assets = config.assets;
    return '<span class="v109-egg-sequence stage-' + state + '" data-v109-egg-stage="' + state + '" aria-hidden="true">' +
      '<img class="v109-egg-frame frame-resting" src="' + esc(assets.resting) + '" alt="" loading="eager" decoding="async" draggable="false" data-v95-asset>' +
      '<img class="v109-egg-frame frame-first-crack" src="' + esc(assets["first-crack"]) + '" alt="" loading="eager" decoding="async" draggable="false" data-v95-asset>' +
      '<img class="v109-egg-frame frame-peek" src="' + esc(assets.peek) + '" alt="" loading="eager" decoding="async" draggable="false" data-v95-asset>' +
      '<img class="v109-egg-frame frame-ready" src="' + esc(assets.ready) + '" alt="" loading="eager" decoding="async" draggable="false" data-v95-asset>' +
      '<img class="v109-hatch-preview" src="' + esc(config.hatchTarget.fallbackAsset) + '" alt="" loading="eager" decoding="async" draggable="false" data-v95-asset>' +
      '</span>';
  }

  function annotateLevel1(markup, progress, state) {
    var asset = config.assets[state] || "";
    markup = addClass(markup, "v109-level1 stage-" + state);
    markup = markup.replace('data-v95-level="1"', 'data-v95-level="1" data-v109-level1="true" data-v109-egg-progress="' + progress + '" data-v109-egg-stage="' + state + '"');
    markup = markup.replace(/data-v95-render-mode="[^"]*"/, 'data-v95-render-mode="svg-sequence-v109"');
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
      var targetState = options.animationState === "hatching" || options.animationState === "level-up" ? "level-up" : "idle";
      var level2Markup = base.render(Object.assign({}, options, {
        level: config.hatchTarget.level,
        progressPercent: 0,
        animationState: targetState
      }));
      level2Markup = addClass(level2Markup, "v109-hatch-target");
      return level2Markup.replace('data-v95-level="2"', 'data-v95-level="2" data-v109-origin-level="1" data-v109-egg-progress="100" data-v109-egg-stage="hatched"');
    }

    var markup = base.render(options);
    var replacement = level1Markup(progress);
    var v96Sequence = /<span class="v96-egg-sequence[\s\S]*?<\/span>/;
    var legacyEgg = /<span class="v95-egg egg-[^"]+" aria-hidden="true"><i><\/i><b><\/b><em><\/em><\/span>/;
    if (v96Sequence.test(markup)) markup = markup.replace(v96Sequence, replacement);
    else if (legacyEgg.test(markup)) markup = markup.replace(legacyEgg, replacement);
    else throw new Error("Không tìm thấy Level 1 egg renderer cần thay thế.");

    return annotateLevel1(markup, progress, state);
  }

  var api = Object.freeze(Object.assign({}, base, {
    version: "109.0",
    render: render,
    getLevel1State: config.stateFor
  }));

  root.VDuckieMascot = api;
  root.VDuckieAvatar = api;
})(window);
