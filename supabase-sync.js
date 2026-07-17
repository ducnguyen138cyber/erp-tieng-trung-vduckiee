(function () {
  "use strict";

  var config = window.VDUCKIE_SUPABASE_CONFIG || {};
  var client = null;
  var session = null;
  var syncing = false;
  var syncAgain = false;
  var queueKey = "vduckie-cloud-queue-v1";

  function byId(id) {
    return document.getElementById(id);
  }

  function isConfigured() {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url || "") &&
      /^(sb_publishable_|eyJ)/.test(config.publishableKey || "") &&
      String(config.url).indexOf("YOUR_PROJECT") === -1;
  }

  function readQueue() {
    try {
      var value = JSON.parse(localStorage.getItem(queueKey) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (error) {
      return {};
    }
  }

  function saveQueue(queue) {
    try {
      localStorage.setItem(queueKey, JSON.stringify(queue));
    } catch (error) {}
  }

  function queueRow(row) {
    if (!row || !row.word_key) return;
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

  async function upsertRows(rows) {
    if (!session || !session.user || !rows.length) return;
    var payload = [];
    for (var i = 0; i < rows.length; i++) {
      var mapped = mapForDatabase(rows[i], session.user.id);
      if (mapped.word_key) payload.push(mapped);
    }
    if (!payload.length) return;
    var result = await client.from("user_words").upsert(payload, {
      onConflict: "user_id,word_key"
    });
    if (result.error) throw result.error;
  }

  async function flushQueue() {
    if (!session || !session.user || !navigator.onLine) return;
    var queue = readQueue();
    var keys = Object.keys(queue);
    if (!keys.length) return;
    var rows = [];
    for (var i = 0; i < keys.length; i++) rows.push(queue[keys[i]]);
    await upsertRows(rows);
    saveQueue({});
  }

  async function synchronize() {
    if (!client || !session || !session.user) return;
    if (syncing) {
      syncAgain = true;
      return;
    }
    syncing = true;
    setStatus("Đang đồng bộ…", "waiting");
    try {
      var remote = await client
        .from("user_words")
        .select("word_key,hanzi,pinyin,near_vi,meaning_vi,category,note,example_zh,example_vi,is_known,is_saved,known_updated_at,saved_updated_at");
      if (remote.error) throw remote.error;

      var bridge = window.VDuckieLocalLearning;
      if (bridge && typeof bridge.mergeRemote === "function") {
        bridge.mergeRemote(remote.data || []);
      }
      if (bridge && typeof bridge.prepareForCloud === "function") {
        await upsertRows(bridge.prepareForCloud());
        saveQueue({});
      } else {
        await flushQueue();
      }
      setStatus("Đã đồng bộ", "good");
    } catch (error) {
      console.error("VDuckie Supabase sync failed", error);
      setStatus(navigator.onLine ? "Lỗi đồng bộ" : "Chờ có mạng", navigator.onLine ? "bad" : "waiting");
    } finally {
      syncing = false;
      if (syncAgain) {
        syncAgain = false;
        synchronize();
      }
    }
  }

  async function signIn() {
    if (!client) return;
    try {
      try {
        sessionStorage.setItem("vduckie-auth-return", window.location.href);
      } catch (error) {}
      var result = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl() }
      });
      if (result.error) throw result.error;
    } catch (error) {
      console.error("Google sign-in failed", error);
      setStatus("Không mở được Google", "bad");
    }
  }

  async function signOut() {
    if (!client) return;
    try {
      await flushQueue();
      var result = await client.auth.signOut();
      if (result.error) throw result.error;
    } catch (error) {
      console.error("Sign-out failed", error);
      setStatus("Không đăng xuất được", "bad");
    }
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

  async function handleSession(nextSession) {
    var wasSignedOut = !session;
    session = nextSession || null;
    renderAuth();
    if (session) {
      if (wasSignedOut) restoreReturnUrl();
      await synchronize();
    }
  }

  async function init() {
    renderAuth();
    byId("cloudLogin").addEventListener("click", signIn);
    byId("cloudLogout").addEventListener("click", signOut);
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
    var current = await client.auth.getSession();
    if (current.error) {
      console.error("Unable to restore Supabase session", current.error);
      setStatus("Lỗi phiên đăng nhập", "bad");
    } else {
      await handleSession(current.data.session);
    }
    client.auth.onAuthStateChange(function (_event, nextSession) {
      window.setTimeout(function () {
        handleSession(nextSession);
      }, 0);
    });
  }

  window.VDuckieCloud = {
    sync: synchronize,
    signIn: signIn,
    signOut: signOut
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
