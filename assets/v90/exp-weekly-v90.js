(function (root, document) {
  "use strict";
  var core = root.VDuckieEXPCore;
  var refreshPromise = null;
  var scanTimer = 0;
  var lastScanSignature = "";
  function localDateKey(value) { var date = new Date(Number(value || Date.now())); return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0"); }
  function mondayStart() { var now = new Date(), day = now.getDay() || 7; return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1).getTime(); }
  function stableHash(value) { var input = String(value || ""), hash = 2166136261; for (var index = 0; index < input.length; index += 1) { hash ^= input.charCodeAt(index); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(36); }
  function readSRS() { try { var data = JSON.parse(root.localStorage.getItem("vduckie-review-srs-v1") || "{}"); return data && data.words && typeof data.words === "object" ? data.words : {}; } catch (error) { return {}; } }
  function dispatch(rows, error) { document.dispatchEvent(new CustomEvent("vduckie:weekly-missions-updated", { detail: { missions: rows || [], error: error || null } })); }
  function refresh(options) {
    options = options || {};
    if (refreshPromise) return refreshPromise;
    var session = core.session();
    if (!session || !session.user) { dispatch([]); return Promise.resolve([]); }
    refreshPromise = root.VDuckieEXP.getWeeklyMissions().then(function (rows) {
      rows = rows || [];
      if (options.claim === false) return rows;
      var claimable = rows.filter(function (row) { return row.completed && !row.claimed; });
      var chain = Promise.resolve();
      claimable.forEach(function (row) { chain = chain.then(function () { return root.VDuckieEXP.claimWeeklyMission(row.mission_code); }); });
      return chain.then(function () { return claimable.length ? root.VDuckieEXP.getWeeklyMissions() : rows; });
    }).then(function (rows) {
      dispatch(rows);
      return root.VDuckieEXP.getCurrentUserEXP().then(function (total) { document.dispatchEvent(new CustomEvent("vduckie:my-exp-loaded", { detail: { totalEXP: total } })); return rows; });
    }).then(function (rows) {
      if (root.VDuckieEXPUI && root.VDuckieEXPUI.isLeaderboardOpen()) root.VDuckieEXPUI.refreshLeaderboard();
      document.dispatchEvent(new CustomEvent("vduckie:mini-leaderboard-refresh"));
      return rows;
    }).catch(function (error) { console.error("Weekly missions failed", error); dispatch([], error); return []; }).finally(function () { refreshPromise = null; });
    return refreshPromise;
  }
  function scanReviewEvidence() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(function () {
      var session = core.session(); if (!session || !session.user) return;
      var words = readSRS(), weekStart = mondayStart(), evidence = [];
      Object.keys(words).forEach(function (word) { var lastReviewedAt = Number(words[word] && words[word].lastReviewedAt || 0); if (lastReviewedAt >= weekStart) evidence.push("word:" + stableHash(word) + ":" + localDateKey(lastReviewedAt)); });
      evidence.sort();
      var signature = evidence.join("|");
      if (signature === lastScanSignature) { refresh(); return; }
      lastScanSignature = signature;
      var chain = Promise.resolve();
      evidence.slice(0, 80).forEach(function (source) { chain = chain.then(function () { return root.VDuckieEXP.recordLearningEvent("word_review", source); }); });
      chain.then(function () { return refresh(); });
    }, 180);
  }
  function init() {
    core.onSession(function (session) { lastScanSignature = ""; if (session && session.user) scanReviewEvidence(); else dispatch([]); });
    ["vduckie:retention-change", "vduckie:learning-change", "vduckie:account-learning-synced"].forEach(function (name) { document.addEventListener(name, scanReviewEvidence); });
    document.addEventListener("vduckie:exp-updated", function () { refresh(); });
    root.addEventListener("storage", function (event) { if (event.key === "vduckie-review-srs-v1") scanReviewEvidence(); });
  }
  root.VDuckieWeeklyMissions = Object.freeze({ refresh: refresh, scanReviewEvidence: scanReviewEvidence });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(window, document);
