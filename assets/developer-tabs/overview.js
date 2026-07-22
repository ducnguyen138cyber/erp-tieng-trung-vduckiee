(function (root) {
  "use strict";
  var ns = root.VDuckieDeveloper;
  if (!ns || !ns.actions) return;
  var actions = ns.actions;
  var runtime = ns.runtime;
  var esc = ns.util.esc;
  ns.tabs = ns.tabs || Object.create(null);
  ns.tabOrder = ns.tabOrder || [];

  function button(id, label) {
    return '<button type="button" data-vdev-action="' + id + '">' + esc(label) + "</button>";
  }

  if (!ns.tabs.overview) {
    ns.tabs.overview = {
      id: "overview",
      icon: "🧭",
      label: "Overview",
      render: function (state) {
        var renderer = root.VDuckieMascot;
        var mascot = renderer && renderer.render ? renderer.render({
          level: state.level,
          animationState: state.animation.current || "idle",
          size: "large",
          previewMode: true,
          allowIncompatible: true,
          selectedItems: state.inventory
        }) : '<p>Renderer chưa sẵn sàng.</p>';
        var favorites = actions.favorites();
        var metrics = runtime.metrics();
        var quick = [
          ["evolution.idle", "Idle"], ["evolution.hover", "Hover"],
          ["evolution.correct", "Correct"], ["evolution.wrong", "Wrong"],
          ["evolution.level-up", "Level Up"]
        ];
        return '<div class="vdev-two-column"><section class="vdev-preview-stage" aria-label="Current mascot preview">' + mascot + '<div class="vdev-stat-row"><span>Level <b>' + state.level + '</b></span><span>XP <b>' + state.xp + '</b></span><span>State <b>' + esc(state.animation.current || "idle") + '</b></span></div></section><section class="vdev-overview-controls"><div class="vdev-overview-card"><h3>Current Preview</h3><div class="vdev-metric-grid"><article><span>Current State</span><strong>' + esc(state.animation.current || "idle") + '</strong></article><article><span>Last Action</span><strong>' + esc(state.currentAction || "—") + '</strong></article><article><span>FPS</span><strong>' + esc(metrics.fps || "—") + '</strong></article></div></div><div class="vdev-overview-card"><h3>Quick Actions</h3><div class="vdev-action-grid">' + quick.map(function (item) { return button(item[0], item[1]); }).join("") + '<button type="button" data-vdev-quick="reset-preview">Reset</button></div></div><div class="vdev-overview-card"><h3>★ Favorite</h3><div class="vdev-favorites">' + (favorites.length ? favorites.map(function (def) { return button(def.id, def.label); }).join("") : '<span>Chưa ghim action.</span>') + '</div></div></section></div>';
      }
    };
    ns.tabOrder.unshift("overview");
  }
})(window);
