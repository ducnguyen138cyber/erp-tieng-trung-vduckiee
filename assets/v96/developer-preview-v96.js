(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_DEVELOPER_PREVIEW_V96__) return;
  root.__VDUCKIE_DEVELOPER_PREVIEW_V96__ = true;

  var observer = null;
  var stopTimer = null;

  function makeButton(action, label) {
    var button = document.createElement("button");
    button.type = "button";
    button.setAttribute("data-v96-dev-action", action);
    button.textContent = label;
    return button;
  }

  function runAction(action) {
    var evolution = root.VDuckieEvolution;
    if (!evolution || typeof evolution.requestDeveloperBridge !== "function") return;
    evolution.requestDeveloperBridge().then(function (bridge) {
      if (action === "egg-normal") {
        bridge.enable(1);
        bridge.setEggProgress(12);
        bridge.test("tap");
        return;
      }
      if (action === "egg-cracked") {
        bridge.enable(1);
        bridge.setEggProgress(52);
        bridge.test("tap");
        return;
      }
      if (action === "egg-hatching") {
        bridge.enable(1);
        bridge.setEggProgress(92);
        bridge.test("egg-hatching");
        return;
      }
      if (action.indexOf("lv2-") === 0) {
        bridge.enable(2);
        bridge.test(action.slice(4));
      }
    }).catch(function () {});
  }

  function enhance() {
    var panel = document.getElementById("v93DeveloperPreview");
    var body = panel && panel.querySelector(".v93-dev-body");
    if (!body) return false;
    if (panel.querySelector("[data-v96-lv12-tests]")) return true;

    var section = document.createElement("section");
    section.className = "v96-dev-lv12";
    section.setAttribute("data-v96-lv12-tests", "");
    section.innerHTML = '<strong>Level 1–2 Asset Preview</strong><div class="v96-dev-lv12-grid"></div>';
    var grid = section.querySelector(".v96-dev-lv12-grid");
    [
      ["egg-normal", "Egg Normal"],
      ["egg-cracked", "Egg Cracked"],
      ["egg-hatching", "Egg Hatching"],
      ["lv2-idle", "LV2 Idle"],
      ["lv2-hover", "LV2 Hover"],
      ["lv2-success", "LV2 Success"],
      ["lv2-sad", "LV2 Sad"]
    ].forEach(function (entry) { grid.appendChild(makeButton(entry[0], entry[1])); });

    section.addEventListener("click", function (event) {
      var button = event.target.closest && event.target.closest("[data-v96-dev-action]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      runAction(button.getAttribute("data-v96-dev-action"));
    });

    var realButton = body.querySelector("[data-v93-real]");
    if (realButton) body.insertBefore(section, realButton);
    else body.appendChild(section);
    return true;
  }

  function stopWatching() {
    if (observer) observer.disconnect();
    observer = null;
    if (stopTimer) root.clearTimeout(stopTimer);
    stopTimer = null;
  }

  function watch() {
    stopWatching();
    if (enhance()) return;
    if (!root.MutationObserver || !document.body) return;
    observer = new MutationObserver(function () {
      if (enhance()) stopWatching();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    stopTimer = root.setTimeout(stopWatching, 10000);
  }

  document.addEventListener("vduckie:developer-preview-authorized", watch);
  document.addEventListener("vduckie:developer-preview-revoked", stopWatching);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch, { once: true });
  else watch();
})(window, document);
