(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_PROGRESS_STORE_V92__) return;
  root.__VDUCKIE_PROGRESS_STORE_V92__ = true;

  var core = root.VDuckieEXPCore;
  var exp = root.VDuckieEXP;
  var listeners = [];
  var requestId = 0;
  var snapshot = null;
  var progressMeta = null;
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

  function currentSession() {
    return core && typeof core.session === "function" ? core.session() : null;
  }

  function identityOf(session) {
    var user = session && session.user;
    return user && String(user.id || user.email || "") || "guest";
  }

  function buildMeta(options) {
    options = options || {};
    return Object.freeze({
      source: String(options.source || "sync"),
      hydrated: options.hydrated === true,
      sessionIdentity: String(options.sessionIdentity || identityOf(currentSession()))
    });
  }

  function sameMeta(a, b) {
    return !!a && !!b && a.source === b.source && a.hydrated === b.hydrated && a.sessionIdentity === b.sessionIdentity;
  }

  function publish(next, options) {
    var nextMeta = buildMeta(options);
    if (same(snapshot, next) && sameMeta(progressMeta, nextMeta)) return snapshot;
    snapshot = next;
    progressMeta = nextMeta;
    listeners.slice().forEach(function (listener) {
      try { listener(snapshot); } catch (error) { console.error("VDuckie progress listener failed", error); }
    });
    document.dispatchEvent(new CustomEvent("vduckie:progress-updated", { detail: Object.assign({}, snapshot, { progressMeta: progressMeta }) }));
    return snapshot;
  }

  function setTotal(totalEXP, authenticated, options) {
    return publish(buildSnapshot(totalEXP, authenticated), options);
  }

  function refresh(source, expectedIdentity) {
    var session = currentSession();
    var identity = identityOf(session);
    var authenticated = !!(session && session.user);
    var currentRequest = ++requestId;
    var eventSource = String(source || "sync");
    if (expectedIdentity && expectedIdentity !== identity) return Promise.resolve(snapshot);
    if (!authenticated || !exp || typeof exp.getCurrentUserEXP !== "function") {
      return Promise.resolve(setTotal(0, false, { source: eventSource, hydrated: true, sessionIdentity: identity }));
    }
    return exp.getCurrentUserEXP().then(function (total) {
      if (currentRequest !== requestId || identityOf(currentSession()) !== identity) return snapshot;
      return setTotal(Number(total || 0), true, { source: eventSource, hydrated: true, sessionIdentity: identity });
    }).catch(function () {
      if (currentRequest !== requestId || identityOf(currentSession()) !== identity) return snapshot;
      return setTotal(0, true, { source: eventSource, hydrated: true, sessionIdentity: identity });
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
    var initialSession = currentSession();
    snapshot = buildSnapshot(0, !!(initialSession && initialSession.user));
    progressMeta = buildMeta({ source: "initial", hydrated: false, sessionIdentity: identityOf(initialSession) });
    if (core && typeof core.onSession === "function") {
      unsubscribeSession = core.onSession(function (session) {
        var identity = identityOf(session);
        if (!session || !session.user) {
          setTotal(0, false, { source: "session", hydrated: true, sessionIdentity: identity });
          return;
        }
        publish(snapshot || buildSnapshot(0, true), { source: "session", hydrated: false, sessionIdentity: identity });
        root.setTimeout(function () { refresh("hydrate", identity); }, 0);
      });
    }
    document.addEventListener("vduckie:my-exp-loaded", function (event) {
      var detail = event.detail || {};
      setTotal(Number(detail.totalEXP || 0), !detail.guest && !!(currentSession() && currentSession().user), { source: "hydrate", hydrated: true, sessionIdentity: identityOf(currentSession()) });
    });
    document.addEventListener("vduckie:exp-updated", function () { refresh("mutation"); });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && currentSession() && currentSession().user) refresh("sync");
    });
    refresh("hydrate");
  }

  root.VDuckieProgressStore = Object.freeze({
    getSnapshot: function () { return snapshot || buildSnapshot(0, false); },
    getProgressMeta: function () { return progressMeta || buildMeta({ source: "initial", hydrated: false }); },
    subscribe: subscribe,
    refresh: function () { return refresh("sync"); },
    setFromExistingEXP: function (totalEXP) { return setTotal(totalEXP, !!(currentSession() && currentSession().user), { source: "sync", hydrated: true, sessionIdentity: identityOf(currentSession()) }); },
    destroy: function () {
      requestId += 1;
      if (unsubscribeSession) unsubscribeSession();
      unsubscribeSession = null;
      listeners.length = 0;
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})(window, document);
