(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_DEVELOPER_PREVIEW_V100__) return;
  root.__VDUCKIE_DEVELOPER_PREVIEW_V100__ = true;
  var observer = null;
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]; }); }
  function refresh() {
    var panel = document.getElementById("v93DeveloperPreview");
    var body = panel && panel.querySelector(".v93-dev-body");
    if (!body) return false;
    var status = panel.querySelector("[data-v100-asset-status]");
    if (!status) {
      status = document.createElement("section"); status.className = "v100-dev-status"; status.setAttribute("data-v100-asset-status", "");
      var real = body.querySelector("[data-v93-real]"); if (real) body.insertBefore(status, real); else body.appendChild(status);
    }
    var node = document.querySelector("#v92EvolutionCard [data-v95-mascot]") || document.querySelector("[data-v95-mascot]");
    if (!node) { var emptyMarkup = "<strong>Asset runtime</strong><span>Chưa mount mascot</span>"; if (status.innerHTML !== emptyMarkup) status.innerHTML = emptyMarkup; return true; }
    var fallback = node.getAttribute("data-v95-using-fallback") === "true";
    if (status.getAttribute("data-v100-fallback") !== String(fallback)) status.setAttribute("data-v100-fallback", String(fallback));
    var markup = "<strong>Asset runtime · Level " + esc(node.getAttribute("data-v95-level")) + "</strong>" +
      "<span>Path: " + esc(node.getAttribute("data-v95-resolved-asset")) + "</span>" +
      "<span>Mode/state: " + esc(node.getAttribute("data-v95-render-mode")) + " / " + esc(node.getAttribute("data-v95-state")) + "</span>" +
      "<span>Load: " + esc(node.getAttribute("data-v95-load-status")) + " · fallback: " + (fallback ? "có" : "không") + "</span>";
    if (status.innerHTML !== markup) status.innerHTML = markup;
    return true;
  }
  function watch() {
    refresh();
    if (!root.MutationObserver || observer) return;
    observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-v95-level", "data-v95-state", "data-v95-load-status", "data-v95-using-fallback"] });
  }
  document.addEventListener("vduckie:developer-preview-authorized", watch);
  document.addEventListener("vduckie:developer-preview-revoked", function () { if (observer) observer.disconnect(); observer = null; });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch, { once: true }); else watch();
})(window, document);
