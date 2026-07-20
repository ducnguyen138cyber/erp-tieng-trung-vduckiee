(function (root, document) {
  "use strict";
  var core = root.VDuckieEXPCore;
  function byId(id) { return document.getElementById(id); }
  function injectUI() {
    if (byId("leaderboard")) return;
    var header = document.querySelector("header.top");
    if (header) {
      var nav = document.createElement("nav");
      nav.className = "exp-main-nav";
      nav.setAttribute("aria-label", "Menu chính");
      nav.innerHTML = '<button type="button" data-exp-nav="home" class="active">Trang chủ</button><button type="button" data-exp-nav="dictionary">Từ điển</button><button type="button" data-exp-nav="hsk">HSK</button><button type="button" data-exp-nav="erp">ERP</button><button type="button" data-exp-nav="ranking">Xếp hạng</button>';
      header.insertAdjacentElement("afterend", nav);
    }
    var topActions = document.querySelector(".top-actions");
    if (topActions) {
      var card = document.createElement("div");
      card.id = "expAccountCard";
      card.className = "exp-account-card is-guest";
      card.innerHTML = '<span class="exp-account-avatar" id="expAccountAvatar" aria-hidden="true">?</span><div class="exp-account-copy"><span id="expAccountName">Chưa đăng nhập</span><small>EXP của bạn</small><strong id="expMyTotal">Đăng nhập để lưu</strong></div>';
      topActions.appendChild(card);
    }
    var sidebar = document.querySelector(".study-sidebar .home-switch");
    if (sidebar) sidebar.insertAdjacentHTML("afterend", '<nav class="home-switch exp-sidebar-button"><button type="button" data-exp-nav="ranking"><span class="menu-icon">榜</span><span>Xếp hạng</span></button></nav>');
    var main = document.querySelector(".study-center main");
    if (main) main.insertAdjacentHTML("beforeend", '<section id="leaderboard" class="panel exp-leaderboard hidden"><div class="exp-board-head"><div><span class="step">BẢNG XẾP HẠNG NGƯỜI HỌC</span><h1>Học đều, EXP tự lên</h1><p>Điểm được tính từ giao dịch EXP đã xác thực trong Supabase.</p></div><div class="exp-period-tabs" role="tablist"><button type="button" class="active" data-exp-period="week">Tuần này</button><button type="button" data-exp-period="month">Tháng này</button><button type="button" data-exp-period="total">Tổng</button></div></div><div id="expLoginCallout" class="exp-login-callout"><span>Đăng nhập để lưu EXP và tham gia xếp hạng.</span><button type="button" id="expLoginButton">Đăng nhập Google</button></div><div id="expPodium" class="exp-podium"></div><div class="exp-board-card"><div class="exp-table-head"><span>Hạng</span><span>Avatar</span><span>Người học</span><span style="text-align:right">EXP</span></div><div id="expLeaderboardList"><div class="exp-state">Đang tải bảng xếp hạng…</div></div></div><div id="expMyRank"></div></section>');
    document.body.insertAdjacentHTML("beforeend", '<div id="expToast" class="exp-toast" role="status" aria-live="polite"></div>');
  }
  function renderMyEXP(value) {
    var card = byId("expAccountCard"), amount = byId("expMyTotal"), name = byId("expAccountName"), image = byId("expAccountAvatar");
    if (!card || !amount) return;
    var session = core.session();
    if (session && session.user) {
      var meta = core.userMeta(session.user);
      amount.textContent = core.formatEXP(value);
      if (name) name.textContent = meta.name;
      if (image) image.innerHTML = meta.avatar ? '<img src="' + core.escapeHtml(meta.avatar) + '" alt="" referrerpolicy="no-referrer">' : core.escapeHtml(core.initials(meta.name));
      card.classList.remove("is-guest");
    } else {
      amount.textContent = "Đăng nhập để lưu";
      if (name) name.textContent = "Chưa đăng nhập";
      if (image) image.textContent = "?";
      card.classList.add("is-guest");
    }
  }
  function mark(name) {
    var buttons = document.querySelectorAll("[data-exp-nav]");
    for (var index = 0; index < buttons.length; index++) buttons[index].classList.toggle("active", buttons[index].getAttribute("data-exp-nav") === name);
  }
  function hide() { var board = byId("leaderboard"); if (board) board.classList.add("hidden"); }
  function open() { var board = byId("leaderboard"); return !!board && !board.classList.contains("hidden"); }
  function ranking() {
    var ids = ["homeHub", "erpHero", "hskHero", "lessons", "cards", "quiz", "glossary", "personal", "community", "hsk", "dialogue", "homeJourney", "erpJourney", "hskJourney"];
    for (var index = 0; index < ids.length; index++) { var node = byId(ids[index]); if (node) node.classList.add("hidden"); }
    var board = byId("leaderboard"); if (board) board.classList.remove("hidden");
    document.body.setAttribute("data-current-area", "ranking");
    document.title = "Bảng xếp hạng — Developed by VDuckie";
    mark("ranking"); root.VDuckieEXPBoard.refresh();
    if (board) board.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function navigate(name) {
    hide(); mark(name);
    if (name === "home" && root.ERPAreaNavigation) root.ERPAreaNavigation.home();
    else if (name === "hsk" && root.ERPAreaNavigation) root.ERPAreaNavigation.select("hsk");
    else if (name === "erp" && root.ERPAreaNavigation) root.ERPAreaNavigation.select("erp");
    else if (name === "dictionary") { var item = document.querySelector('#erpNav [data-view="glossary"]'); if (item) item.click(); }
    else if (name === "ranking") ranking();
  }
  function updateAuth(session) {
    var callout = byId("expLoginCallout"); if (callout) callout.classList.toggle("hidden", !!(session && session.user));
    if (session && session.user) core.syncProfile().then(root.VDuckieEXP.getCurrentUserEXP).then(renderMyEXP);
    else renderMyEXP(0);
    if (open()) root.VDuckieEXPBoard.refresh();
  }
  function bind() {
    document.addEventListener("click", function (event) {
      var nav = event.target.closest ? event.target.closest("[data-exp-nav]") : null;
      if (nav) { event.preventDefault(); navigate(nav.getAttribute("data-exp-nav")); return; }
      var period = event.target.closest ? event.target.closest("[data-exp-period]") : null;
      if (period) { root.VDuckieEXPBoard.refresh(period.getAttribute("data-exp-period")); return; }
      if (event.target.closest && event.target.closest("#expLoginButton")) { var login = byId("cloudLogin"); if (login) login.click(); }
      var original = event.target.closest && event.target.closest("[data-home],[data-area],[data-view],[data-home-area],[data-journey-view]");
      if (!original) return;
      hide();
      var area = original.getAttribute("data-area") || original.getAttribute("data-home-area");
      var view = original.getAttribute("data-view") || original.getAttribute("data-home-view") || original.getAttribute("data-journey-view");
      if (original.hasAttribute("data-home")) mark("home");
      else if (area === "hsk") mark("hsk");
      else if (view === "glossary") mark("dictionary");
      else if (area === "erp" || view) mark("erp");
    });
  }
  function init() { injectUI(); bind(); core.onSession(updateAuth); root.VDuckieEXPBoard.refresh("week"); }
  root.VDuckieEXPUI = { renderMyEXP: renderMyEXP, refreshLeaderboard: root.VDuckieEXPBoard.refresh, isLeaderboardOpen: open };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(window, document);
