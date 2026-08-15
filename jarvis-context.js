(function (root) {
  "use strict";

  var storageKey = "vduckie-jarvis-context-v1";
  var maxTurns = 12;
  var maxMemories = 80;
  var continuation = /^(tiếp|tiếp tục|làm luôn|làm tiếp|continue|go on|thế cái kia|cái này|nó|phần đó|như lúc nãy)$/i;
  var correction = /^(không|không phải|ý (tôi|tao|mình) là|sửa cái trước|no\b|that's not what i meant|i meant)/i;
  var reference = /^(cái|đó|này|nó|that|it)\b|\b(second|first|previous one|other one|this file|that feature|previous step|continue this|fix that|same thing|thứ (nhất|hai)|cái (đầu|thứ hai))\b/i;
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

  function cloneActive() {
    var active = state.active || {};
    return {
      topic: active.topic || "",
      task: active.task || "",
      project: active.project || "",
      step: active.step || "",
      mode: active.mode || "",
      entities: (active.entities || []).slice(),
      lastCorrection: active.lastCorrection || ""
    };
  }

  function correctionMeaning(message) {
    return compact(message)
      .replace(/^no,?\s*(i meant\s*)?/i, "")
      .replace(/^(that's not what i meant|i meant|không,?\s*(không phải|ý (tôi|tao|mình) là|sửa cái trước)?|không phải|ý (tôi|tao|mình) là|sửa cái trước)[:,\-\s]*/i, "")
      .replace(/^[:,\-\s]+/, "");
  }

  function latestTurn() {
    for (var i = state.turns.length - 1; i >= 0; i--) if (state.turns[i] && state.turns[i].content) return state.turns[i];
    return null;
  }

  function latestUserTurn() {
    for (var i = state.turns.length - 1; i >= 0; i--) if (state.turns[i].role === "user") return state.turns[i];
    return null;
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
    if (turn.metadata.entities) state.active.entities = unique((state.active.entities || []).concat(turn.metadata.entities)).slice(-12);
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
      queryTokens.forEach(function (token) { if (haystack.indexOf(token) !== -1) score += 4; });
      activeTokens.forEach(function (token) { if (haystack.indexOf(token) !== -1) score += 2; });
      if (memory.type === "preference" && score) score += 2;
      if ((memory.type === "task" || memory.type === "project") && score) score += 1;
      return { memory: memory, score: score };
    }).filter(function (item) { return item.score > 0; }).sort(function (a, b) {
      return b.score - a.score || b.memory.updatedAt - a.memory.updatedAt;
    }).slice(0, limit || 5).map(function (item) { return item.memory; });
  }

  function resolve(message) {
    message = compact(message);
    var lower = message.toLocaleLowerCase();
    var shortForm = lower.replace(/[.!?…]+$/g, "").trim();
    var kind = correction.test(lower) ? "correction" : continuation.test(shortForm) ? "continuation" : reference.test(lower) ? "reference" : "follow_up";
    var anchor = kind === "reference" ? (latestTurn() || latestUserTurn()) : kind === "correction" || kind === "continuation" ? (latestUserTurn() || latestTurn()) : null;
    var active = cloneActive();
    var corrected = kind === "correction" ? correctionMeaning(message) : "";
    var referenceInfo = anchor ? { source: "recent_turn", value: anchor.content, confidence: kind === "reference" ? "high" : "medium" } : null;
    if (kind === "reference" && !anchor && active.entities.length) referenceInfo = { source: "active_entity", value: active.entities[active.entities.length - 1], confidence: "medium" };
    return {
      kind: kind,
      message: message,
      active: active,
      anchor: anchor,
      reference: referenceInfo,
      correctedMeaning: corrected,
      memories: retrieve(message + " " + [active.topic, active.task, active.project, active.entities.join(" ")].join(" "), 4)
    };
  }

  function applyMeaning(resolved) {
    if (!resolved) return state.active;
    state.active.intent = resolved.kind;
    if (resolved.reference) state.active.reference = resolved.reference.value;
    if (resolved.kind === "correction") {
      state.active.lastCorrection = resolved.message;
      if (resolved.correctedMeaning) state.active.task = resolved.correctedMeaning;
    }
    var match = /^i(?:'m| am) working on\s+(.+)/i.exec(resolved.message) || /^tôi đang làm\s+(.+)/i.exec(resolved.message);
    if (match) {
      state.active.topic = compact(match[1]);
      state.active.task = compact(match[1]);
      state.active.entities = unique((state.active.entities || []).concat([state.active.topic])).slice(-12);
    }
    save();
    return state.active;
  }

  root.VDuckieJarvisContext = {
    load: load,
    save: save,
    setActive: setActive,
    recordTurn: recordTurn,
    upsertMemory: upsertMemory,
    retrieve: retrieve,
    resolve: resolve,
    applyMeaning: applyMeaning,
    getState: function () { return state; },
    resetWorkingContext: function () { state.active = {}; state.turns = []; save(); }
  };
  load();
})(typeof globalThis !== "undefined" ? globalThis : this);
