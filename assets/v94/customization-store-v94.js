(function (root, document) {
  "use strict";
  if (root.VDuckieCustomizationStore) return;

  var avatar = root.VDuckieAvatar;
  var core = root.VDuckieEXPCore;
  var STORAGE_KEY = "vduckie-duck-customization-v1";
  var TABLE = "user_duck_customization";
  var listeners = [];
  var state = avatar ? avatar.defaults() : {
    skin: "default", outfit: "stage-default", glasses: "none",
    accessory: "none", background: "default", effect: "none"
  };
  var updatedAt = "";
  var requestId = 0;
  var unsubscribeSession = null;

  function readLocal() {
    try {
      var parsed = JSON.parse(root.localStorage.getItem(STORAGE_KEY) || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      return {
        selection: avatar ? avatar.normalizeSelection(parsed.selection || parsed) : parsed.selection || parsed,
        updatedAt: String(parsed.updatedAt || "")
      };
    } catch (error) {
      return null;
    }
  }

  function writeLocal(selection, timestamp) {
    try {
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        selection: selection,
        updatedAt: timestamp
      }));
    } catch (error) {}
  }

  function session() {
    return core && typeof core.session === "function" ? core.session() : null;
  }

  function client() {
    return core && typeof core.client === "function" ? core.client() : null;
  }

  function notify(source, syncStatus) {
    var snapshot = Object.freeze({
      selection: Object.freeze(Object.assign({}, state)),
      updatedAt: updatedAt,
      source: source || "local",
      syncStatus: syncStatus || "ready"
    });
    listeners.slice().forEach(function (listener) {
      try { listener(snapshot); } catch (error) {}
    });
    document.dispatchEvent(new CustomEvent("vduckie:customization-updated", { detail: snapshot }));
    return snapshot;
  }

  function apply(selection, timestamp, source, syncStatus) {
    state = avatar ? avatar.normalizeSelection(selection) : Object.assign({}, state, selection || {});
    updatedAt = String(timestamp || new Date().toISOString());
    writeLocal(state, updatedAt);
    return notify(source, syncStatus);
  }

  function rowToSelection(row) {
    return {
      skin: row.selected_skin,
      outfit: row.selected_outfit,
      glasses: row.selected_glasses,
      accessory: row.selected_accessory,
      background: row.selected_background,
      effect: row.selected_effect
    };
  }

  function payload(userId, selection) {
    return {
      user_id: userId,
      selected_skin: selection.skin,
      selected_outfit: selection.outfit,
      selected_glasses: selection.glasses,
      selected_accessory: selection.accessory,
      selected_background: selection.background,
      selected_effect: selection.effect,
      updated_at: updatedAt || new Date().toISOString()
    };
  }

  function loadRemote() {
    var activeSession = session();
    var activeClient = client();
    var request = ++requestId;
    if (!activeSession || !activeSession.user || !activeClient) return Promise.resolve(notify("local", "offline"));
    return activeClient.from(TABLE)
      .select("selected_skin,selected_outfit,selected_glasses,selected_accessory,selected_background,selected_effect,updated_at")
      .eq("user_id", activeSession.user.id)
      .maybeSingle()
      .then(function (result) {
        if (request !== requestId) return null;
        if (result.error) throw result.error;
        if (!result.data) return notify("local", "ready");
        var remoteTime = Date.parse(result.data.updated_at || "") || 0;
        var localTime = Date.parse(updatedAt || "") || 0;
        if (remoteTime >= localTime) return apply(rowToSelection(result.data), result.data.updated_at, "supabase", "synced");
        return save(state).then(function () { return notify("local", "synced"); });
      })
      .catch(function () {
        if (request !== requestId) return null;
        return notify("local", "fallback");
      });
  }

  function save(selection) {
    var normalized = avatar ? avatar.normalizeSelection(selection) : Object.assign({}, state, selection || {});
    var timestamp = new Date().toISOString();
    apply(normalized, timestamp, "local", "saving");
    var activeSession = session();
    var activeClient = client();
    if (!activeSession || !activeSession.user || !activeClient) return Promise.resolve(notify("local", "saved"));
    return activeClient.from(TABLE)
      .upsert(payload(activeSession.user.id, normalized), { onConflict: "user_id" })
      .then(function (result) {
        if (result.error) throw result.error;
        return notify("supabase", "synced");
      })
      .catch(function () {
        return notify("local", "fallback");
      });
  }

  function reset() {
    return save(avatar ? avatar.defaults() : {
      skin: "default", outfit: "stage-default", glasses: "none",
      accessory: "none", background: "default", effect: "none"
    });
  }

  function subscribe(listener) {
    if (typeof listener !== "function") return function () {};
    listeners.push(listener);
    listener(Object.freeze({
      selection: Object.freeze(Object.assign({}, state)),
      updatedAt: updatedAt,
      source: "memory",
      syncStatus: "ready"
    }));
    return function () {
      var index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    };
  }

  function init() {
    var local = readLocal();
    if (local) {
      state = local.selection;
      updatedAt = local.updatedAt;
    } else {
      writeLocal(state, "");
    }
    notify("local", "ready");
    if (core && typeof core.onSession === "function") {
      unsubscribeSession = core.onSession(function (nextSession) {
        requestId += 1;
        if (nextSession && nextSession.user) root.setTimeout(loadRemote, 0);
        else notify("local", "ready");
      });
    }
    loadRemote();
  }

  root.VDuckieCustomizationStore = Object.freeze({
    get: function () { return Object.freeze(Object.assign({}, state)); },
    load: loadRemote,
    save: save,
    reset: reset,
    subscribe: subscribe,
    destroy: function () {
      requestId += 1;
      if (unsubscribeSession) unsubscribeSession();
      unsubscribeSession = null;
      listeners.length = 0;
    },
    storageKey: STORAGE_KEY,
    table: TABLE
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})(window, document);