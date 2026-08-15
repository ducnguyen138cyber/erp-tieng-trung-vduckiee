(function (root) {
  "use strict";

  var storageKey = "vduckie-jarvis-context-v1";
  var maxTurns = 12;
  var maxMemories = 80;
  var continuation = /^(tiếp|tiếp tục|làm luôn|làm tiếp|continue|go on|thế cái kia|cái này|nó|phần đó|như lúc nãy)$/i;
  var correction = /^(không|không phải|ý (tôi|tao|mình) là|sửa cái trước)/i;
  var state = emptyState();

  function emptyState() {
    return { version: 1, active: {}, turns: [], memories: [], updatedAt: 0 };
  }

  function safeParse(value) {
    try { return JSON.parse(value); } catch (error) { return null; }
  }

  function compact(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function tokens(value) {
    return compact(value).toLocaleLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [];
  }

  function unique(values) {
    var seen = {};
    return (values || []).filter(function (value) {
      var key = compact(value).toLocaleLowerCase();
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function load() {
    if (!root.localStorage) return state;
    var saved = safeParse(root.localStorage.getItem(storageKey));
    if (!saved || saved.version !== 1) return state;
    state = {
      version: 1,
      active: saved.active && typeof saved.active === "object" ? saved.active : {},
      turns: Array.isArray(saved.turns) ? saved.turns.slice(-maxTurns) : [],
      memories: Array.isArray(saved.memories) ? saved.memories.slice(-maxMemories) : [],
      updatedAt: Number(saved.updatedAt) || 0
    };
    return state;
  }

  function save() {
    state.updatedAt = Date.now();
    if (root.localStorage) {
      try { root.localStorage.setItem(storageKey, JSON.stringify(state)); } catch (error) {}
    }
    return state;
  }

  function setActive(next) {
    next = next || {};
    var active = state.active;
    ["topic", "task", "project", "step", "mode"].forEach(function (key) {
      if (next[key] !== undefined) active[key] = compact(next[key]);
    });
    if (next.entities) active.entities = unique(next.entities).slice(0, 12);
    if (next.runtime && typeof next.runtime === "object") active.runtime = next.runtime;
    save();
    return active;
  }

  function recordTurn(role, content, metadata) {
    content = compact(content);
    if (!content) return null;
    var turn = { role: role === "assistant" ? "assistant" : "user", content: content, at: Date.now(), metadata: metadata || {} };
    state.turns.push(turn);
    state.turns = state.turns.slice(-maxTurns);
    if (turn.role === "user" && correction.test(content)) state.active.lastCorrection = content;
    save();
    return turn;
  }

  function normalizeMemory(memory) {
    memory = memory || {};
    var content = compact(memory.content);
    if (!content) return null;
    return {
      id: memory.id || (compact(memory.type || "fact") + ":" + compact(memory.key || content).toLocaleLowerCase()),
      type: /^(fact|preference|project|task)$/.test(memory.type) ? memory.type : "fact",
      key: compact(memory.key),
      content: content,
      entities: unique(memory.entities).slice(0, 12),
      updatedAt: Date.now()
    };
  }

  function upsertMemory(memory) {
    var next = normalizeMemory(memory);
    if (!next) return null;
    var index = -1;
    for (var i = 0; i < state.memories.length; i++) {
      var current = state.memories[i];
      if (current.id === next.id || (next.key && current.type === next.type && current.key.toLocaleLowerCase() === next.key.toLocaleLowerCase())) {
        index = i;
        break;
      }
    }
    if (index >= 0) state.memories[index] = Object.assign({}, state.memories[index], next);
    else state.memories.push(next);
    state.memories = state.memories.slice(-maxMemories);
    save();
    return next;
  }

  function retrieve(query, limit) {
    var queryTokens = tokens(query);
    var activeTokens = tokens([state.active.topic, state.active.task, state.active.project, (state.active.entities || []).join(" ")].join(" "));
    return state.memories.map(function (memory) {
      var haystack = tokens([memory.key, memory.content, (memory.entities || []).join(" ")].join(" "));
      var score = 0;
      queryTokens.forEach(function (token) { if (haystack.indexOf(token) !== -1) score += 3; });
      activeTokens.forEach(function (token) { if (haystack.indexOf(token) !== -1) score += 1; });
      return { memory: memory, score: score };
    }).filter(function (item) { return item.score > 0; }).sort(function (a, b) {
      return b.score - a.score || b.memory.updatedAt - a.memory.updatedAt;
    }).slice(0, limit || 5).map(function (item) { return item.memory; });
  }

  function resolve(message) {
    message = compact(message);
    var lower = message.toLocaleLowerCase();
    var kind = correction.test(lower) ? "correction" : continuation.test(lower) ? "continuation" : /^(cái|đó|này|nó|that|it)\b/i.test(lower) ? "reference" : "new";
    var latestUser = null;
    for (var i = state.turns.length - 1; i >= 0; i--) if (state.turns[i].role === "user") { latestUser = state.turns[i]; break; }
    return {
      kind: kind,
      message: message,
      active: state.active,
      anchor: kind === "new" ? null : (latestUser || state.turns[state.turns.length - 1] || null),
      memories: retrieve(message || [state.active.topic, state.active.task].join(" "), 5)
    };
  }

  root.VDuckieJarvisContext = {
    load: load,
    save: save,
    setActive: setActive,
    recordTurn: recordTurn,
    upsertMemory: upsertMemory,
    retrieve: retrieve,
    resolve: resolve,
    getState: function () { return state; },
    resetWorkingContext: function () { state.active = {}; state.turns = []; save(); }
  };
  load();
})(typeof globalThis !== "undefined" ? globalThis : this);
