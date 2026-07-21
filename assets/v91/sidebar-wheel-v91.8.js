(function (root, document) {
  "use strict";

  if (root.__VDUCKIE_SIDEBAR_WHEEL_V918__) return;
  root.__VDUCKIE_SIDEBAR_WHEEL_V918__ = true;

  function isDesktop() {
    return !root.matchMedia || root.matchMedia("(min-width: 981px)").matches;
  }

  function bindSidebarWheel() {
    var sidebar = document.querySelector(".study-sidebar");
    if (!sidebar || sidebar.__v918WheelBound) return;

    sidebar.__v918WheelBound = true;
    sidebar.scrollTop = 0;

    sidebar.addEventListener("scroll", function () {
      if (isDesktop() && sidebar.scrollTop !== 0) sidebar.scrollTop = 0;
    }, { passive: true });

    sidebar.addEventListener("wheel", function (event) {
      if (!isDesktop()) return;
      event.preventDefault();
      root.scrollBy({
        top: event.deltaY,
        left: event.deltaX,
        behavior: "auto"
      });
    }, { passive: false });
  }

  function init() {
    bindSidebarWheel();
    root.setTimeout(bindSidebarWheel, 250);
    root.setTimeout(bindSidebarWheel, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(window, document);
