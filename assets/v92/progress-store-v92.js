(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_PROGRESS_STORE_V92__) return;
  root.__VDUCKIE_PROGRESS_STORE_V92__ = true;

  var core = root.VDuckieEXPCore;
  var exp = root.VDuckieEXP;
  var listeners = [];
  var requestId = 0;
  var snapshot = null;
  var unsubscribeSession = null;

  function levelFromTotal(totalEXP) {
    if (!core || typeof core.calculateUserLevel !== "function") {
      return { level: 1, totalEXP: Math.max(0, Number(totalEXP || 0)), currentLevelEXP: 0, expRequired: 0, progressPercent: 0, expRemaining: 0 };
    }
    return core.calculateUserLevel(totalEXP);
  }

  function buildSnapshot(totalEXP, authenticated) {
    var level = levelFromTotal(totalEXP);
    return Object.freeze({
      authenticated: !!authenticated,
      level: level.level,
      totalEXP: level.totalEXP,
      currentLevelEXP: level.currentLevelEXP,
      expRequired: level.expRequired,
      progressPercent: level.progressPercent,
      expRemaining: level.expRemaining
    });
  }

  function same(a, b) {
    return !!a && !!b && a.authenticated === b.authenticated && a.level === b.level &&
      a.totalEXP === b.totalEXP && a.currentLevelEXP === b.currentLevelEXP &&
      a.expRequired === b.expRequired && a.progressPercent === b.progressPercent;
  }

  function publish(next) {
    if (same(snapshot, next)) return snapshot;
    snapshot = next;
    listeners.slice().forEach(function (listener) {
      try { listener(snapshot); } catch (error) { console.error("VDuckie progress listener failed", error); }
    });
    document.dispatchEvent(new CustomEvent("vduckie:progress-updated", { detail: snapshot }));
    return snapshot;
  }

  function currentSession() {
    return core && typeof core.session === "function" ? core.session() : null;
  }

  function setTotal(totalEXP, authenticated) {
    return publish(buildSnapshot(totalEXP, authenticated));
  }

  function refresh() {
    var session = currentSession();
    var authenticated = !!(session && session.user);
    var currentRequest = ++requestId;
    if (!authenticated || !exp || typeof exp.getCurrentUserEXP !== "function") {
      return Promise.resolve(setTotal(0, false));
    }
    return exp.getCurrentUserEXP().then(function (total) {
      if (currentRequest !== requestId) return snapshot;
      return setTotal(Number(total || 0), true);
    }).catch(function () {
      if (currentRequest !== requestId) return snapshot;
      return setTotal(0, true);
    });
  }

  function subscribe(listener) {
    if (typeof listener !== "function") return function () {};
    listeners.push(listener);
    if (snapshot) listener(snapshot);
    return function () {
      var index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    };
  }

  function init() {
    snapshot = buildSnapshot(0, !!(currentSession() && currentSession().user));
    if (core && typeof core.onSession === "function") {
      unsubscribeSession = core.onSession(function (session) {
        if (!session || !session.user) setTotal(0, false);
        else root.setTimeout(refresh, 0);
      });
    }
    document.addEventListener("vduckie:my-exp-loaded", function (event) {
      var detail = event.detail || {};
      setTotal(Number(detail.totalEXP || 0), !detail.guest && !!(currentSession() && currentSession().user));
    });
    document.addEventListener("vduckie:exp-updated", function () { refresh(); });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && currentSession() && currentSession().user) refresh();
    });
    refresh();
  }

  root.VDuckieProgressStore = Object.freeze({
    getSnapshot: function () { return snapshot || buildSnapshot(0, false); },
    subscribe: subscribe,
    refresh: refresh,
    setFromExistingEXP: function (totalEXP) { return setTotal(totalEXP, !!(currentSession() && currentSession().user)); },
    destroy: function () {
      if (unsubscribeSession) unsubscribeSession();
      unsubscribeSession = null;
      listeners.length = 0;
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})(window, document);
