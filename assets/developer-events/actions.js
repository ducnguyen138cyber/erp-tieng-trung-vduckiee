(function (root, document) {
  "use strict";
  var ns = root.VDuckieDeveloper;
  if (!ns || ns.actions) return;
  var runtime = ns.runtime;
  var registry = Object.create(null);
  var order = [];
  var history = [];
  var favorites = Object.create(null);
  var logs = [];
  var current = null;
  var audioContext = null;
  var resumePromise = null;
  var pendingSound = "";
  var soundSequence = 0;

  function log(kind, message, detail) {
    logs.unshift({ at: new Date().toISOString(), kind: kind, message: String(message || ""), detail: detail || null });
    if (logs.length > 100) logs.length = 100;
    runtime.emit("log", logs[0]);
  }
  function register(definition) {
    if (!definition || !definition.id || registry[definition.id]) return;
    var def = Object.assign({ tab: "debug", label: definition.id, keywords: [], favorite: false }, definition);
    registry[def.id] = def; order.push(def.id);
    if (def.favorite) favorites[def.id] = true;
  }
  function get(id) { return registry[id] || null; }
  function list() { return order.map(function (id) { return registry[id]; }); }
  function search(query) {
    var normalized = String(query || "").trim().toLowerCase();
    if (!normalized) return list();
    return list().filter(function (def) {
      return [def.id, def.label, def.tab].concat(def.keywords || []).join(" ").toLowerCase().indexOf(normalized) >= 0;
    });
  }
  function record(def, payload) {
    history.unshift({ id: def.id, label: def.label, tab: def.tab, payload: payload || {}, at: Date.now() });
    if (history.length > 20) history.length = 20;
    current = history[0];
    runtime.patch({ currentAction: def.label }, "action");
    runtime.emit("history", { item: current });
  }
  function run(id, payload, options) {
    var def = get(id);
    if (!def) return Promise.reject(new Error("Unknown Developer action: " + id));
    options = options || {};
    var context = { root: root, document: document, runtime: runtime, actions: api, bridge: runtime.getBridge(), state: runtime.snapshot(), audio: audio };
    try {
      var result = def.run ? def.run(context, payload || {}) : null;
      return Promise.resolve(result).then(function (value) {
        if (!options.noHistory) record(def, payload || {});
        log("action", def.label, payload || {});
        return value;
      }).catch(function (error) {
        log("error", def.label + ": " + error.message, payload || {});
        runtime.emit("toast", { message: error.message, tone: "bad" });
        throw error;
      });
    } catch (error) {
      log("error", def.label + ": " + error.message, payload || {});
      runtime.emit("toast", { message: error.message, tone: "bad" });
      return Promise.reject(error);
    }
  }
  function replay(item) {
    var target = item || current;
    return target ? run(target.id, target.payload || {}) : Promise.resolve(false);
  }
  function toggleFavorite(id) {
    if (!registry[id]) return false;
    favorites[id] = !favorites[id];
    runtime.emit("favorites", { id: id, active: favorites[id] });
    return favorites[id];
  }
  function favoriteList() { return order.filter(function (id) { return favorites[id]; }).map(function (id) { return registry[id]; }); }
  function clearHistory() { history.length = 0; current = null; runtime.emit("history-cleared", {}); }

  function ensureContext() {
    if (audioContext) return audioContext;
    var Constructor = root.AudioContext || root.webkitAudioContext;
    if (!Constructor) return null;
    try { audioContext = new Constructor(); } catch (error) { return null; }
    return audioContext;
  }
  function ensureAudioReady() {
    var context = ensureContext();
    if (!context) return Promise.resolve(null);
    if (context.state === "running") return Promise.resolve(context);
    if (context.state !== "suspended" || typeof context.resume !== "function") return Promise.resolve(null);
    if (resumePromise) return resumePromise;
    resumePromise = Promise.resolve().then(function () { return context.resume(); }).then(function () {
      return context.state === "running" ? context : null;
    }).catch(function () { return null; }).finally(function () { resumePromise = null; });
    return resumePromise;
  }
  function playNow(kind) {
    var state = runtime.snapshot().audio;
    if (!state.enabled || state.muted || !audioContext || audioContext.state !== "running") return false;
    var tones = { hover:[520,.045],click:[390,.05],correct:[620,.12],wrong:[240,.13],unlock:[660,.16],levelup:[740,.28],streak:[210,.16],pronunciation:[590,.13] };
    var spec = tones[kind] || tones.click;
    var volume = Math.max(.0001, Math.min(.055, Number(state.volume || 0) / 1000));
    try {
      var now = audioContext.currentTime, oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = "sine"; oscillator.frequency.setValueAtTime(spec[0], now);
      if (kind === "unlock" || kind === "levelup") oscillator.frequency.exponentialRampToValueAtTime(spec[0] * 1.35, now + spec[1]);
      gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(volume, now + .018); gain.gain.exponentialRampToValueAtTime(.0001, now + spec[1]);
      oscillator.connect(gain).connect(audioContext.destination); oscillator.start(now); oscillator.stop(now + spec[1] + .02);
      return true;
    } catch (error) { return false; }
  }
  function play(kind) {
    var request = ++soundSequence; pendingSound = kind;
    return ensureAudioReady().then(function (context) {
      if (!context || request !== soundSequence) return false;
      var sound = pendingSound; pendingSound = ""; return playNow(sound);
    });
  }
  function closeAudio() {
    soundSequence += 1; pendingSound = ""; resumePromise = null;
    if (audioContext && audioContext.close) audioContext.close().catch(function () {});
    audioContext = null;
  }

  var audio = Object.freeze({ play: play, ensureReady: ensureAudioReady, close: closeAudio, state: function () { return audioContext ? audioContext.state : "closed"; } });
  var api = Object.freeze({
    register: register, get: get, list: list, search: search, run: run, replay: replay,
    toggleFavorite: toggleFavorite, favorites: favoriteList,
    history: function () { return history.slice(); }, clearHistory: clearHistory,
    current: function () { return current; }, logs: function () { return logs.slice(); },
    log: log, audio: audio
  });
  ns.actions = api;
})(window, document);
