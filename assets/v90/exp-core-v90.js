(function (root, document) {
  "use strict";

  var VERSION = "90.0";
  var config = root.VDUCKIE_SUPABASE_CONFIG || {};
  var client = null;
  var session = null;
  var listeners = [];
  var toastTimer = null;

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }
  function userMeta(user) {
    var metadata = user && user.user_metadata ? user.user_metadata : {};
    return {
      name: String(metadata.full_name || metadata.name || metadata.display_name || "Người học").trim() || "Người học",
      avatar: String(metadata.avatar_url || metadata.picture || "").trim()
    };
  }
  function initials(name) {
    var parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
    return (parts.length ? parts[parts.length - 1].charAt(0) : "?").toUpperCase();
  }
  function formatNumber(value) {
    return new Intl.NumberFormat("vi-VN").format(Math.max(0, Number(value || 0)));
  }
  function formatEXP(value) { return formatNumber(value) + " EXP"; }
  function calculateUserLevel(totalEXP) {
    var total = Math.max(0, Math.floor(Number(totalEXP || 0)));
    var level = 1;
    var levelFloor = 0;
    var required = 200;
    while (total >= levelFloor + required) {
      levelFloor += required;
      level += 1;
      required = level * 200;
    }
    var current = total - levelFloor;
    return Object.freeze({
      level: level,
      totalEXP: total,
      currentLevelEXP: current,
      expRequired: required,
      progressPercent: required ? Math.min(100, Math.round(current / required * 10000) / 100) : 0,
      expRemaining: Math.max(0, required - current)
    });
  }
  function showToast(message, kind) {
    var toast = byId("expToast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = "exp-toast show" + (kind ? " " + kind : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.className = "exp-toast"; }, 2800);
  }
  function configured() {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url || "") &&
      /^(sb_publishable_|eyJ)/.test(config.publishableKey || "");
  }
  function createClient() {
    if (!configured() || !root.supabase || typeof root.supabase.createClient !== "function") return null;
    return root.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, flowType: "implicit" },
      global: { headers: { "X-Client-Info": "vduckie-exp-v90" } }
    });
  }
  function notify() {
    listeners.slice().forEach(function (callback) {
      try { callback(session); } catch (error) { console.error("EXP session listener failed", error); }
    });
  }
  function setSession(nextSession) {
    session = nextSession || null;
    var identity = byId("cloudIdentity");
    if (identity && session && session.user) identity.textContent = userMeta(session.user).name;
    notify();
    document.dispatchEvent(new CustomEvent("vduckie:exp-session", { detail: { authenticated: !!(session && session.user) } }));
  }
  function onSession(callback) {
    if (typeof callback !== "function") return function () {};
    listeners.push(callback);
    callback(session);
    return function () {
      var index = listeners.indexOf(callback);
      if (index >= 0) listeners.splice(index, 1);
    };
  }
  function rpc(name, args) {
    if (!client) return Promise.reject(new Error("Supabase EXP client is not configured"));
    return client.rpc(name, args || {}).then(function (result) {
      if (result.error) throw result.error;
      return result.data;
    });
  }
  function syncProfile() {
    if (!client || !session || !session.user) return Promise.resolve(null);
    return rpc("sync_my_profile").catch(function (error) {
      console.warn("VDuckie profile sync is waiting for migration v90", error);
      return null;
    });
  }
  function getCurrentUserEXP() {
    if (!client || !session || !session.user) return Promise.resolve(0);
    return rpc("get_my_exp").then(function (value) { return Number(value || 0); }).catch(function () { return 0; });
  }
  function recordLearningEvent(eventCode, sourceId) {
    if (!session || !session.user || !client) return Promise.resolve({ recorded: false, reason: "not_authenticated" });
    return rpc("record_learning_event", { p_event_code: eventCode, p_source_id: sourceId }).then(function (data) {
      var row = Array.isArray(data) ? data[0] : data;
      return row || { recorded: false, reason: "unknown" };
    }).catch(function (error) {
      console.warn("Learning evidence was not recorded", error);
      return { recorded: false, reason: "error", error: error };
    });
  }
  function awardEXP(activityCode, sourceId) {
    if (!session || !session.user) {
      showToast("Đăng nhập Google để lưu EXP và tham gia bảng xếp hạng.");
      return Promise.resolve({ awarded: false, reason: "not_authenticated", exp_awarded: 0 });
    }
    if (!client) return Promise.resolve({ awarded: false, reason: "not_configured", exp_awarded: 0 });
    return rpc("award_exp", { p_activity_code: activityCode, p_source_id: sourceId }).then(function (data) {
      var row = Array.isArray(data) ? data[0] : data;
      row = row || { awarded: false, reason: "unknown", exp_awarded: 0 };
      if (row.awarded) showToast("+" + row.exp_awarded + " EXP", "good");
      document.dispatchEvent(new CustomEvent("vduckie:exp-updated", { detail: row }));
      return row;
    }).catch(function (error) {
      console.error("Award EXP failed", error);
      if (/function|relation|schema cache|award_exp/i.test(String(error.message || error))) {
        showToast("EXP chưa hoạt động: cần chạy migration Supabase v90.", "bad");
      }
      return { awarded: false, reason: "error", exp_awarded: 0, error: error };
    });
  }
  function getWeeklyMissions() {
    if (!session || !session.user || !client) return Promise.resolve([]);
    return rpc("get_weekly_missions").then(function (rows) { return rows || []; });
  }
  function claimWeeklyMission(missionCode) {
    if (!session || !session.user || !client) return Promise.resolve({ awarded: false, reason: "not_authenticated" });
    return rpc("claim_weekly_mission", { p_mission_code: missionCode }).then(function (data) {
      var row = Array.isArray(data) ? data[0] : data;
      row = row || { awarded: false, reason: "unknown", exp_awarded: 0 };
      if (row.awarded) showToast("Nhiệm vụ tuần: +" + row.exp_awarded + " EXP", "good");
      document.dispatchEvent(new CustomEvent("vduckie:exp-updated", { detail: row }));
      return row;
    });
  }
  function refreshLeaderboard(period) {
    if (!root.VDuckieEXPUI) return Promise.resolve();
    return root.VDuckieEXPUI.refreshLeaderboard(period);
  }
  function init() {
    client = createClient();
    if (!client) { notify(); return; }
    client.auth.getSession().then(function (result) { setSession(result.data && result.data.session); });
    client.auth.onAuthStateChange(function (_event, nextSession) {
      setTimeout(function () { setSession(nextSession); }, 0);
    });
  }

  root.VDuckieEXPCore = {
    version: VERSION,
    client: function () { return client; },
    session: function () { return session; },
    onSession: onSession,
    syncProfile: syncProfile,
    userMeta: userMeta,
    initials: initials,
    escapeHtml: escapeHtml,
    formatNumber: formatNumber,
    formatEXP: formatEXP,
    calculateUserLevel: calculateUserLevel,
    showToast: showToast,
    rpc: rpc
  };
  root.VDuckieEXP = Object.freeze({
    awardEXP: awardEXP,
    getCurrentUserEXP: getCurrentUserEXP,
    refreshLeaderboard: refreshLeaderboard,
    recordLearningEvent: recordLearningEvent,
    getWeeklyMissions: getWeeklyMissions,
    claimWeeklyMission: claimWeeklyMission,
    calculateUserLevel: calculateUserLevel
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window, document);
