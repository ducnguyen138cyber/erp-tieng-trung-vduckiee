(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_DEVELOPER_CONTROL_CENTER_V107_1__) return;
  root.__VDUCKIE_DEVELOPER_CONTROL_CENTER_V107_1__ = true;

  var ns = root.VDuckieDeveloper;
  var authorized = false;
  var authorizationToken = 0;
  var offs = [];
  var legacyState = null;

  function hideLegacyPanel() {
    var legacy = document.getElementById("v93DeveloperPreview");
    if (!legacy || legacyState) return;
    legacyState = { node: legacy, hidden: legacy.hidden, ariaHidden: legacy.getAttribute("aria-hidden") };
    legacy.hidden = true;
    legacy.setAttribute("aria-hidden", "true");
  }

  function restoreLegacyPanel() {
    if (!legacyState || !legacyState.node) { legacyState = null; return; }
    legacyState.node.hidden = legacyState.hidden;
    if (legacyState.ariaHidden === null) legacyState.node.removeAttribute("aria-hidden");
    else legacyState.node.setAttribute("aria-hidden", legacyState.ariaHidden);
    legacyState = null;
  }

  function ready(bridge) {
    if (!ns || !ns.runtime || !ns.ui) return;
    authorized = true;
    ns.runtime.setBridge(bridge);
    ns.ui.mount();
    hideLegacyPanel();
    document.body.classList.add("vdev-center-ready");
    ns.ui.open();
    ns.runtime.emit("toast", { message: "Developer Control Center V107.1 đã sẵn sàng.", tone: "good" });
  }

  function request() {
    var evolution = root.VDuckieEvolution;
    if (!evolution || typeof evolution.requestDeveloperBridge !== "function") return;
    var token = ++authorizationToken;
    evolution.requestDeveloperBridge().then(function (bridge) {
      if (token !== authorizationToken) return;
      ready(bridge);
    }).catch(function () { authorized = false; });
  }

  function revoke() {
    authorizationToken += 1;
    authorized = false;
    document.body.classList.remove("vdev-center-ready");
    if (ns && ns.ui) ns.ui.close();
    restoreLegacyPanel();
  }

  function onKey(event) {
    if (event.key === "Escape" && authorized && ns.ui.state().open) {
      event.preventDefault();
      event.stopPropagation();
      ns.ui.close();
      return;
    }
    if (event.ctrlKey && event.shiftKey && String(event.key).toLowerCase() === "d") {
      event.preventDefault();
      if (authorized) ns.ui.toggle();
      else request();
    }
  }

  function animationReport(event) {
    var detail = event.detail || {};
    if (!ns || !ns.runtime) return;
    ns.runtime.patch({ animation: {
      current: detail.resolvedState || detail.requestedState || "idle",
      queue: detail.queueStatus || "empty",
      cooldown: detail.cooldownStatus || "ready",
      priority: root.VDuckieMascotStates && root.VDuckieMascotStates.priorities && root.VDuckieMascotStates.priorities[detail.resolvedState] || 0,
      duration: Number(detail.duration || 0)
    } }, "animation-report");
  }

  function init() {
    if (!ns) return;
    offs.push(ns.runtime.listen(document, "keydown", onKey, true));
    offs.push(ns.runtime.listen(document, "vduckie:developer-animation-test", animationReport));
    offs.push(ns.runtime.listen(document, "vduckie:developer-preview-authorized", request));
    offs.push(ns.runtime.listen(document, "vduckie:developer-preview-revoked", revoke));
    if (document.getElementById("v93DeveloperPreview")) request();
    else root.setTimeout(request, 120);
  }

  function destroy() {
    offs.forEach(function (off) { off(); });
    offs.length = 0;
    if (ns && ns.ui) ns.ui.destroy();
    revoke();
  }

  root.VDuckieDeveloperControlCenter = Object.freeze({
    version: "107.1",
    open: function () { if (authorized) ns.ui.open(); else request(); },
    close: function () { if (ns && ns.ui) ns.ui.close(); },
    destroy: destroy,
    isAuthorized: function () { return authorized; }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})(window, document);
