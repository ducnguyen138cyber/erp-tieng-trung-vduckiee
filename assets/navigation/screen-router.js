/* Exclusive top-level navigation. No learning state or EXP state is stored here. */
(function (root, document) {
  "use strict";
  var busy = false;
  var current = null;
  var viewIds = ["homeHub","erpHero","hskHero","lessons","cards","quiz","glossary",
    "personal","community","hsk","dialogue","homeJourney","erpJourney","hskJourney",
    "leaderboard","dailyLearningPanel","hskRoadmapScreen","gamesScreen","vietnameseScreen"];
  var erpViews = ["lessons","cards","dialogue","quiz","glossary","personal","community"];
  function one(selector) { return document.querySelector(selector); }
  function screenOf(button) {
    if (button.hasAttribute("data-shadow-open")) return "shadowing";
    if (button.matches('[data-v865-action="open-hsk"]')) return "msutong";
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
    return ["home","ranking","hsk","msutong","hsk-study","roadmap","daily","review","dictionary","profile","games","game-ranking","vietnamese","shadowing"].indexOf(screen) !== -1 ||
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
  function urlFor(screen, options) {
    var url = new URL(root.location.href);
    url.searchParams.delete("area");
    url.searchParams.set("screen", screen);
    if (screen !== "shadowing") ["shadowLevel","shadowGroup","shadowMode","shadowLine"].forEach(function(key){url.searchParams.delete(key);});
    if (screen === "shadowing" && options) {
      ["shadowLevel","shadowGroup","shadowMode","shadowLine"].forEach(function(key){url.searchParams.delete(key);});
      if (options.level) url.searchParams.set("shadowLevel", options.level);
      if (options.lessonId) url.searchParams.set("shadowGroup", options.lessonId + "-dialogue");
    }
    if (screen === "game-ranking" && root.VDuckieGameRanking) {
      var gameFilters = root.VDuckieGameRanking.filters();
      Object.keys(gameFilters).forEach(function(key){url.searchParams.set("gr_"+key,gameFilters[key]);});
    }
    if (screen !== "game-ranking") ["gr_game","gr_level","gr_mode","gr_prompt","gr_topic","gr_period"].forEach(function(key){url.searchParams.delete(key);});
    if (screen !== "vietnamese") ["viUnit","viTab"].forEach(function(key){url.searchParams.delete(key);});
    if (screen === "games" || screen === "game-ranking" || screen === "vietnamese" || screen === "shadowing") ["hskLevel","hskLesson","hskView","hskTab","hskAssessment"].forEach(function(key){url.searchParams.delete(key);});
    if (url.hash === "#leaderboard" || url.hash === "#hsk") url.hash = "";
    return url.pathname + url.search + url.hash;
  }
  function hide(id) { var node = document.getElementById(id); if (node && !node.classList.contains("hidden")) node.classList.add("hidden"); }
  function activate(screen) {
    document.querySelectorAll("#studySidebar button.active, #studySidebar button[aria-current]").forEach(function (button) {
      button.classList.remove("active"); button.removeAttribute("aria-current");
    });
    var selector = screen === "home" ? "#studySidebar [data-home]" :
      screen === "game-ranking" ? '#studySidebar [data-daily-nav="games"]' :
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
  function show(screen, historyMode, options) {
    if(root.VDuckieMobileMenu)root.VDuckieMobileMenu.close();
    if (!valid(screen)) screen = "home";
    if (screen === current && historyMode === "push" && !options) {
      // Recover an initially empty or reset curriculum panel on a repeat click.
      var panel = document.getElementById("dailyLearningPanel");
      if (screen !== "msutong" || (panel && !panel.classList.contains("hidden") && panel.querySelector(".graded-hsk-page"))) return;
      historyMode = "replace"; // A repair must not add a second history entry.
    }
    var priorURL = root.location.pathname + root.location.search + root.location.hash;
    var priorState = root.history.state;
    if (screen !== "shadowing" && root.VDuckieShadowing && root.VDuckieShadowing.leave) root.VDuckieShadowing.leave();
    if (screen !== "vietnamese" && root.VDuckieVietnamese) root.VDuckieVietnamese.leave();
    if (screen !== "vietnamese") { hide("vietnameseScreen"); if (document.title === "学越南语 — VDuckie") document.title = "VDuckie – Tự học tiếng Trung HSK và tiếng Trung công xưởng"; }
    if (screen !== "games" && root.VDuckieGames) root.VDuckieGames.leave();
    if (screen === "vietnamese" && root.VDuckieVietnamese) {
      root.VDuckieVietnamese.open();
    } else if (screen === "game-ranking" && root.VDuckieGames) {
      root.VDuckieGames.openRanking();
    } else if (screen === "games" && root.VDuckieGames) {
      root.VDuckieGames.open();
    } else if (screen === "roadmap" && root.VDuckieHSKRoadmap) {
      root.VDuckieHSKRoadmap.open();
    } else if (screen === "ranking") {
      if (root.VDuckieEXPUI) root.VDuckieEXPUI.openLeaderboard(root.VDuckieEXPBoard && root.VDuckieEXPBoard.period() || "week");
    } else if (screen === "shadowing" && root.VDuckieShadowing) {
      if (root.VDuckieDailyLearning) root.VDuckieDailyLearning.show("msutong");
      root.VDuckieShadowing.open(options);
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
    if (screen === "vietnamese") {
      viewIds.forEach(function (id) { if (id !== "vietnameseScreen") hide(id); });
      document.documentElement.classList.remove("v865-home-mode");
    } else if (screen === "games" || screen === "game-ranking") {
      viewIds.forEach(function (id) { if (id !== "gamesScreen") hide(id); });
      document.documentElement.classList.remove("v865-home-mode");
    } else if (screen === "roadmap") {
      viewIds.forEach(function (id) { if (id !== "hskRoadmapScreen") hide(id); });
    } else if (screen === "ranking") {
      viewIds.forEach(function (id) { if (id !== "leaderboard") hide(id); });
    } else if (["msutong","roadmap","daily","review","dictionary","profile","shadowing"].indexOf(screen) !== -1) {
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
    if (screen !== "games" && screen !== "game-ranking") hide("gamesScreen");
    if (screen.indexOf("erp:") === 0) {
      var erpPanel = document.getElementById(screen.slice(4));
      if (erpPanel) erpPanel.classList.remove("hidden");
    }
    document.body.setAttribute("data-screen-route", screen);
    document.body.setAttribute("data-current-area", screen.indexOf("erp:") === 0 ? "erp" : screen);
    activate(screen);
    current = screen;
    // Undo legacy replaceState calls before adding the new history entry.
    // Otherwise Back returns to a mutated version of the previous screen.
    root.history.replaceState(priorState, "", priorURL);
    if (historyMode === "push") root.history.pushState({vduckieScreen:screen}, "", urlFor(screen, options));
    else if (historyMode === "replace") root.history.replaceState({vduckieScreen:screen}, "", urlFor(screen, options));
    document.body.classList.remove("sidebar-open");
    var toggle = document.getElementById("mobileMenu"); if (toggle) toggle.setAttribute("aria-expanded", "false");
    root.scrollTo(0, 0);
  }
  // Window capture precedes the legacy document capture listener (Daily) and all bubble listeners.
  root.addEventListener("click", function (event) {
    if (busy || !event.target.closest) return;
    var target = event.target.closest('[data-shadow-open],[data-v865-action="open-hsk"],[data-exp-nav],[data-exp-open-all],[data-daily-nav],[data-daily-home],[data-home],[data-area],[data-view],[data-home-area],[data-journey-view],#brandHome');
    if (!target || target.closest("[data-exp-period]")) return;
    var screen = screenOf(target);
    if (!screen || !valid(screen)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var options;
    if (target.hasAttribute("data-shadow-open")) {
      var level = Number(target.getAttribute("data-shadow-open-level"));
      if ([1,2,3].indexOf(level) !== -1) options = {level:level, lessonId:target.getAttribute("data-shadow-open-lesson") || ""};
    }
    show(screen, "push", options);
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
          current === "game-ranking" ? '#studySidebar [data-daily-nav="games"]' :
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
  function ensureExclusiveScreens() {
    var main = document.querySelector(".study-center");
    if (!main || main.__vduckieScreenObserver) return;
    var scheduled = false;
    main.__vduckieScreenObserver = new MutationObserver(function () {
      if (scheduled || !current) return;
      scheduled = true;
      root.requestAnimationFrame(function () {
        scheduled = false;
        if (current === "vietnamese") {
          viewIds.forEach(function(id){if(id!=="vietnameseScreen")hide(id);});
          if (document.body.getAttribute("data-current-area") !== "vietnamese") document.body.setAttribute("data-current-area", "vietnamese");
          if (document.title !== "学越南语 — VDuckie") document.title = "学越南语 — VDuckie";
          var params = new URLSearchParams(root.location.search);
          if (["area","hskLevel","hskLesson","hskView","hskTab"].some(function(key){return params.has(key);}) || root.location.hash === "#hsk") root.history.replaceState(root.history.state, "", urlFor("vietnamese"));
          return;
        }
        if (current === "games" || current === "game-ranking") {
          viewIds.forEach(function(id){if(id!=="gamesScreen")hide(id);});
          if (document.body.getAttribute("data-current-area") !== current) document.body.setAttribute("data-current-area", current);
          var gameTitle = current === "game-ranking" ? "BXH trò chơi — VDuckie" : "Trò chơi — VDuckie";
          if (document.title !== gameTitle) document.title = gameTitle;
          if (new URLSearchParams(root.location.search).has("area") || root.location.hash === "#hsk") root.history.replaceState(root.history.state, "", urlFor(current));
          return;
        }
        if (current === "msutong" || current === "shadowing") {
          // A late legacy HSK mount can reselect the old area after the
          // catalogue has mounted. The explicit screen route stays authoritative.
          viewIds.forEach(function(id){if(id!=="dailyLearningPanel")hide(id);});
          var gradedPanel=document.getElementById("dailyLearningPanel");
          if(gradedPanel&&gradedPanel.classList.contains("hidden"))gradedPanel.classList.remove("hidden");
          if(document.body.getAttribute("data-current-area")!==current)document.body.setAttribute("data-current-area",current);
          if(new URLSearchParams(root.location.search).has("area")||root.location.hash==="#hsk")
            root.history.replaceState(root.history.state,"",urlFor(current));
          return;
        }
        if (current.indexOf("erp:") !== 0) return;
        var destination = document.getElementById(current.slice(4));
        if (destination && destination.classList.contains("hidden")) destination.classList.remove("hidden");
        var home = document.getElementById("homeHub");
        if (home && !home.classList.contains("hidden")) home.classList.add("hidden");
      });
    });
    main.__vduckieScreenObserver.observe(main,{subtree:true,attributes:true,attributeFilter:["class"],childList:true});
    // Legacy area switches also change the body without touching the main DOM.
    main.__vduckieScreenObserver.observe(document.body,{attributes:true,attributeFilter:["data-current-area"]});
  }
  function init() {
    // Route after the legacy modules have mounted their dynamically inserted screens.
    // Other DOMContentLoaded initializers can reset the legacy panels.
    // Run the route after those synchronous initialization listeners complete.
    root.setTimeout(function () { show(fromLocation(), "replace"); ensureExclusiveSidebar(); ensureExclusiveScreens(); }, 0);
  }
  root.VDuckieScreenRouter = Object.freeze({ navigate: function (screen, options) { show(screen, "push", options); }, current: function () { return current; } });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true}); else init();
})(window, document);
