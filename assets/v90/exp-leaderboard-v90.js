(function (root, document) {
  "use strict";
  var core = root.VDuckieEXPCore;
  function byId(id) { return document.getElementById(id); }
  function injectUI() {
    if (byId("leaderboard")) return;
    var header = document.querySelector("header.top");
    if (header) {
      var nav = document.createElement("nav"); nav.className = "exp-main-nav"; nav.setAttribute("aria-label", "Menu chính");
      nav.innerHTML = '<button type="button" data-exp-nav="home" class="active">Trang chủ</button><button type="button" data-exp-nav="dictionary">Từ điển</button><button type="button" data-exp-nav="hsk">HSK</button><button type="button" data-exp-nav="erp">ERP</button><button type="button" data-exp-nav="ranking">Xếp hạng</button>';
      header.insertAdjacentElement("afterend", nav);
    }
    var oldAccount = byId("expAccountCard"); if (oldAccount) oldAccount.remove();
    var sidebar = document.querySelector(".study-sidebar .home-switch");
    if (sidebar) sidebar.insertAdjacentHTML("afterend", '<nav class="home-switch exp-sidebar-button"><button type="button" data-exp-nav="ranking"><span class="menu-icon">榜</span><span>Xếp hạng</span></button></nav>');
    var main = document.querySelector(".study-center main");
    if (main) main.insertAdjacentHTML("beforeend", '<section id="leaderboard" class="panel exp-leaderboard hidden"><div class="exp-board-head"><div><span class="step">BẢNG XẾP HẠNG NGƯỜI HỌC</span><h1>Học đều, EXP tự lên</h1><p>EXP tuần/tháng dùng để xếp hạng theo kỳ; Level luôn tính từ tổng EXP toàn thời gian.</p></div><div class="exp-period-tabs" role="tablist" aria-label="Khoảng thời gian xếp hạng"><button type="button" class="active" role="tab" aria-selected="true" data-exp-period="week">Tuần này</button><button type="button" role="tab" aria-selected="false" data-exp-period="month">Tháng này</button><button type="button" role="tab" aria-selected="false" data-exp-period="total">Tổng EXP</button></div></div><div id="expLoginCallout" class="exp-login-callout"><span>Đăng nhập để lưu EXP, nhận thưởng nhiệm vụ và xem hạng của bạn.</span><button type="button" id="expLoginButton">Đăng nhập Google</button></div><div id="expPodium" class="exp-podium" aria-live="polite"></div><div class="exp-board-card"><div class="exp-table-head"><span>Hạng</span><span>Avatar</span><span>Người học</span><span style="text-align:right">EXP</span></div><div id="expLeaderboardList"><div class="exp-state">Đang tải bảng xếp hạng…</div></div></div><div id="expMyRank"></div></section>');
    document.body.insertAdjacentHTML("beforeend", '<div id="expToast" class="exp-toast" role="status" aria-live="polite"></div>');
  }
  function mark(name) { Array.prototype.forEach.call(document.querySelectorAll("[data-exp-nav]"), function (button) { button.classList.toggle("active", button.getAttribute("data-exp-nav") === name); }); }
  function hide() { var board = byId("leaderboard"); if (board) board.classList.add("hidden"); }
  function isOpen() { var board = byId("leaderboard"); return !!board && !board.classList.contains("hidden"); }
  function openLeaderboard(nextPeriod) {
    var ids = ["homeHub", "erpHero", "hskHero", "lessons", "cards", "quiz", "glossary", "personal", "community", "hsk", "dialogue", "homeJourney", "erpJourney", "hskJourney"];
    ids.forEach(function (id) { var node = byId(id); if (node) node.classList.add("hidden"); });
    var board = byId("leaderboard"); if (board) board.classList.remove("hidden");
    document.body.setAttribute("data-current-area", "ranking"); document.title = "Bảng xếp hạng — Developed by VDuckie"; mark("ranking");
    if (root.history && root.history.replaceState) root.history.replaceState(null, "", "#leaderboard");
    root.VDuckieEXPBoard.refresh(nextPeriod || "week");
    if (board) requestAnimationFrame(function () { board.scrollIntoView({ behavior: "smooth", block: "start" }); });
  }
  function navigate(name) {
    hide(); mark(name);
    if (name === "home" && root.ERPAreaNavigation) root.ERPAreaNavigation.home();
    else if (name === "hsk" && root.ERPAreaNavigation) root.ERPAreaNavigation.select("hsk");
    else if (name === "erp" && root.ERPAreaNavigation) root.ERPAreaNavigation.select("erp");
    else if (name === "dictionary") { var item = document.querySelector('#erpNav [data-view="glossary"]'); if (item) item.click(); }
    else if (name === "ranking") openLeaderboard("week");
  }
  function updateAuth(session) {
    var callout = byId("expLoginCallout"); if (callout) callout.classList.toggle("hidden", !!(session && session.user));
    if (session && session.user) core.syncProfile().then(root.VDuckieEXP.getCurrentUserEXP).then(function (total) { document.dispatchEvent(new CustomEvent("vduckie:my-exp-loaded", { detail: { totalEXP: total } })); });
    else document.dispatchEvent(new CustomEvent("vduckie:my-exp-loaded", { detail: { totalEXP: 0, guest: true } }));
    if (isOpen()) root.VDuckieEXPBoard.refresh();
  }
  function bind() {
    document.addEventListener("click", function (event) {
      var nav = event.target.closest ? event.target.closest("[data-exp-nav]") : null;
      if (nav) { event.preventDefault(); navigate(nav.getAttribute("data-exp-nav")); return; }
      var period = event.target.closest ? event.target.closest("[data-exp-period]") : null;
      if (period) { root.VDuckieEXPBoard.refresh(period.getAttribute("data-exp-period")); return; }
      if (event.target.closest && event.target.closest("#expLoginButton,[data-exp-login]")) { var login = byId("cloudLogin"); if (login) login.click(); return; }
      var original = event.target.closest && event.target.closest("[data-home],[data-area],[data-view],[data-home-area],[data-journey-view]");
      if (!original) return;
      hide();
      if (root.location.hash === "#leaderboard" && root.history && root.history.replaceState) root.history.replaceState(null, "", root.location.pathname + root.location.search);
      var area = original.getAttribute("data-area") || original.getAttribute("data-home-area");
      var view = original.getAttribute("data-view") || original.getAttribute("data-home-view") || original.getAttribute("data-journey-view");
      if (original.hasAttribute("data-home")) mark("home"); else if (area === "hsk") mark("hsk"); else if (view === "glossary") mark("dictionary"); else if (area === "erp" || view) mark("erp");
    });
  }
  function init() { injectUI(); bind(); core.onSession(updateAuth); root.VDuckieEXPBoard.refresh("week"); if (root.location.hash === "#leaderboard") setTimeout(function () { openLeaderboard("week"); }, 50); }
  root.VDuckieEXPUI = { refreshLeaderboard: root.VDuckieEXPBoard.refresh, isLeaderboardOpen: isOpen, openLeaderboard: openLeaderboard };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(window, document);
