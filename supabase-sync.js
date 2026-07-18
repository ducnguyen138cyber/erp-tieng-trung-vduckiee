(function () {
  "use strict";

  var config = window.VDUCKIE_SUPABASE_CONFIG || {};
  var client = null;
  var session = null;
  var syncing = false;
  var syncAgain = false;
  var queueKey = "vduckie-cloud-queue-v1";

  var progressWordKey = "__vduckie_hsk_progress_v1__";
  var progressCategory = "__system_hsk_progress__";
  var hskProgressKey = "erp-hsk-progress-v2";
  var hskStateKey = "erp-hsk-state-v2";
  var hskMetaKey = "vduckie-hsk-progress-meta-v1";
  var activeUserKey = "vduckie-hsk-active-user-v1";
  var accountCachePrefix = "vduckie-hsk-account-cache-v1:";
  var anonymousProfile = "anonymous";
  var progressPoll = null;
  var progressUploadTimer = null;
  var lastObservedProgress = null;
  var applyingProgress = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function isConfigured() {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url || "") &&
      /^(sb_publishable_|eyJ)/.test(config.publishableKey || "") &&
      String(config.url).indexOf("YOUR_PROJECT") === -1;
  }

  function readJson(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || "");
      return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  function readQueue() {
    return readJson(queueKey, {});
  }

  function saveQueue(queue) {
    writeJson(queueKey, queue);
  }

  function queueRow(row) {
    if (!row || !row.word_key || row.word_key === progressWordKey || /^__vduckie_/.test(row.word_key) || /^__system_/.test(String(row.category || ""))) return;
    var queue = readQueue();
    queue[row.word_key] = row;
    saveQueue(queue);
  }

  function setStatus(message, kind) {
    var element = byId("cloudSyncStatus");
    if (!element) return;
    element.textContent = message;
    element.className = "cloud-sync-status" + (kind ? " " + kind : "");
  }

  function displayName(user) {
    if (!user) return "";
    var metadata = user.user_metadata || {};
    return metadata.full_name || metadata.name || user.email || "Tài khoản Google";
  }

  function renderAuth() {
    var login = byId("cloudLogin");
    var logout = byId("cloudLogout");
    var identity = byId("cloudIdentity");
    if (!login || !logout || !identity) return;

    if (!isConfigured()) {
      login.disabled = true;
      login.textContent = "Chưa cấu hình Supabase";
      logout.classList.add("hidden");
      identity.textContent = "Dữ liệu đang lưu trên thiết bị";
      setStatus("Chưa bật đồng bộ", "muted-status");
      return;
    }

    login.disabled = false;
    if (session && session.user) {
      login.classList.add("hidden");
      logout.classList.remove("hidden");
      identity.textContent = displayName(session.user);
      setStatus(navigator.onLine ? "Đã đăng nhập" : "Ngoại tuyến", navigator.onLine ? "good" : "waiting");
    } else {
      login.classList.remove("hidden");
      login.textContent = "Đăng nhập Google";
      logout.classList.add("hidden");
      identity.textContent = "Dữ liệu đang lưu trên thiết bị";
      setStatus("Đăng nhập để đồng bộ", "muted-status");
    }
  }

  function redirectUrl() {
    if (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
      return window.location.origin + window.location.pathname;
    }
    return config.redirectUrl || (window.location.origin + window.location.pathname);
  }

  function mapForDatabase(row, userId) {
    return {
      user_id: userId,
      word_key: String(row.word_key || row.hanzi || "").trim(),
      hanzi: String(row.hanzi || row.word_key || "").trim(),
      pinyin: String(row.pinyin || ""),
      near_vi: String(row.near_vi || ""),
      meaning_vi: String(row.meaning_vi || ""),
      category: String(row.category || ""),
      note: String(row.note || ""),
      example_zh: String(row.example_zh || ""),
      example_vi: String(row.example_vi || ""),
      is_known: !!row.is_known,
      is_saved: !!row.is_saved,
      known_updated_at: row.known_updated_at || null,
      saved_updated_at: row.saved_updated_at || null
    };
  }

  function upsertRows(rows) {
    if (!session || !session.user || !rows.length) return Promise.resolve();
    var payload = [];
    for (var i = 0; i < rows.length; i++) {
      var mapped = mapForDatabase(rows[i], session.user.id);
      if (mapped.word_key && mapped.word_key !== progressWordKey && !/^__vduckie_/.test(mapped.word_key) && !/^__system_/.test(String(mapped.category || ""))) payload.push(mapped);
    }
    if (!payload.length) return Promise.resolve();
    return client.from("user_words").upsert(payload, {
      onConflict: "user_id,word_key"
    }).then(function (result) {
      if (result.error) throw result.error;
    });
  }

  function flushQueue() {
    if (!session || !session.user || !navigator.onLine) return Promise.resolve();
    var queue = readQueue();
    var keys = Object.keys(queue);
    if (!keys.length) return Promise.resolve();
    var rows = [];
    for (var i = 0; i < keys.length; i++) rows.push(queue[keys[i]]);
    return upsertRows(rows).then(function () {
      saveQueue({});
    });
  }

  function timestamp(value) {
    var number = Number(value || 0);
    if (isFinite(number) && number > 0) return number;
    var parsed = Date.parse(value || "");
    return isNaN(parsed) ? 0 : parsed;
  }

  function sanitizeState(state) {
    state = state && typeof state === "object" ? state : {};
    var level = Number(state.level);
    var lesson = Number(state.lesson);
    if (!isFinite(level) || level < 0 || level > 4) level = 0;
    if (!isFinite(lesson) || lesson < 0) lesson = 0;
    return { level: Math.floor(level), lesson: Math.floor(lesson) };
  }

  function emptyProgressSnapshot() {
    return {
      version: 1,
      completionStates: {},
      state: { level: 0, lesson: 0 },
      stateUpdatedAt: 0,
      updatedAt: 0
    };
  }

  function normalizeProgressSnapshot(value) {
    var source = value && typeof value === "object" ? value : {};
    var snapshot = emptyProgressSnapshot();
    var rawStates = source.completionStates && typeof source.completionStates === "object" ? source.completionStates : {};
    var rawCompleted = source.completed && typeof source.completed === "object" ? source.completed : {};
    var rawTimes = source.completionTimes && typeof source.completionTimes === "object" ? source.completionTimes : {};
    var ids = Object.keys(rawStates).concat(Object.keys(rawCompleted));
    var seen = {};

    for (var i = 0; i < ids.length; i++) {
      var id = String(ids[i] || "").trim();
      if (!id || seen[id]) continue;
      seen[id] = true;
      var stateValue = rawStates[id];
      var done = false;
      var updatedAt = 0;
      if (stateValue && typeof stateValue === "object") {
        done = !!stateValue.done;
        updatedAt = timestamp(stateValue.updatedAt);
      } else if (typeof stateValue === "boolean") {
        done = stateValue;
      } else {
        done = !!rawCompleted[id];
      }
      if (!updatedAt) updatedAt = timestamp(rawTimes[id]);
      if (!updatedAt && done) updatedAt = 1;
      snapshot.completionStates[id] = { done: done, updatedAt: updatedAt };
    }

    snapshot.state = sanitizeState(source.state);
    snapshot.stateUpdatedAt = timestamp(source.stateUpdatedAt);
    snapshot.updatedAt = Math.max(timestamp(source.updatedAt), snapshot.stateUpdatedAt);
    var stateIds = Object.keys(snapshot.completionStates);
    for (var j = 0; j < stateIds.length; j++) {
      snapshot.updatedAt = Math.max(snapshot.updatedAt, snapshot.completionStates[stateIds[j]].updatedAt);
    }
    return snapshot;
  }

  function captureLocalProgress() {
    var completed = readJson(hskProgressKey, {});
    var state = readJson(hskStateKey, { level: 0, lesson: 0 });
    var meta = readJson(hskMetaKey, {});
    return normalizeProgressSnapshot({
      completed: completed,
      completionStates: meta.completionStates || {},
      state: state,
      stateUpdatedAt: meta.stateUpdatedAt || 0,
      updatedAt: meta.updatedAt || 0
    });
  }

  function completedObject(snapshot) {
    var output = {};
    var ids = Object.keys(snapshot.completionStates || {});
    for (var i = 0; i < ids.length; i++) {
      if (snapshot.completionStates[ids[i]].done) output[ids[i]] = true;
    }
    return output;
  }

  function stableSnapshotString(snapshot) {
    snapshot = normalizeProgressSnapshot(snapshot);
    var ids = Object.keys(snapshot.completionStates).sort();
    var states = {};
    for (var i = 0; i < ids.length; i++) states[ids[i]] = snapshot.completionStates[ids[i]];
    return JSON.stringify({
      completionStates: states,
      state: snapshot.state,
      stateUpdatedAt: snapshot.stateUpdatedAt,
      updatedAt: snapshot.updatedAt
    });
  }

  function sameState(left, right) {
    return Number(left && left.level) === Number(right && right.level) &&
      Number(left && left.lesson) === Number(right && right.lesson);
  }

  function mergeProgressSnapshots(localValue, remoteValue) {
    var local = normalizeProgressSnapshot(localValue);
    var remote = normalizeProgressSnapshot(remoteValue);
    var merged = emptyProgressSnapshot();
    var ids = Object.keys(local.completionStates).concat(Object.keys(remote.completionStates));
    var seen = {};

    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      if (seen[id]) continue;
      seen[id] = true;
      var left = local.completionStates[id];
      var right = remote.completionStates[id];
      if (!left) merged.completionStates[id] = right;
      else if (!right) merged.completionStates[id] = left;
      else if (right.updatedAt > left.updatedAt) merged.completionStates[id] = right;
      else if (left.updatedAt > right.updatedAt) merged.completionStates[id] = left;
      else merged.completionStates[id] = { done: left.done || right.done, updatedAt: left.updatedAt };
    }

    if (remote.stateUpdatedAt > local.stateUpdatedAt) {
      merged.state = remote.state;
      merged.stateUpdatedAt = remote.stateUpdatedAt;
    } else {
      merged.state = local.state;
      merged.stateUpdatedAt = local.stateUpdatedAt;
    }
    merged.updatedAt = Math.max(local.updatedAt, remote.updatedAt, merged.stateUpdatedAt);
    var mergedIds = Object.keys(merged.completionStates);
    for (var j = 0; j < mergedIds.length; j++) {
      merged.updatedAt = Math.max(merged.updatedAt, merged.completionStates[mergedIds[j]].updatedAt);
    }
    return merged;
  }

  function parseProgressRow(row) {
    if (!row || row.word_key !== progressWordKey) return emptyProgressSnapshot();
    try {
      return normalizeProgressSnapshot(JSON.parse(row.note || "{}"));
    } catch (error) {
      return emptyProgressSnapshot();
    }
  }

  function progressRow(snapshot, userId) {
    snapshot = normalizeProgressSnapshot(snapshot);
    var iso = snapshot.updatedAt ? new Date(snapshot.updatedAt).toISOString() : null;
    return {
      user_id: userId,
      word_key: progressWordKey,
      hanzi: "HSK_PROGRESS",
      pinyin: "",
      near_vi: "",
      meaning_vi: "Tiến độ học HSK theo tài khoản",
      category: progressCategory,
      note: JSON.stringify(snapshot),
      example_zh: "",
      example_vi: "",
      is_known: false,
      is_saved: false,
      known_updated_at: iso,
      saved_updated_at: iso
    };
  }

  function accountCacheKey(profileId) {
    return accountCachePrefix + (profileId || anonymousProfile);
  }

  function loadAccountCache(profileId) {
    var value = readJson(accountCacheKey(profileId), null);
    return value ? normalizeProgressSnapshot(value) : null;
  }

  function saveAccountCache(profileId, snapshot) {
    writeJson(accountCacheKey(profileId), normalizeProgressSnapshot(snapshot));
  }

  function activeProfileId() {
    try {
      return localStorage.getItem(activeUserKey) || "";
    } catch (error) {
      return "";
    }
  }

  function setActiveProfileId(value) {
    try {
      if (value) localStorage.setItem(activeUserKey, value);
      else localStorage.removeItem(activeUserKey);
    } catch (error) {}
  }

  function refreshHskUi(state) {
    if (!document.getElementById("hskLevels") || !document.getElementById("hskLessonList")) return;
    applyingProgress = true;
    var levelButton = document.querySelector('#hskLevels [data-hsk-level="' + state.level + '"]');
    if (levelButton && !levelButton.disabled) levelButton.click();
    window.setTimeout(function () {
      writeJson(hskStateKey, state);
      var lessonButton = document.querySelector('#hskLessonList [data-hsk-lesson="' + state.lesson + '"]');
      if (lessonButton) lessonButton.click();
      writeJson(hskStateKey, state);
      applyingProgress = false;
      lastObservedProgress = captureLocalProgress();
    }, 0);
  }

  function applyProgressSnapshot(snapshot, refreshUi) {
    snapshot = normalizeProgressSnapshot(snapshot);
    applyingProgress = true;
    writeJson(hskProgressKey, completedObject(snapshot));
    writeJson(hskStateKey, snapshot.state);
    writeJson(hskMetaKey, {
      version: 1,
      completionStates: snapshot.completionStates,
      stateUpdatedAt: snapshot.stateUpdatedAt,
      updatedAt: snapshot.updatedAt
    });
    lastObservedProgress = snapshot;
    applyingProgress = false;
    if (refreshUi) refreshHskUi(snapshot.state);
    try {
      document.dispatchEvent(new CustomEvent("vduckie:hsk-progress-synced", {
        detail: {
          completed: completedObject(snapshot),
          state: snapshot.state,
          userId: session && session.user ? session.user.id : null
        }
      }));
    } catch (error) {}
  }

  function upsertProgress(snapshot) {
    if (!client || !session || !session.user || !navigator.onLine) return Promise.resolve();
    return client.from("user_words").upsert([progressRow(snapshot, session.user.id)], {
      onConflict: "user_id,word_key"
    }).then(function (result) {
      if (result.error) throw result.error;
    });
  }

  function scheduleProgressUpload(snapshot) {
    if (!session || !session.user) return;
    window.clearTimeout(progressUploadTimer);
    progressUploadTimer = window.setTimeout(function () {
      upsertProgress(snapshot).then(function () {
        setStatus("Đã đồng bộ từ vựng và tiến độ", "good");
      }).catch(function (error) {
        console.error("VDuckie HSK progress upload failed", error);
        setStatus(navigator.onLine ? "Lỗi đồng bộ tiến độ" : "Chờ có mạng", navigator.onLine ? "bad" : "waiting");
      });
    }, 500);
  }

  function trackLocalProgress() {
    if (applyingProgress) return;
    var current = captureLocalProgress();
    if (!lastObservedProgress) {
      lastObservedProgress = current;
      return;
    }

    var previous = normalizeProgressSnapshot(lastObservedProgress);
    var previousDone = completedObject(previous);
    var currentDone = completedObject(current);
    var ids = Object.keys(previousDone).concat(Object.keys(currentDone));
    var seen = {};
    var changed = false;
    var now = Date.now();

    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      if (seen[id]) continue;
      seen[id] = true;
      if (!!previousDone[id] !== !!currentDone[id]) {
        current.completionStates[id] = { done: !!currentDone[id], updatedAt: now };
        changed = true;
      }
    }

    if (!sameState(previous.state, current.state)) {
      current.stateUpdatedAt = now;
      changed = true;
    }
    if (!changed && stableSnapshotString(previous) === stableSnapshotString(current)) return;

    current.updatedAt = now;
    writeJson(hskMetaKey, {
      version: 1,
      completionStates: current.completionStates,
      stateUpdatedAt: current.stateUpdatedAt,
      updatedAt: current.updatedAt
    });
    lastObservedProgress = current;
    var profileId = session && session.user ? session.user.id : anonymousProfile;
    saveAccountCache(profileId, current);
    if (session && session.user) scheduleProgressUpload(current);
  }

  function activateProfile(userId) {
    var previousProfile = activeProfileId();
    var globalSnapshot = captureLocalProgress();
    if (previousProfile && previousProfile !== userId) {
      saveAccountCache(previousProfile, globalSnapshot);
    } else if (!previousProfile) {
      saveAccountCache(anonymousProfile, globalSnapshot);
    }

    var cached = loadAccountCache(userId);
    var selected;
    if (cached) selected = cached;
    else if (!previousProfile) selected = globalSnapshot;
    else selected = emptyProgressSnapshot();
    setActiveProfileId(userId);
    applyProgressSnapshot(selected, true);
    saveAccountCache(userId, selected);
    return selected;
  }

  function deactivateProfile() {
    var previousProfile = activeProfileId();
    if (previousProfile) saveAccountCache(previousProfile, captureLocalProgress());
    setActiveProfileId("");
    var anonymous = loadAccountCache(anonymousProfile) || emptyProgressSnapshot();
    applyProgressSnapshot(anonymous, true);
  }

  function synchronizeProgress(remoteRow) {
    if (!session || !session.user) return Promise.resolve();
    var userId = session.user.id;
    var local = mergeProgressSnapshots(loadAccountCache(userId) || emptyProgressSnapshot(), captureLocalProgress());
    var remote = parseProgressRow(remoteRow);
    var merged = mergeProgressSnapshots(local, remote);
    applyProgressSnapshot(merged, true);
    saveAccountCache(userId, merged);
    return upsertProgress(merged);
  }

  function synchronize() {
    if (!client || !session || !session.user) return Promise.resolve();
    if (syncing) {
      syncAgain = true;
      return Promise.resolve();
    }
    syncing = true;
    setStatus("Đang đồng bộ từ vựng và tiến độ…", "waiting");

    return client
      .from("user_words")
      .select("word_key,hanzi,pinyin,near_vi,meaning_vi,category,note,example_zh,example_vi,is_known,is_saved,known_updated_at,saved_updated_at")
      .then(function (remote) {
        if (remote.error) throw remote.error;
        var rows = remote.data || [];
        var wordRows = [];
        var remoteProgress = null;
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].word_key === progressWordKey) remoteProgress = rows[i];
          else if (/^__vduckie_/.test(String(rows[i].word_key || "")) || /^__system_/.test(String(rows[i].category || ""))) {}
          else wordRows.push(rows[i]);
        }

        var bridge = window.VDuckieLocalLearning;
        if (bridge && typeof bridge.mergeRemote === "function") {
          bridge.mergeRemote(wordRows);
        }
        var wordSync = bridge && typeof bridge.prepareForCloud === "function"
          ? upsertRows(bridge.prepareForCloud()).then(function () { saveQueue({}); })
          : flushQueue();

        return wordSync.then(function () {
          return synchronizeProgress(remoteProgress);
        });
      })
      .then(function () {
        setStatus("Đã đồng bộ từ vựng và tiến độ", "good");
      })
      .catch(function (error) {
        console.error("VDuckie Supabase sync failed", error);
        setStatus(navigator.onLine ? "Lỗi đồng bộ" : "Chờ có mạng", navigator.onLine ? "bad" : "waiting");
      })
      .then(function () {
        syncing = false;
        if (syncAgain) {
          syncAgain = false;
          synchronize();
        }
      });
  }

  function signIn() {
    if (!client) return Promise.resolve();
    try {
      try {
        sessionStorage.setItem("vduckie-auth-return", window.location.href);
      } catch (error) {}
      return client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl() }
      }).then(function (result) {
        if (result.error) throw result.error;
      }).catch(function (error) {
        console.error("Google sign-in failed", error);
        setStatus("Không mở được Google", "bad");
      });
    } catch (error) {
      console.error("Google sign-in failed", error);
      setStatus("Không mở được Google", "bad");
      return Promise.resolve();
    }
  }

  function signOut() {
    if (!client) return Promise.resolve();
    return flushQueue()
      .then(function () { return upsertProgress(captureLocalProgress()); })
      .then(function () { return client.auth.signOut(); })
      .then(function (result) {
        if (result.error) throw result.error;
      })
      .catch(function (error) {
        console.error("Sign-out failed", error);
        setStatus("Không đăng xuất được", "bad");
      });
  }

  function restoreReturnUrl() {
    var target = "";
    try {
      target = sessionStorage.getItem("vduckie-auth-return") || "";
      sessionStorage.removeItem("vduckie-auth-return");
    } catch (error) {}
    if (!target) return;
    try {
      var url = new URL(target);
      if (url.origin === window.location.origin && url.pathname === window.location.pathname) {
        history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
    } catch (error) {}
  }

  function handleSession(nextSession) {
    var previousSession = session;
    var wasSignedOut = !previousSession;
    var previousUserId = previousSession && previousSession.user ? previousSession.user.id : "";
    var nextUserId = nextSession && nextSession.user ? nextSession.user.id : "";
    session = nextSession || null;
    renderAuth();

    if (session && nextUserId) {
      if (wasSignedOut) restoreReturnUrl();
      if (previousUserId !== nextUserId || activeProfileId() !== nextUserId) activateProfile(nextUserId);
      return synchronize();
    }

    if (previousUserId || activeProfileId()) deactivateProfile();
    return Promise.resolve();
  }

  function initProgressWatcher() {
    if (progressPoll) return;
    lastObservedProgress = captureLocalProgress();
    progressPoll = window.setInterval(trackLocalProgress, 700);
    window.addEventListener("beforeunload", trackLocalProgress);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") trackLocalProgress();
    });
  }

  function init() {
    renderAuth();
    var login = byId("cloudLogin");
    var logout = byId("cloudLogout");
    if (login) login.addEventListener("click", signIn);
    if (logout) logout.addEventListener("click", signOut);
    initProgressWatcher();

    document.addEventListener("vduckie:learning-change", function (event) {
      queueRow(event.detail);
      if (session) synchronize();
      else renderAuth();
    });
    window.addEventListener("online", function () {
      if (session) synchronize();
      else renderAuth();
    });
    window.addEventListener("offline", renderAuth);

    if (!isConfigured()) return;
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      setStatus("Không tải được Supabase SDK", "bad");
      return;
    }

    client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "implicit"
      }
    });
    client.auth.getSession().then(function (current) {
      if (current.error) {
        console.error("Unable to restore Supabase session", current.error);
        setStatus("Lỗi phiên đăng nhập", "bad");
      } else {
        handleSession(current.data.session);
      }
    });
    client.auth.onAuthStateChange(function (_event, nextSession) {
      window.setTimeout(function () {
        handleSession(nextSession);
      }, 0);
    });
  }

  window.VDuckieProgressSyncUtils = {
    progressWordKey: progressWordKey,
    normalize: normalizeProgressSnapshot,
    merge: mergeProgressSnapshots,
    completedObject: completedObject,
    progressRow: progressRow,
    stableString: stableSnapshotString
  };

  window.VDuckieCloud = {
    sync: synchronize,
    signIn: signIn,
    signOut: signOut,
    syncProgress: function () {
      trackLocalProgress();
      return session ? upsertProgress(captureLocalProgress()) : Promise.resolve();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
