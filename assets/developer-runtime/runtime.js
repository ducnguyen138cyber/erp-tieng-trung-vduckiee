(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_DEVELOPER_RUNTIME_V107__) return;
  root.__VDUCKIE_DEVELOPER_RUNTIME_V107__ = true;

  var ns = root.VDuckieDeveloper || {};
  var subscribers = [];
  var bridge = null;
  var managedTimers = new Map();
  var managedRafs = new Map();
  var managedListeners = 0;
  var timerSequence = 0;
  var rafSequence = 0;
  var fpsSamples = [];
  var fpsRaf = 0;
  var lastFrameAt = 0;

  function copy(value) {
    return JSON.parse(JSON.stringify(value == null ? null : value));
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value || 0)));
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }
  function defaults() {
    var real = bridge && bridge.getState ? bridge.getState() : null;
    var realLevel = real && real.real && real.real.level || real && real.level || 1;
    return {
      sessionId: "preview-" + Date.now(),
      enabled: true,
      level: clamp(realLevel, 1, 10),
      xp: 0,
      streak: 0,
      dailyQuest: 0,
      weeklyQuest: 0,
      lessonCount: 0,
      speakingScore: 50,
      speakingStatus: "idle",
      microphone: "unknown",
      speechRecognition: "idle",
      inventory: { outfit: "stage-default", accessory: "none", background: "default", effect: "none" },
      inventoryLocks: {},
      achievements: {},
      responsive: { width: 390, zoom: 100 },
      audio: { enabled: true, muted: false, volume: 55 },
      animation: { paused: false, frame: 0, current: "idle", queue: "empty", priority: 0, cooldown: "ready", duration: 0 },
      simulation: { network: "online", supabase: "online", ai: "ready", asset: "ready", animation: "ready" },
      currentAction: "",
      currentScenario: "",
      scenarioRunning: false,
      status: "Preview Session — không ghi dữ liệu thật",
      uiRevision: 0
    };
  }

  var state = defaults();

  function emit(type, detail) {
    var event = { type: type, detail: detail || {}, state: snapshot() };
    subscribers.slice().forEach(function (listener) {
      try { listener(event); } catch (error) { if (root.console && console.error) console.error("Developer Center listener", error); }
    });
  }
  function notify(reason) {
    state.uiRevision += 1;
    emit("state", { reason: reason || "update" });
  }
  function snapshot() { return copy(state); }
  function patch(values, reason) {
    Object.keys(values || {}).forEach(function (key) {
      var next = values[key];
      if (next && typeof next === "object" && !Array.isArray(next) && state[key] && typeof state[key] === "object" && !Array.isArray(state[key])) {
        state[key] = Object.assign({}, state[key], copy(next));
      } else state[key] = copy(next);
    });
    notify(reason);
    return snapshot();
  }
  function subscribe(listener) {
    if (typeof listener !== "function") return function () {};
    subscribers.push(listener);
    return function () {
      var index = subscribers.indexOf(listener);
      if (index >= 0) subscribers.splice(index, 1);
    };
  }
  function setBridge(nextBridge) {
    bridge = nextBridge || null;
    var bridgeState = bridge && bridge.getState ? bridge.getState() : null;
    var level = bridgeState && (bridgeState.active ? bridgeState.level : bridgeState.real && bridgeState.real.level) || state.level;
    state.level = clamp(level, 1, 10);
    if (bridge && bridge.enable) bridge.enable(state.level);
    notify("bridge");
  }
  function getBridge() { return bridge; }
  function currentMascot() {
    return document.querySelector("#vDeveloperControlCenter [data-v95-mascot]") ||
      document.querySelector("#v92EvolutionCard [data-v95-mascot]") || document.querySelector("[data-v95-mascot]");
  }
  function setTimer(fn, delay, label) {
    var token = ++timerSequence;
    var id = root.setTimeout(function () {
      managedTimers.delete(token);
      fn();
    }, Math.max(0, Number(delay || 0)));
    managedTimers.set(token, { id: id, label: label || "timer" });
    return token;
  }
  function clearTimer(token) {
    var entry = managedTimers.get(token);
    if (!entry) return;
    root.clearTimeout(entry.id);
    managedTimers.delete(token);
  }
  function clearTimers() {
    managedTimers.forEach(function (entry) { root.clearTimeout(entry.id); });
    managedTimers.clear();
  }
  function requestRaf(fn, label) {
    var token = ++rafSequence;
    var id = root.requestAnimationFrame(function (time) {
      managedRafs.delete(token);
      fn(time);
    });
    managedRafs.set(token, { id: id, label: label || "raf" });
    return token;
  }
  function clearRafs() {
    managedRafs.forEach(function (entry) { root.cancelAnimationFrame(entry.id); });
    managedRafs.clear();
  }
  function listen(target, type, listener, options) {
    if (!target || !target.addEventListener) return function () {};
    target.addEventListener(type, listener, options);
    managedListeners += 1;
    var active = true;
    return function () {
      if (!active) return;
      active = false;
      target.removeEventListener(type, listener, options);
      managedListeners = Math.max(0, managedListeners - 1);
    };
  }
  function fpsLoop(time) {
    if (lastFrameAt) {
      var delta = time - lastFrameAt;
      if (delta > 0) fpsSamples.push(1000 / delta);
      if (fpsSamples.length > 60) fpsSamples.shift();
    }
    lastFrameAt = time;
    fpsRaf = root.requestAnimationFrame(fpsLoop);
  }
  function startFps() {
    if (fpsRaf || !root.requestAnimationFrame) return;
    fpsRaf = root.requestAnimationFrame(fpsLoop);
  }
  function stopFps() {
    if (fpsRaf) root.cancelAnimationFrame(fpsRaf);
    fpsRaf = 0; lastFrameAt = 0; fpsSamples.length = 0;
  }
  function resolvedAssetCount() {
    return Array.prototype.filter.call(document.images || [], function (image) { return image.complete; }).length;
  }
  function metrics() {
    var mascot = currentMascot();
    var memory = root.performance && root.performance.memory;
    var polish = root.VDuckiePolishV106 && root.VDuckiePolishV106.getState ? root.VDuckiePolishV106.getState() : {};
    var fps = fpsSamples.length ? Math.round(fpsSamples.reduce(function (sum, value) { return sum + value; }, 0) / fpsSamples.length) : 0;
    return {
      fps: fps,
      memory: memory ? Math.round(memory.usedJSHeapSize / 1048576) + " MB" : "Không hỗ trợ",
      loadedAssets: resolvedAssetCount(),
      spriteLoaded: mascot ? mascot.getAttribute("data-v95-load-status") || "unknown" : "unmounted",
      animationQueue: state.animation.queue,
      preloadedImages: polish.preloadedImages || 0,
      currentRaf: managedRafs.size + (fpsRaf ? 1 : 0),
      currentListener: managedListeners,
      currentTimer: managedTimers.size,
      currentState: mascot ? mascot.getAttribute("data-v95-state") || state.animation.current : state.animation.current,
      resolvedState: mascot ? mascot.getAttribute("data-v95-resolved-state") || "idle" : "unmounted",
      frame: state.animation.frame,
      sprite: mascot ? mascot.getAttribute("data-v95-resolved-asset") || "—" : "—",
      fallback: mascot ? mascot.getAttribute("data-v95-using-fallback") || "—" : "—"
    };
  }
  function reloadAssets() {
    var polish = root.VDuckiePolishV106;
    if (polish && polish.preload) polish.preload(state.level);
    var renderer = root.VDuckieMascot;
    var center = document.getElementById("vDeveloperControlCenter");
    if (renderer && renderer.hydrate && center) renderer.hydrate(center);
    emit("toast", { message: "Đã preload lại asset Level " + state.level + " và Level kế tiếp.", tone: "good" });
    notify("reload-assets");
  }
  function reloadManifest() {
    emit("toast", { message: "Đã đọc lại manifest runtime hiện tại (không tải mạng).", tone: "good" });
    notify("reload-manifest");
  }
  function clearRuntimeCache() {
    clearTimers(); clearRafs();
    state.animation.queue = "empty";
    state.animation.frame = 0;
    state.currentScenario = "";
    state.scenarioRunning = false;
    emit("runtime-cleared", {});
    notify("clear-runtime");
  }
  function resetPreview() {
    clearTimers(); clearRafs();
    state = defaults();
    if (bridge && bridge.disable) bridge.disable();
    if (bridge && bridge.enable) bridge.enable(state.level);
    emit("preview-reset", {});
    notify("reset-preview");
    return snapshot();
  }
  function destroy() {
    clearTimers(); clearRafs(); stopFps(); subscribers.length = 0; bridge = null;
  }

  ns.version = "107.0";
  ns.util = Object.freeze({ copy: copy, clamp: clamp, esc: esc });
  ns.runtime = Object.freeze({
    snapshot: snapshot, patch: patch, subscribe: subscribe, emit: emit,
    setBridge: setBridge, getBridge: getBridge, currentMascot: currentMascot,
    setTimer: setTimer, clearTimer: clearTimer, clearTimers: clearTimers,
    requestRaf: requestRaf, clearRafs: clearRafs, listen: listen,
    metrics: metrics, reloadAssets: reloadAssets, reloadManifest: reloadManifest,
    clearRuntimeCache: clearRuntimeCache, resetPreview: resetPreview,
    startFps: startFps, stopFps: stopFps, destroy: destroy
  });
  root.VDuckieDeveloper = ns;
})(window, document);
