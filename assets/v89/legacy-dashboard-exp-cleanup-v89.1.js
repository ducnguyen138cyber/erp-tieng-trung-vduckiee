(function (root, document) {
  "use strict";

  var observer = null;

  function removeLegacyDashboardEXP() {
    var nodes = document.querySelectorAll(".v85-level");
    for (var index = 0; index < nodes.length; index++) {
      if (nodes[index] && nodes[index].parentNode) nodes[index].parentNode.removeChild(nodes[index]);
    }
  }

  function start() {
    removeLegacyDashboardEXP();
    if (!root.MutationObserver || !document.body) return;
    observer = new MutationObserver(removeLegacyDashboardEXP);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  root.VDuckieLegacyDashboardEXPCleanup = Object.freeze({
    remove: removeLegacyDashboardEXP
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})(window, document);
