/* Exclusive top-level navigation. No learning state or EXP state is stored here. */
(function (root, document) {
  "use strict";
  var busy = false;
  var current = null;
  var viewIds = ["homeHub","erpHero","hskHero","lessons","cards","quiz","glossary",
    "personal","community","hsk","dialogue","homeJourney","erpJourney","hskJourney",
    "leaderboard","dailyLearningPanel"];
  var erpViews = ["lessons","cards","dialogue","quiz","glossary","personal","community"];
  function one(selector) { return document.querySelector(selector); }
  function screenOf(button) {
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
    return ["home","ranking","hsk","msutong","daily","review","dictionary","profile"].indexOf(screen) !== -1 ||
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
    if (screen === current && historyMode === "push") return;
    if (screen === "ranking") {
      if (root.VDuckieEXPUI) root.VDuckieEXPUI.openLeaderboard(root.VDuckieEXPBoard && root.VDuckieEXPBoard.period() || "week");
    } else if (screen === "home") {
      invoke("#studySidebar [data-home]");
    } else if (screen === "hsk") {
      invoke('#studySidebar [data-area="hsk"]');
    } else if (screen.indexOf("erp:") === 0) {
      invoke('#studySidebar [data-view="' + screen.slice(4) + '"]');
    } else if (root.VDuckieDailyLearning) {
      root.VDuckieDailyLearning.show(screen);
    }
    if (screen === "ranking") {
      viewIds.forEach(function (id) { if (id !== "leaderboard") hide(id); });
    } else if (["msutong","daily","review","dictionary","profile"].indexOf(screen) !== -1) {
      viewIds.forEach(function (id) { if (id !== "dailyLearningPanel") hide(id); });
    } else {
      hide("leaderboard");
      hide("dailyLearningPanel");
    }
    document.body.setAttribute("data-current-area", screen);
    activate(screen);
    current = screen;
    if (historyMode === "push") root.history.pushState({vduckieScreen:screen}, "", urlFor(screen));
    else if (historyMode === "replace") root.history.replaceState({vduckieScreen:screen}, "", urlFor(screen));
    document.body.classList.remove("sidebar-open");
    var toggle = document.getElementById("mobileMenu"); if (toggle) toggle.setAttribute("aria-expanded", "false");
    root.scrollTo(0, 0);
  }
  // Window capture precedes the legacy document capture listener (Daily) and all bubble listeners.
  root.addEventListener("click", function (event) {
    if (busy || !event.target.closest) return;
    var target = event.target.closest('[data-exp-nav],[data-exp-open-all],[data-daily-nav],[data-daily-home],[data-home],[data-area],[data-view],[data-home-area],[data-journey-view],#brandHome');
    if (!target || target.closest("[data-exp-period]")) return;
    var screen = screenOf(target);
    if (!screen || !valid(screen)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    show(screen, "push");
  }, true);
  root.addEventListener("popstate", function () { show(fromLocation(), "none"); });
  function init() {
    // Route after the legacy modules have mounted their dynamically inserted screens.
    show(fromLocation(), "replace");
  }
  root.VDuckieScreenRouter = Object.freeze({ navigate: function (screen) { show(screen, "push"); }, current: function () { return current; } });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true}); else init();
})(window, document);
