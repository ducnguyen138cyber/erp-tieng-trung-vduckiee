(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_DEVELOPER_PREVIEW_V95__) return;
  root.__VDUCKIE_DEVELOPER_PREVIEW_V95__ = true;

  var observer = null;
  var stopTimer = null;

  function button(name, label) {
    var element = document.createElement("button");
    element.type = "button";
    element.setAttribute("data-v93-test", name);
    element.textContent = label;
    return element;
  }

  function enhance() {
    var panel = document.getElementById("v93DeveloperPreview");
    var tests = panel && panel.querySelector(".v93-dev-tests");
    if (!tests) return false;
    if (!tests.querySelector('[data-v93-test="tap"]')) tests.appendChild(button("tap", "Test Tap"));
    if (!tests.querySelector('[data-v93-test="thought"]')) tests.appendChild(button("thought", "Random Thought"));
    if (!tests.querySelector('[data-v93-test="outfit-change"]')) tests.appendChild(button("outfit-change", "Test Outfit Change"));
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
