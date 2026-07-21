(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_DEVELOPER_PREVIEW_V93__) return;
  root.__VDUCKIE_DEVELOPER_PREVIEW_V93__ = true;

  var DEVELOPER_EMAIL = "ducnguyenn138@gmail.com";
  var core = root.VDuckieEXPCore;
  var evolution = root.VDuckieEvolution;
  var panel = null;
  var bridge = null;
  var unsubscribeSession = null;
  var authorizationId = 0;
  var panelBound = false;

  function normalizedEmail(value) { return String(value || "").trim().toLowerCase(); }
  function currentSession() { return core && typeof core.session === "function" ? core.session() : null; }
  function isCandidate(session) {
    return !!(session && session.user && normalizedEmail(session.user.email) === DEVELOPER_EMAIL);
  }
  function levelOptions(selected) {
    var html = "";
    for (var level = 1; level <= 10; level += 1) {
      html += '<option value="' + level + '"' + (Number(selected) === level ? " selected" : "") + '>Level ' + level + '</option>';
    }
    return html;
  }
  function panelMarkup(level) {
    return '<header class="v93-dev-head"><div><span>DEVELOPER</span><strong>Duck Evolution Preview</strong></div><button type="button" data-v93-collapse aria-label="Thu gọn Developer Preview">−</button></header>' +
      '<div class="v93-dev-body">' +
      '<label class="v93-dev-toggle"><span><strong>Developer Mode</strong><small>Chỉ override giao diện</small></span><input type="checkbox" data-v93-preview-toggle checked></label>' +
      '<label class="v93-dev-field"><span>Level preview</span><select data-v93-level>' + levelOptions(level) + '</select></label>' +
      '<p class="v93-dev-note">EXP, Level và dữ liệu Supabase thật không thay đổi.</p>' +
      '<div class="v93-dev-open"><button type="button" data-v93-open="journey">Hành trình</button><button type="button" data-v93-open="wardrobe">Tủ đồ</button></div>' +
      '<div class="v93-dev-tests" aria-label="Kiểm thử animation">' +
      '<button type="button" data-v93-test="level-up">Test Level Up</button>' +
      '<button type="button" data-v93-test="egg-hatching">Test Egg Hatching</button>' +
      '<button type="button" data-v93-test="success">Test Success</button>' +
      '<button type="button" data-v93-test="sad">Test Sad</button>' +
      '<button type="button" data-v93-test="hover">Test Hover</button>' +
      '<button type="button" data-v93-test="glow">Test Glow</button>' +
      '</div>' +
      '<button type="button" class="v93-dev-real" data-v93-real>Dùng dữ liệu thật</button>' +
      '</div>';
  }
  function removePanel() {
    authorizationId += 1;
    if (bridge) {
      try { bridge.disable(); } catch (error) {}
    }
    bridge = null;
    if (panel) panel.remove();
    panel = null;
    panelBound = false;
  }
  function ensurePanel() {
    if (!bridge) return;
    var state = bridge.getState();
    var initialLevel = state.active ? state.level : state.real && state.real.level || 1;
    if (!panel || !panel.isConnected) {
      panel = document.createElement("aside");
      panel.id = "v93DeveloperPreview";
      panel.className = "v93-developer-panel";
      panel.setAttribute("aria-label", "Duck Evolution Developer Preview");
      document.body.appendChild(panel);
      panelBound = false;
    }
    panel.innerHTML = panelMarkup(initialLevel);
    bindPanel();
  }
  function setToggle(checked) {
    if (!panel) return;
    var toggle = panel.querySelector("[data-v93-preview-toggle]");
    if (toggle) toggle.checked = !!checked;
    panel.classList.toggle("is-preview-off", !checked);
  }
  function selectedLevel() {
    var select = panel && panel.querySelector("[data-v93-level]");
    return select ? Number(select.value || 1) : 1;
  }
  function ensurePreviewOn() {
    if (!bridge || !panel) return false;
    setToggle(true);
    bridge.enable(selectedLevel());
    return true;
  }
  function bindPanel() {
    if (!panel || panelBound) return;
    panelBound = true;
    panel.addEventListener("change", function (event) {
      if (!bridge) return;
      if (event.target.matches("[data-v93-preview-toggle]")) {
        if (event.target.checked) bridge.enable(selectedLevel());
        else bridge.disable();
        panel.classList.toggle("is-preview-off", !event.target.checked);
        return;
      }
      if (event.target.matches("[data-v93-level]")) {
        setToggle(true);
        bridge.setLevel(Number(event.target.value || 1));
      }
    });
    panel.addEventListener("click", function (event) {
      if (!bridge) return;
      var collapse = event.target.closest("[data-v93-collapse]");
      if (collapse) {
        panel.classList.toggle("is-collapsed");
        collapse.textContent = panel.classList.contains("is-collapsed") ? "+" : "−";
        collapse.setAttribute("aria-label", panel.classList.contains("is-collapsed") ? "Mở Developer Preview" : "Thu gọn Developer Preview");
        return;
      }
      var open = event.target.closest("[data-v93-open]");
      if (open) {
        ensurePreviewOn();
        bridge.open(open.getAttribute("data-v93-open"));
        return;
      }
      var test = event.target.closest("[data-v93-test]");
      if (test) {
        ensurePreviewOn();
        bridge.test(test.getAttribute("data-v93-test"));
        return;
      }
      if (event.target.closest("[data-v93-real]")) {
        bridge.disable();
        setToggle(false);
      }
    });
  }
  function authorize(session) {
    var request = ++authorizationId;
    if (!isCandidate(session) || !evolution || typeof evolution.requestDeveloperBridge !== "function") {
      removePanel();
      return;
    }
    evolution.requestDeveloperBridge().then(function (nextBridge) {
      if (request !== authorizationId) {
        try { nextBridge.disable(); } catch (error) {}
        return;
      }
      bridge = nextBridge;
      ensurePanel();
      var state = bridge.getState();
      var startLevel = state.real && state.real.level || 1;
      var select = panel.querySelector("[data-v93-level]");
      if (select) select.value = String(Math.max(1, Math.min(10, startLevel)));
      bridge.enable(startLevel);
      setToggle(true);
    }).catch(function () {
      if (request === authorizationId) removePanel();
    });
  }
  function init() {
    if (!core || !evolution || typeof core.onSession !== "function") return;
    unsubscribeSession = core.onSession(authorize);
    root.addEventListener("online", function () {
      var session = currentSession();
      if (isCandidate(session) && !bridge) authorize(session);
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        var session = currentSession();
        if (isCandidate(session) && !bridge) authorize(session);
      }
    });
    document.addEventListener("vduckie:developer-preview-revoked", function () {
      bridge = null;
      if (panel) panel.remove();
      panel = null;
      panelBound = false;
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})(window, document);
