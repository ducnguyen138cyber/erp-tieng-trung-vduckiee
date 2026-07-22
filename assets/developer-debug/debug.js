(function (root) {
  "use strict";
  var ns = root.VDuckieDeveloper;
  if (!ns || !ns.actions) return;
  var runtime = ns.runtime;
  var actions = ns.actions;
  var esc = ns.util.esc;
  ns.tabs = ns.tabs || Object.create(null);
  ns.tabOrder = ns.tabOrder || [];

  function detail(key, title, content, copyable) {
    return '<details data-vdev-debug-key="' + key + '"><summary>' + esc(title) + '</summary><div class="vdev-debug-body"><pre>' + esc(content) + '</pre>' + (copyable === false ? "" : '<button type="button" class="vdev-debug-copy" data-vdev-copy-debug>Copy</button>') + '</div></details>';
  }

  if (!ns.tabs.debug) {
    ns.tabs.debug = {
      id: "debug",
      icon: "🛠",
      label: "Debug",
      render: function (state) {
        var m = runtime.metrics();
        var manifest = root.VDuckieMascotManifest || {};
        var polish = root.VDuckiePolishV106 && root.VDuckiePolishV106.getState ? root.VDuckiePolishV106.getState() : {};
        var renderer = {
          currentState: m.currentState,
          resolvedState: m.resolvedState,
          spriteLoaded: m.spriteLoaded,
          frame: m.frame,
          fallback: m.fallback
        };
        var assetRuntime = { sprite: m.sprite, fallback: m.fallback, loadedAssets: m.loadedAssets, preloadedImages: m.preloadedImages };
        var manifestSummary = { version: manifest.version, levels: manifest.levels && Object.keys(manifest.levels).length, states: manifest.states };
        var eventQueue = actions.logs().slice(0, 20).map(function (entry) { return entry.at + " [" + entry.kind + "] " + entry.message; }).join("\n") || "Trống";
        var raw = { previewState: state, metrics: m, v106: polish };
        return '<p class="vdev-note">Các khối Debug mặc định đóng. Chỉ mở phần cần kiểm tra; Raw JSON có vùng cuộn riêng và nút Copy.</p><div class="vdev-debug-accordion">' +
          detail("runtime-state", "Runtime State", JSON.stringify(state, null, 2)) +
          detail("renderer-lifecycle", "Renderer Lifecycle", JSON.stringify(renderer, null, 2)) +
          detail("asset-runtime", "Asset Runtime", JSON.stringify(assetRuntime, null, 2)) +
          detail("asset-manifest", "Asset Manifest", JSON.stringify(manifestSummary, null, 2)) +
          detail("character-preview", "Character Preview Level 1–10", "Character Preview dùng một canvas duy nhất trong tab Evolution.\nLevel hiện tại: " + state.level + "\nChọn Level 1–10 bằng dropdown, không render 10 card dọc.", false).replace('</div></details>', '<button type="button" class="vdev-debug-copy" data-vdev-tab-jump="evolution">Mở Evolution</button></div></details>') +
          detail("event-queue", "Event Queue", eventQueue) +
          detail("animation-queue", "Animation Queue", JSON.stringify({ queue: state.animation.queue, current: state.animation.current, priority: state.animation.priority, cooldown: state.animation.cooldown }, null, 2)) +
          detail("timers", "Timer information", JSON.stringify({ currentTimer: m.currentTimer, timers: m.timers }, null, 2)) +
          detail("listeners", "Listener information", JSON.stringify({ currentListener: m.currentListener, listeners: m.listeners }, null, 2)) +
          detail("raw-json", "Raw JSON", JSON.stringify(raw, null, 2)) +
          "</div>";
      }
    };
    ns.tabOrder.push("debug");
  }
})(window);
