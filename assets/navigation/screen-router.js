/* Exclusive top-level navigation. No learning state or EXP state is stored here. */
(function (root, document) {
  "use strict";
  var busy = false;
  var current = null;
  var viewIds = ["homeHub","erpHero","hskHero","lessons","cards","quiz","glossary",
    "personal","community","hsk","dialogue","homeJourney","erpJourney","hskJourney",
    "leaderboard","dailyLearningPanel","hskRoadmapScreen"];
  var erpViews = ["lessons","cards","dialogue","quiz","glossary","personal","community"];
  function one(selector) { return document.querySelector(selector); }
  function screenOf(button) {
    if (button.matches('[data-v865-action="open-hsk"]')) return "roadmap";
    if (button.matches("[data-exp-open-all]")) return "ranking";
    if (button.hasAttribute("data-daily-home") || button.hasAttribute("data-home") || button.id === "brandHome") return "home";
    if (button.hasAttribute("data-daily-nav")) return button.getAttribute("data-daily-nav");
    if (button.hasAttribute("data-view")) return "erp:" + button.getAttribute("data-view");
    if (button.hasAttribute("data-journey-view")) return "erp:" + button.getAttribute("data-journey-view");
    if (button.hasAttribute("data-home-view")) return "erp:" + button.getAttribute("data-home-view");
    if (button.hasAttribute("data-area")) return button.getAttribute("data-area") === "erp" ? "erp:lessons" : "hsk";
    if (button.hasAttribute("data-home-area")) return button.getAttribute("data-home-area") === "erp" ? "erp:lessons" : "hsk";
    if (button.hasAttribute("data-exp-nav")) {
      var name = button.getAttribute("data-exp-nav");
      return name === "erp" ? "erp:lessons" : name;
    }
    return null;
  }
  function valid(screen) {
    return ["home","ranking","hsk","msutong","hsk-study","roadmap","daily","review","dictionary","profile"].indexOf(screen) !== -1 ||
      (screen.indexOf("erp:") === 0 && erpViews.indexOf(screen.slice(4)) !== -1);
  }
  function fromLocation() {
    var params = new URLSearchParams(root.location.search), screen = params.get("screen");
    if (screen && valid(screen)) return screen;
    if (root.location.hash === "#leaderboard") return "ranking";
    if (params.get("area") === "hsk" || root.location.hash === "#hsk") return "hsk";
    if (params.get("area") === "erp") return "erp:lessons";
    return "home";
  }
  function urlFor(screen) {
    var url = new URL(root.location.href);
    url.searchParams.delete("area");
    url.searchParams.set("screen", screen);
    if (url.hash === "#leaderboard" || url.hash === "#hsk") url.hash = "";
    return url.pathname + url.search + url.hash;
  }
  function hide(id) { var node = document.getElementById(id); if (node) node.classList.add("hidden"); }
  function activate(screen) {
    document.querySelectorAll("#studySidebar button.active, #studySidebar button[aria-current]").forEach(function (button) {
      button.classList.remove("active"); button.removeAttribute("aria-current");
    });
    var selector = screen === "home" ? "#studySidebar [data-home]" :
      screen === "ranking" ? '#studySidebar [data-exp-nav="ranking"]' :
      screen === "roadmap" ? '#studySidebar [data-daily-nav="msutong"]' :
      screen === "hsk-study" ? '#studySidebar [data-daily-nav="msutong"]' :
      screen === "hsk" ? '#studySidebar [data-area="hsk"]' :
      screen.indexOf("erp:") === 0 ? '#studySidebar [data-view="' + screen.slice(4) + '"]' :
      '#studySidebar [data-daily-nav="' + screen + '"]';
    var selected = one(selector);
    if (selected) { selected.classList.add("active"); selected.setAttribute("aria-current", "page"); }
    document.querySelectorAll("[data-exp-nav]").forEach(function (button) {
      var name = button.getAttribute("data-exp-nav");
      var active = name === (screen.indexOf("erp:") === 0 ? "erp" : screen);
      if (!button.closest("#studySidebar")) button.classList.toggle("active", active);
    });
  }
  function invoke(selector) {
    var target = one(selector);
    if (!target) return false;
    busy = true;
    try { target.click(); } finally { busy = false; }
    return true;
  }
  function show(screen, historyMode) {
    if (!valid(screen)) screen = "home";
    if (screen === current && historyMode === "push") {
      // Recover an initially empty or reset curriculum panel on a repeat click.
      var panel = document.getElementById("dailyLearningPanel");
      if (screen !== "msutong" || (panel && !panel.classList.contains("hidden") && panel.querySelector(".graded-hsk-page"))) return;
      historyMode = "replace"; // A repair must not add a second history entry.
    }
    var priorURL = root.location.pathname + root.location.search + root.location.hash;
    var priorState = root.history.state;
    if (screen === "roadmap" && root.VDuckieHSKRoadmap) {
      root.VDuckieHSKRoadmap.open();
    } else if (screen === "ranking") {
      if (root.VDuckieEXPUI) root.VDuckieEXPUI.openLeaderboard(root.VDuckieEXPBoard && root.VDuckieEXPBoard.period() || "week");
    } else if (screen === "msutong" && root.VDuckieGradedHSK) {
      // Legacy Daily owns the panel mount and layout visibility. Prepare it first.
      if (root.VDuckieDailyLearning) root.VDuckieDailyLearning.show("msutong");
      root.VDuckieGradedHSK.open();
    } else if (screen === "home") {
      invoke("#studySidebar [data-home]");
      var homeNode = document.getElementById("homeHub");
      if (homeNode) homeNode.classList.remove("hidden");
    } else if (screen === "hsk" || screen === "hsk-study") {
      invoke('#studySidebar [data-area="hsk"]');
    } else if (screen.indexOf("erp:") === 0) {
      invoke('#studySidebar [data-view="' + screen.slice(4) + '"]');
      // Legacy area selector rejects a home -> ERP switch without ?area=erp.
      // Set the destination area first, then reconcile its active ERP panel.
      document.body.setAttribute("data-current-area", "erp");
      if (root.ERPAreaNavigation) root.ERPAreaNavigation.select("erp");
      if (screen.slice(4) !== "lessons") invoke('#studySidebar [data-view="' + screen.slice(4) + '"]');
    } else if (root.VDuckieDailyLearning) {
      root.VDuckieDailyLearning.show(screen);
    }
    if (screen === "roadmap") {
      viewIds.forEach(function (id) { if (id !== "hskRoadmapScreen") hide(id); });
    } else if (screen === "ranking") {
      viewIds.forEach(function (id) { if (id !== "leaderboard") hide(id); });
    } else if (["msutong","roadmap","daily","review","dictionary","profile"].indexOf(screen) !== -1) {
      viewIds.forEach(function (id) { if (id !== "dailyLearningPanel") hide(id); });
    } else {
      hide("leaderboard");
      hide("dailyLearningPanel");
      hide("hskRoadmapScreen");
    }
    // The HSK runtime may override legacy .hidden styles after it mounts.
    // Keep the top-level screen exclusive regardless of mount order.
    var hskScreen = screen === "hsk" || screen === "hsk-study";
    if (hskScreen) {
      // The legacy area handler leaves Home mounted when clicking a Home roadmap card.
      // Route, not scroll position, must own the visible lesson surface.
      ["homeHub","homeJourney","erpHero","erpJourney","hskRoadmapScreen"].forEach(hide);
      var course = document.getElementById("hsk");
      if (course) course.classList.remove("hidden");
      document.documentElement.classList.remove("v865-home-mode");
    }
    ["hsk", "hskHero", "hskJourney"].forEach(function (id) {
      var node = document.getElementById(id);
      if (node && !hskScreen) node.classList.add("hidden");
    });
    if (screen !== "roadmap") hide("hskRoadmapScreen");
    if (screen.indexOf("erp:") === 0) {
      var erpPanel = document.getElementById(screen.slice(4));
      if (erpPanel) erpPanel.classList.remove("hidden");
    }
    document.body.setAttribute("data-current-area", screen.indexOf("erp:") === 0 ? "erp" : screen);
    activate(screen);
    current = screen;
    // Undo legacy replaceState calls before adding the new history entry.
    // Otherwise Back returns to a mutated version of the previous screen.
    root.history.replaceState(priorState, "", priorURL);
    if (historyMode === "push") root.history.pushState({vduckieScreen:screen}, "", urlFor(screen));
    else if (historyMode === "replace") root.history.replaceState({vduckieScreen:screen}, "", urlFor(screen));
    document.body.classList.remove("sidebar-open");
    var toggle = document.getElementById("mobileMenu"); if (toggle) toggle.setAttribute("aria-expanded", "false");
    root.scrollTo(0, 0);
  }
  // Window capture precedes the legacy document capture listener (Daily) and all bubble listeners.
  root.addEventListener("click", function (event) {
    if (busy || !event.target.closest) return;
    var target = event.target.closest('[data-v865-action="open-hsk"],[data-exp-nav],[data-exp-open-all],[data-daily-nav],[data-daily-home],[data-home],[data-area],[data-view],[data-home-area],[data-journey-view],#brandHome');
    if (!target || target.closest("[data-exp-period]")) return;
    var screen = screenOf(target);
    if (!screen || !valid(screen)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    show(screen, "push");
  }, true);
  root.addEventListener("popstate", function () { show(fromLocation(), "none"); });
  function ensureExclusiveSidebar() {
    var sidebar = document.getElementById("studySidebar");
    if (!sidebar || sidebar.__vduckieExclusiveObserver) return;
    var scheduled = false;
    sidebar.__vduckieExclusiveObserver = new MutationObserver(function () {
      if (scheduled || !current) return;
      scheduled = true;
      root.requestAnimationFrame(function () {
        scheduled = false;
        var activeButtons = sidebar.querySelectorAll("button.active");
        var pageButtons = sidebar.querySelectorAll('button[aria-current="page"]');
        var expected = one(
          current === "home" ? '#studySidebar [data-home]' :
          current === "ranking" ? '#studySidebar [data-exp-nav="ranking"]' :
          ["msutong","hsk-study","roadmap"].indexOf(current) !== -1 ? '#studySidebar [data-daily-nav="msutong"]' :
          current.indexOf("erp:") === 0 ? '#studySidebar [data-view="' + current.slice(4) + '"]' :
          '#studySidebar [data-daily-nav="' + current + '"]'
        );
        if (expected && (activeButtons.length !== 1 || pageButtons.length !== 1 || activeButtons[0] !== expected || pageButtons[0] !== expected)) activate(current);
      });
    });
    sidebar.__vduckieExclusiveObserver.observe(sidebar,{subtree:true,attributes:true,attributeFilter:["class","aria-current"],childList:true});
  }
  function init() {
    // Route after the legacy modules have mounted their dynamically inserted screens.
    // Other DOMContentLoaded initializers can reset the legacy panels.
    // Run the route after those synchronous initialization listeners complete.
    root.setTimeout(function () { show(fromLocation(), "replace"); ensureExclusiveSidebar(); }, 0);
  }
  root.VDuckieScreenRouter = Object.freeze({ navigate: function (screen) { show(screen, "push"); }, current: function () { return current; } });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true}); else init();
})(window, document);
