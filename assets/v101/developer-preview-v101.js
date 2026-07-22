(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_DEVELOPER_PREVIEW_V101__) return;
  root.__VDUCKIE_DEVELOPER_PREVIEW_V101__ = true;
  var observer = null;
  var lastLog = "";
  var authorized = false;
  function currentMascot() { return document.querySelector("#v92EvolutionCard [data-v95-mascot]") || document.querySelector("[data-v95-mascot]"); }
  function details(node) {
    var style = node && root.getComputedStyle ? root.getComputedStyle(node) : { opacity: "", visibility: "" };
    return node ? {
      level: node.getAttribute("data-v95-level"), requestedState: node.getAttribute("data-v95-requested-state"), resolvedState: node.getAttribute("data-v95-resolved-state"),
      asset: node.getAttribute("data-v95-resolved-asset"), renderMode: node.getAttribute("data-v95-render-mode"), imageLoaded: node.getAttribute("data-v95-load-status"),
      animationReady: node.getAttribute("data-v95-animation-ready"), fallbackActive: node.getAttribute("data-v95-using-fallback"), runtimeState: node.getAttribute("data-v95-runtime-state"),
      opacity: style.opacity, visibility: style.visibility, classes: node.className
    } : null;
  }
  function refresh() {
    var panel = document.getElementById("v93DeveloperPreview");
    var body = panel && panel.querySelector(".v93-dev-body");
    var node = currentMascot();
    if (!panel || !body || !node) return false;
    var status = panel.querySelector("[data-v101-runtime-status]");
    if (!status) {
      status = document.createElement("section"); status.className = "v100-dev-status"; status.setAttribute("data-v101-runtime-status", "");
      status.innerHTML = '<strong>Renderer lifecycle</strong><div data-v101-details></div><button type="button" data-v101-reset>Reset to Default</button>';
      var real = body.querySelector("[data-v93-real]"); if (real) body.insertBefore(status, real); else body.appendChild(status);
      status.querySelector("[data-v101-reset]").addEventListener("click", function () { var evolution = root.VDuckieEvolution; if (!evolution) return; evolution.requestDeveloperBridge().then(function (bridge) { bridge.test("idle"); }).catch(function () {}); });
    }
    var data = details(node);
    var extra = 'Requested/resolved: ' + data.requestedState + ' / ' + data.resolvedState + '<br>Runtime: ' + data.runtimeState + ' · animation ready: ' + data.animationReady + '<br>Image: ' + data.imageLoaded + ' · fallback: ' + data.fallbackActive + '<br>Opacity: ' + data.opacity + ' · visibility: ' + data.visibility;
    var detailsNode = status.querySelector("[data-v101-details]"); if (detailsNode.innerHTML !== extra) detailsNode.innerHTML = extra;
    var signature = JSON.stringify(data);
    if (signature !== lastLog && root.console && console.debug) { lastLog = signature; console.debug("VDuckie runtime", data); }
    return true;
  }
  function watch() { if (!authorized) return; refresh(); if (observer || !root.MutationObserver) return; observer = new MutationObserver(refresh); observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "data-v95-state", "data-v95-runtime-state", "data-v95-load-status"] }); }
  document.addEventListener("vduckie:developer-preview-authorized", function () { authorized = true; watch(); });
  document.addEventListener("vduckie:developer-preview-revoked", function () { authorized = false; if (observer) observer.disconnect(); observer = null; lastLog = ""; });
  function resumeExistingPanel() { if (document.getElementById("v93DeveloperPreview")) { authorized = true; watch(); } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", resumeExistingPanel, { once: true }); else resumeExistingPanel();
})(window, document);
