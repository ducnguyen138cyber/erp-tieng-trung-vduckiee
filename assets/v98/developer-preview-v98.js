(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_DEVELOPER_PREVIEW_V98__) return;
  root.__VDUCKIE_DEVELOPER_PREVIEW_V98__ = true;
  var observer = null;
  function button(level, state) { var node = document.createElement("button"); node.type = "button"; node.setAttribute("data-v98-level", level); node.setAttribute("data-v98-state", state); node.textContent = "LV" + level + " " + state; return node; }
  function run(level, state) { var evolution = root.VDuckieEvolution; if (!evolution || typeof evolution.requestDeveloperBridge !== "function") return; evolution.requestDeveloperBridge().then(function (bridge) { bridge.enable(Number(level)); bridge.test(state); }).catch(function () {}); }
  function enhance() {
    var panel = document.getElementById("v93DeveloperPreview");
    var body = panel && panel.querySelector(".v93-dev-body");
    if (!body) return false;
    if (panel.querySelector("[data-v98-lv56-tests]")) return true;
    var section = document.createElement("section");
    section.className = "v98-dev-lv56";
    section.setAttribute("data-v98-lv56-tests", "");
    section.innerHTML = '<strong>Level 5–6 Character Preview</strong><div class="v98-dev-lv56-grid"></div>';
    var grid = section.querySelector(".v98-dev-lv56-grid");
    [5, 6].forEach(function (level) { ["idle", "hover", "tap", "success", "sad", "outfit-change"].forEach(function (state) { grid.appendChild(button(level, state)); }); });
    section.addEventListener("click", function (event) { var target = event.target.closest && event.target.closest("[data-v98-level]"); if (!target) return; event.preventDefault(); run(target.getAttribute("data-v98-level"), target.getAttribute("data-v98-state")); });
    var real = body.querySelector("[data-v93-real]");
    if (real) body.insertBefore(section, real); else body.appendChild(section);
    return true;
  }
  function watch() { if (enhance() || !root.MutationObserver || !document.body) return; if (observer) observer.disconnect(); observer = new MutationObserver(function () { if (enhance()) { observer.disconnect(); observer = null; } }); observer.observe(document.body, { childList: true, subtree: true }); }
  document.addEventListener("vduckie:developer-preview-authorized", watch);
  document.addEventListener("vduckie:developer-preview-revoked", function () { if (observer) observer.disconnect(); observer = null; });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch, { once: true }); else watch();
})(window, document);
