(function (root, document) {
  "use strict";
  var ns = root.VDuckieDeveloper;
  if (!ns || !ns.actions || ns.ui) return;

  var runtime = ns.runtime;
  var actions = ns.actions;
  var esc = ns.util.esc;
  var visibleTabs = ["overview", "evolution", "animation", "learning", "speaking", "progress", "inventory", "audio", "responsive", "scenario", "debug"];
  var tabLabels = { scenario: "Scenarios" };
  var tabAliases = { achievement: "progress", performance: "debug", scenario: "scenario" };
  var debugSections = [
    ["runtime-state", "Runtime State"], ["renderer-lifecycle", "Renderer Lifecycle"],
    ["asset-runtime", "Asset Runtime"], ["asset-manifest", "Asset Manifest"],
    ["character-preview", "Character Preview Level 1–10"], ["event-queue", "Event Queue"],
    ["animation-queue", "Animation Queue"], ["timers", "Timer information"],
    ["listeners", "Listener information"], ["raw-json", "Raw JSON"]
  ];

  var overlay = null;
  var launcher = null;
  var dialog = null;
  var content = null;
  var tabsHost = null;
  var historyHost = null;
  var searchInput = null;
  var statusHost = null;
  var toastTimer = 0;
  var toastNode = null;
  var unsubscribe = null;
  var previousFocus = null;
  var bodyLock = null;
  var backgroundRecords = [];
  var pendingFocus = null;
  var ui = { open: false, minimized: false, activeTab: "overview", query: "", historyOpen: false };

  function payload(node) {
    var result = {};
    ["value", "code", "group"].forEach(function (key) {
      var value = node.getAttribute("data-vdev-" + key);
      if (value !== null) result[key] = value;
    });
    if (node.value !== undefined && result.value === undefined) result.value = node.value;
    return result;
  }

  function cssEscape(value) {
    if (root.CSS && typeof root.CSS.escape === "function") return root.CSS.escape(String(value));
    return String(value).replace(/(["'\\.#:[\]()=])/g, "\\$1");
  }

  function tabFor(sourceTab) {
    return tabAliases[sourceTab] || sourceTab || "overview";
  }

  function tabMeta(id) {
    var tab = ns.tabs[id] || { id: id, icon: "•", label: id };
    return { id: id, icon: tab.icon || "•", label: tabLabels[id] || tab.label || id };
  }

  function tabButton(id) {
    var tab = tabMeta(id);
    var active = ui.activeTab === id;
    return '<button type="button" role="tab" id="vdev-tab-' + id + '" aria-controls="vdev-active-panel" aria-selected="' + active + '" tabindex="' + (active ? "0" : "-1") + '" data-vdev-tab="' + id + '">' + tab.icon + " " + esc(tab.label) + "</button>";
  }

  function renderTabs() {
    tabsHost.innerHTML = visibleTabs.filter(function (id) { return !!ns.tabs[id]; }).map(tabButton).join("");
  }

  function renderTabBody(state) {
    var tab = ns.tabs[ui.activeTab] || ns.tabs.overview || ns.tabs.evolution;
    var html = tab && typeof tab.render === "function" ? tab.render(state) : '<p class="vdev-note">Tab chưa sẵn sàng.</p>';
    if (ui.activeTab === "progress" && ns.tabs.achievement && typeof ns.tabs.achievement.render === "function") {
      html += '<details class="vdev-embedded-details"><summary>🏆 Achievement Preview</summary><div class="vdev-embedded-body">' + ns.tabs.achievement.render(state) + "</div></details>";
    }
    return html;
  }

  function favoriteSet() {
    var set = Object.create(null);
    actions.favorites().forEach(function (item) { set[item.id] = true; });
    return set;
  }

  function searchEntries(query) {
    var normalized = String(query || "").trim().toLowerCase();
    if (!normalized) return [];
    var entries = [];
    var seen = Object.create(null);
    function add(entry) {
      var key = entry.type + ":" + entry.id;
      if (seen[key]) return;
      seen[key] = true;
      entries.push(entry);
    }
    visibleTabs.forEach(function (id) {
      if (!ns.tabs[id]) return;
      var meta = tabMeta(id);
      if ((meta.label + " " + id).toLowerCase().indexOf(normalized) >= 0) add({ type: "tab", id: id, tab: id, label: meta.label, hint: "Tab" });
    });
    actions.search(normalized).forEach(function (def) {
      add({ type: "action", id: def.id, tab: tabFor(def.tab), label: def.label, hint: "Action · " + tabMeta(tabFor(def.tab)).label });
    });
    (ns.scenarioOrder || []).forEach(function (id) {
      var def = ns.scenarios && ns.scenarios[id];
      if (!def) return;
      var haystack = [id, def.label].concat(def.keywords || []).join(" ").toLowerCase();
      if (haystack.indexOf(normalized) >= 0) add({ type: "scenario", id: id, tab: "scenario", label: def.label, hint: "Scenario" });
    });
    debugSections.forEach(function (entry) {
      if ((entry[0] + " " + entry[1]).toLowerCase().indexOf(normalized) >= 0) add({ type: "debug", id: entry[0], tab: "debug", label: entry[1], hint: "Debug section" });
    });
    return entries.slice(0, 40);
  }

  function renderSearch() {
    var list = searchEntries(ui.query);
    var favorites = favoriteSet();
    if (!list.length) return '<p class="vdev-note">Không tìm thấy tab, action, scenario hoặc debug section phù hợp.</p>';
    return '<p class="vdev-search-summary">' + list.length + ' kết quả. Chọn “Mở” để chuyển đến đúng tab và focus control.</p><div class="vdev-search-results">' + list.map(function (entry) {
      var favorite = entry.type === "action" ? '<button type="button" aria-label="Ghim action" data-vdev-favorite="' + entry.id + '">' + (favorites[entry.id] ? "★" : "☆") + "</button>" : "";
      return '<article class="vdev-search-card"><div><strong>' + esc(entry.label) + '</strong><small>' + esc(entry.hint) + '</small></div>' + favorite + '<button type="button" data-vdev-search-open data-vdev-type="' + entry.type + '" data-vdev-id="' + esc(entry.id) + '" data-vdev-target-tab="' + entry.tab + '">Mở</button></article>';
    }).join("") + "</div>";
  }

  function renderHistory() {
    if (!historyHost) return;
    var history = actions.history();
    historyHost.hidden = !ui.historyOpen;
    historyHost.innerHTML = '<strong>20 action gần nhất</strong>' + (history.length ? history.map(function (item, index) {
      return '<article><div><strong>' + esc(item.label) + '</strong><small>' + new Date(item.at).toLocaleTimeString() + '</small></div><button type="button" data-vdev-history-index="' + index + '">Replay</button></article>';
    }).join("") : "<p>Chưa có action.</p>");
  }

  function renderContent() {
    if (!content) return;
    var state = runtime.snapshot();
    var tab = tabMeta(ui.activeTab);
    content.innerHTML = '<section class="vdev-panel" id="vdev-active-panel" role="tabpanel" aria-labelledby="vdev-tab-' + ui.activeTab + '"><div class="vdev-tab-head"><h2 tabindex="-1" data-vdev-panel-heading>' + tab.icon + " " + esc(tab.label) + '</h2><span class="vdev-safety">Preview Session only</span></div>' + (ui.query ? renderSearch() : renderTabBody(state)) + "</section>";
    if (statusHost) statusHost.textContent = state.status || "Preview Session — không ghi dữ liệu thật";
    var renderer = root.VDuckieMascot;
    if (renderer && renderer.hydrate) renderer.hydrate(content);
    renderHistory();
    focusPendingTarget();
  }

  function focusPendingTarget() {
    if (!pendingFocus || !content) return;
    var targetInfo = pendingFocus;
    pendingFocus = null;
    root.requestAnimationFrame(function () {
      var target = null;
      if (targetInfo.type === "action") target = content.querySelector('[data-vdev-action="' + cssEscape(targetInfo.id) + '"]');
      else if (targetInfo.type === "scenario") target = content.querySelector('[data-vdev-code="' + cssEscape(targetInfo.id) + '"]');
      else if (targetInfo.type === "debug") {
        var details = content.querySelector('[data-vdev-debug-key="' + cssEscape(targetInfo.id) + '"]');
        if (details) { details.open = true; target = details.querySelector("summary"); }
      } else target = content.querySelector("[data-vdev-panel-heading]");
      if (!target) target = content.querySelector("[data-vdev-panel-heading]");
      if (target) {
        try { target.focus({ preventScroll: true }); } catch (error) { target.focus(); }
        if (target.scrollIntoView) target.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  }

  function showToast(detail) {
    if (!overlay) return;
    if (toastNode && toastNode.parentNode) toastNode.parentNode.removeChild(toastNode);
    var node = document.createElement("div");
    toastNode = node;
    node.className = "vdev-toast " + (detail.tone || "");
    node.setAttribute("role", "status");
    node.textContent = detail.message || "Developer action";
    overlay.appendChild(node);
    if (toastTimer) root.clearTimeout(toastTimer);
    toastTimer = root.setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
      if (toastNode === node) toastNode = null;
    }, 2200);
  }

  function showModal(detail) {
    if (!overlay) return;
    var node = document.createElement("div");
    node.className = "vdev-modal";
    node.innerHTML = '<section role="dialog" aria-modal="true" aria-label="Developer preview message"><h3>' + esc(detail.title || "Developer Preview") + "</h3><p>" + esc(detail.message || "") + '</p><button type="button" data-vdev-modal-close>Đóng</button></section>';
    overlay.appendChild(node);
    var closeButton = node.querySelector("[data-vdev-modal-close]");
    node.addEventListener("click", function (event) {
      if (event.target.closest("[data-vdev-modal-close]") || event.target === node) node.remove();
    });
    if (closeButton) closeButton.focus();
  }

  function lockBackground() {
    backgroundRecords = [];
    Array.prototype.forEach.call(document.body.children, function (node) {
      if (node === overlay || node === launcher) return;
      var record = { node: node, inert: "inert" in node ? !!node.inert : null, ariaHidden: node.getAttribute("aria-hidden") };
      backgroundRecords.push(record);
      if ("inert" in node) node.inert = true;
      else node.setAttribute("aria-hidden", "true");
    });
  }

  function unlockBackground() {
    backgroundRecords.forEach(function (record) {
      if (!record.node) return;
      if (record.inert !== null) record.node.inert = record.inert;
      else if (record.ariaHidden === null) record.node.removeAttribute("aria-hidden");
      else record.node.setAttribute("aria-hidden", record.ariaHidden);
    });
    backgroundRecords = [];
  }

  function lockBody() {
    if (bodyLock) return;
    var body = document.body;
    var gap = Math.max(0, root.innerWidth - document.documentElement.clientWidth);
    bodyLock = {
      x: root.scrollX || 0, y: root.scrollY || 0,
      position: body.style.position, top: body.style.top, left: body.style.left,
      right: body.style.right, width: body.style.width, overflow: body.style.overflow,
      paddingRight: body.style.paddingRight
    };
    body.style.position = "fixed";
    body.style.top = (-bodyLock.y) + "px";
    body.style.left = (-bodyLock.x) + "px";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    if (gap) body.style.paddingRight = gap + "px";
    body.classList.add("vdev-center-open");
  }

  function unlockBody() {
    if (!bodyLock) return;
    var body = document.body;
    var saved = bodyLock;
    bodyLock = null;
    body.style.position = saved.position;
    body.style.top = saved.top;
    body.style.left = saved.left;
    body.style.right = saved.right;
    body.style.width = saved.width;
    body.style.overflow = saved.overflow;
    body.style.paddingRight = saved.paddingRight;
    body.classList.remove("vdev-center-open");
    root.scrollTo(saved.x, saved.y);
  }

  function focusableNodes() {
    if (!dialog) return [];
    return Array.prototype.slice.call(dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],summary,[tabindex]:not([tabindex="-1"])')).filter(function (node) {
      return !node.hidden && node.getAttribute("aria-hidden") !== "true" && node.offsetParent !== null;
    });
  }

  function trapFocus(event) {
    if (event.key !== "Tab" || !ui.open) return;
    var nodes = focusableNodes();
    if (!nodes.length) { event.preventDefault(); dialog.focus(); return; }
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function activateTab(id, focusTab) {
    if (visibleTabs.indexOf(id) < 0 || !ns.tabs[id]) return;
    ui.activeTab = id;
    ui.query = "";
    if (searchInput) searchInput.value = "";
    renderTabs();
    renderContent();
    if (focusTab) {
      var button = tabsHost.querySelector('[data-vdev-tab="' + cssEscape(id) + '"]');
      if (button) button.focus();
    }
  }

  function openSearchTarget(node) {
    var type = node.getAttribute("data-vdev-type") || "tab";
    var id = node.getAttribute("data-vdev-id") || "";
    var tab = node.getAttribute("data-vdev-target-tab") || "overview";
    pendingFocus = { type: type, id: id };
    activateTab(tab, false);
  }

  function copyDebug(node) {
    var details = node.closest("details");
    var pre = details && details.querySelector("pre");
    if (!pre) return;
    var text = pre.textContent || "";
    var done = function () { showToast({ message: "Đã copy debug content.", tone: "good" }); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(function () {});
    else {
      var area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); done(); } catch (error) {}
      area.remove();
    }
  }

  function quick(name) {
    if (name === "reset-preview") runtime.resetPreview();
    else if (name === "replay") actions.replay();
    else if (name === "reload-assets") runtime.reloadAssets();
    else if (name === "reload-manifest") runtime.reloadManifest();
    else if (name === "clear-runtime") { runtime.clearRuntimeCache(); actions.clearHistory(); actions.audio.close(); }
    else if (name === "reset-ui") {
      ui.activeTab = "overview";
      ui.query = "";
      ui.historyOpen = false;
      if (searchInput) searchInput.value = "";
      renderTabs();
      renderContent();
    }
  }

  function minimize() {
    closeInternal(true);
  }

  function closeInternal(minimized) {
    if (!overlay || !ui.open) return;
    ui.open = false;
    ui.minimized = !!minimized;
    overlay.hidden = true;
    launcher.hidden = false;
    launcher.classList.toggle("is-minimized", ui.minimized);
    launcher.textContent = ui.minimized ? "DEV" : "🛠 Developer";
    launcher.setAttribute("aria-label", ui.minimized ? "Khôi phục Developer Center" : "Mở Developer Center");
    runtime.stopFps();
    unlockBackground();
    unlockBody();
    var focusTarget = previousFocus && previousFocus.isConnected ? previousFocus : launcher;
    previousFocus = null;
    try { focusTarget.focus({ preventScroll: true }); } catch (error) { focusTarget.focus(); }
  }

  function open() {
    ensure();
    if (ui.open) return;
    previousFocus = document.activeElement;
    ui.open = true;
    ui.minimized = false;
    overlay.hidden = false;
    launcher.hidden = true;
    lockBody();
    lockBackground();
    if (searchInput) searchInput.value = ui.query;
    renderTabs();
    renderContent();
    runtime.startFps();
    try { dialog.focus({ preventScroll: true }); } catch (error) { dialog.focus(); }
  }

  function close() { closeInternal(false); }
  function toggle() { ui.open ? close() : open(); }

  function bind() {
    overlay.addEventListener("keydown", function (event) {
      trapFocus(event);
      var tab = event.target.closest && event.target.closest('[role="tab"]');
      if (!tab || ["ArrowLeft", "ArrowRight", "Home", "End"].indexOf(event.key) < 0) return;
      var available = Array.prototype.slice.call(tabsHost.querySelectorAll('[role="tab"]'));
      var index = available.indexOf(tab);
      if (event.key === "Home") index = 0;
      else if (event.key === "End") index = available.length - 1;
      else index = (index + (event.key === "ArrowRight" ? 1 : -1) + available.length) % available.length;
      event.preventDefault();
      activateTab(available[index].getAttribute("data-vdev-tab"), true);
    });

    overlay.addEventListener("click", function (event) {
      var tab = event.target.closest("[data-vdev-tab]");
      if (tab) { activateTab(tab.getAttribute("data-vdev-tab"), false); return; }
      var searchTarget = event.target.closest("[data-vdev-search-open]");
      if (searchTarget) { openSearchTarget(searchTarget); return; }
      var jump = event.target.closest("[data-vdev-tab-jump]");
      if (jump) { activateTab(jump.getAttribute("data-vdev-tab-jump"), true); return; }
      var action = event.target.closest("[data-vdev-action]");
      if (action) { actions.run(action.getAttribute("data-vdev-action"), payload(action)).catch(function () {}); return; }
      var favorite = event.target.closest("[data-vdev-favorite]");
      if (favorite) { actions.toggleFavorite(favorite.getAttribute("data-vdev-favorite")); renderContent(); return; }
      var replay = event.target.closest("[data-vdev-history-index]");
      if (replay) { actions.replay(actions.history()[Number(replay.getAttribute("data-vdev-history-index"))]); return; }
      var quickNode = event.target.closest("[data-vdev-quick]");
      if (quickNode) { quick(quickNode.getAttribute("data-vdev-quick")); return; }
      var copyNode = event.target.closest("[data-vdev-copy-debug]");
      if (copyNode) { copyDebug(copyNode); return; }
      if (event.target.closest("[data-vdev-history-toggle]")) { ui.historyOpen = !ui.historyOpen; renderHistory(); return; }
      if (event.target.closest("[data-vdev-minimize]")) { minimize(); return; }
      if (event.target.closest("[data-vdev-close]")) close();
    });

    overlay.addEventListener("change", function (event) {
      var action = event.target.getAttribute("data-vdev-change-action");
      if (action) actions.run(action, payload(event.target)).catch(function () {});
    });
    overlay.addEventListener("input", function (event) {
      if (!event.target.matches("[data-vdev-search]")) return;
      ui.query = event.target.value;
      renderContent();
    });
    launcher.addEventListener("click", open);
  }

  function ensure() {
    if (overlay) return;
    launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "vdev-launcher";
    launcher.textContent = "🛠 Developer";
    launcher.setAttribute("data-vdev-launcher", "");
    launcher.setAttribute("aria-label", "Mở Developer Center");
    document.body.appendChild(launcher);

    overlay = document.createElement("div");
    overlay.id = "vDeveloperControlCenter";
    overlay.className = "vdev-overlay";
    overlay.hidden = true;
    overlay.innerHTML = '<section class="vdev-center" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="vdev-dialog-title"><header class="vdev-header"><div class="vdev-title"><span>VDUCKIE V107.1</span><strong id="vdev-dialog-title">Developer Control Center</strong><small>● Developer Mode · UI override only</small></div><label class="vdev-search"><span class="sr-only">Tìm trong Developer Center</span><input type="search" autocomplete="off" data-vdev-search placeholder="Tìm tab, action, scenario, debug..."></label><div class="vdev-header-actions"><button type="button" class="vdev-reset" data-vdev-quick="reset-preview">Reset Preview</button><button type="button" data-vdev-minimize aria-label="Thu nhỏ Developer Center">—</button><button type="button" data-vdev-close aria-label="Đóng Developer Center">✕</button></div></header><nav class="vdev-tabs" role="tablist" aria-label="Developer Center tabs" data-vdev-tabs></nav><main class="vdev-scroll" data-vdev-content-scroll><div data-vdev-content></div></main><footer class="vdev-footer"><small data-vdev-status>Preview Session — không ghi XP, Progress, Supabase, Inventory hoặc Achievement</small><div class="vdev-footer-actions"><button type="button" data-vdev-quick="replay">Replay Current</button><button type="button" data-vdev-history-toggle>History</button><button type="button" data-vdev-quick="reload-assets">Assets</button><button type="button" data-vdev-quick="reload-manifest">Manifest</button><button type="button" data-vdev-quick="clear-runtime">Clear Cache</button><button type="button" data-vdev-quick="reset-ui">Reset UI</button></div></footer><aside class="vdev-history" data-vdev-history-panel hidden></aside></section>';
    document.body.appendChild(overlay);
    dialog = overlay.querySelector(".vdev-center");
    content = overlay.querySelector("[data-vdev-content]");
    tabsHost = overlay.querySelector("[data-vdev-tabs]");
    historyHost = overlay.querySelector("[data-vdev-history-panel]");
    searchInput = overlay.querySelector("[data-vdev-search]");
    statusHost = overlay.querySelector("[data-vdev-status]");
    bind();
    renderTabs();
    renderContent();
    unsubscribe = runtime.subscribe(function (event) {
      if (event.type === "toast") showToast(event.detail);
      else if (event.type === "modal") showModal(event.detail);
      else if (event.type === "state" || event.type === "history" || event.type === "favorites" || event.type === "history-cleared") renderContent();
    });
  }

  function destroy() {
    if (ui.open) close();
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    if (toastTimer) root.clearTimeout(toastTimer);
    if (toastNode && toastNode.parentNode) toastNode.parentNode.removeChild(toastNode);
    toastNode = null;
    actions.audio.close();
    if (overlay) overlay.remove();
    if (launcher) launcher.remove();
    overlay = launcher = dialog = content = tabsHost = historyHost = searchInput = statusHost = null;
    runtime.destroy();
  }

  ns.ui = Object.freeze({
    mount: ensure, open: open, close: close, minimize: minimize, toggle: toggle, destroy: destroy,
    state: function () { return Object.assign({}, ui); }, visibleTabs: function () { return visibleTabs.slice(); }
  });
})(window, document);
