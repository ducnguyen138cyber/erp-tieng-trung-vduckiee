(function (root, document) {
  "use strict";

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
      name: String(metadata.full_name || metadata.name || "Người học").trim() || "Người học",
      avatar: String(metadata.avatar_url || metadata.picture || "").trim()
    };
  }
  function initials(name) {
    var parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
    return (parts.length ? parts[parts.length - 1].charAt(0) : "?").toUpperCase();
  }
  function formatEXP(value) {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + " EXP";
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
    return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url || "") && /^(sb_publishable_|eyJ)/.test(config.publishableKey || "");
  }
  function createClient() {
    if (!configured() || !root.supabase || typeof root.supabase.createClient !== "function") return null;
    return root.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, flowType: "implicit" },
      global: { headers: { "X-Client-Info": "vduckie-exp-v89" } }
    });
  }
  function notify() {
    for (var index = 0; index < listeners.length; index++) {
      try { listeners[index](session); } catch (error) { console.error("EXP session listener failed", error); }
    }
  }
  function setSession(nextSession) {
    session = nextSession || null;
    var identity = byId("cloudIdentity");
    if (identity && session && session.user) identity.textContent = userMeta(session.user).name;
    notify();
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
  function syncProfile() {
    if (!client || !session || !session.user) return Promise.resolve();
    return client.rpc("sync_my_profile").then(function (result) {
      if (result.error) throw result.error;
    }).catch(function (error) {
      console.warn("VDuckie profile sync is waiting for migration", error);
    });
  }
  function awardEXP(activityCode, sourceId) {
    if (!session || !session.user) {
      showToast("Đăng nhập Google để lưu EXP và tham gia bảng xếp hạng.");
      return Promise.resolve({ awarded: false, reason: "not_authenticated", exp_awarded: 0 });
    }
    if (!client) return Promise.resolve({ awarded: false, reason: "not_configured", exp_awarded: 0 });
    return client.rpc("award_exp", { p_activity_code: activityCode, p_source_id: sourceId }).then(function (result) {
      if (result.error) throw result.error;
      var row = Array.isArray(result.data) ? result.data[0] : result.data;
      row = row || { awarded: false, reason: "unknown", exp_awarded: 0 };
      if (row.awarded) {
        showToast("+" + row.exp_awarded + " EXP", "good");
        if (root.VDuckieEXPUI) root.VDuckieEXPUI.renderMyEXP(row.total_exp);
        if (root.VDuckieEXPUI && root.VDuckieEXPUI.isLeaderboardOpen()) root.VDuckieEXPUI.refreshLeaderboard();
      }
      return row;
    }).catch(function (error) {
      console.error("Award EXP failed", error);
      if (/function|relation|schema cache|award_exp/i.test(String(error.message || error))) showToast("EXP chưa hoạt động: cần chạy migration Supabase.", "bad");
      return { awarded: false, reason: "error", exp_awarded: 0, error: error };
    });
  }
  function getCurrentUserEXP() {
    if (!client || !session || !session.user) return Promise.resolve(0);
    return client.rpc("get_my_exp").then(function (result) {
      if (result.error) throw result.error;
      return Number(result.data || 0);
    }).catch(function () { return 0; });
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
    client: function () { return client; },
    session: function () { return session; },
    onSession: onSession,
    syncProfile: syncProfile,
    userMeta: userMeta,
    initials: initials,
    escapeHtml: escapeHtml,
    formatEXP: formatEXP,
    showToast: showToast
  };
  root.VDuckieEXP = Object.freeze({
    awardEXP: awardEXP,
    getCurrentUserEXP: getCurrentUserEXP,
    refreshLeaderboard: refreshLeaderboard
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window, document);
