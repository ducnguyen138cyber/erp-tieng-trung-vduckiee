(function (root, document) {
  "use strict";
  var core = root.VDuckieEXPCore;
  var observer = null;
  var scheduled = false;
  var applying = false;
  var currentMissions = [];
  var currentTotal = 0;
  var accountInitialized = false;
  var miniRequest = 0;

  function byId(id) { return document.getElementById(id); }
  function avatarMarkup(name, url, className) {
    var classes = className || "v90-user-avatar";
    if (url) return '<span class="' + classes + '"><img src="' + core.escapeHtml(url) + '" alt="" referrerpolicy="no-referrer"></span>';
    return '<span class="' + classes + '" aria-hidden="true">' + core.escapeHtml(core.initials(name)) + "</span>";
  }
  function accountShell() { var article = document.createElement("article"); article.id = "expHomeAccount"; article.className = "v865-side-card v90-account-card"; article.setAttribute("aria-live", "polite"); article.innerHTML = '<div class="v90-side-state">Đang tải tài khoản…</div>'; return article; }
  function weeklyShell(existing) { var article = existing || document.createElement("article"); article.id = "expWeeklyMissions"; article.className = "v865-side-card v865-weekly-card v90-weekly-card"; article.setAttribute("aria-live", "polite"); return article; }
  function miniShell() { var article = document.createElement("article"); article.id = "expMiniLeaderboard"; article.className = "v865-side-card v90-mini-board"; article.setAttribute("aria-live", "polite"); article.innerHTML = '<div class="v90-mini-head"><div><h3>👑 Bảng xếp hạng</h3><p>Top học viên tuần này</p></div><button type="button" data-exp-open-all>Xem tất cả ›</button></div><div id="expMiniList" class="v90-mini-list"><div class="v90-side-state">Đang tải bảng xếp hạng…</div></div>'; return article; }
  function ensureLayout() {
    scheduled = false;
    if (applying) return;
    var sidebar = byId("v865HomeSidebar"); if (!sidebar) return;
    applying = true; if (observer) observer.disconnect();
    try {
      var streak = sidebar.querySelector(".v865-streak-card"); if (streak) streak.remove();
      var account = byId("expHomeAccount"); if (!account) account = accountShell();
      var weekly = byId("expWeeklyMissions");
      if (!weekly) weekly = weeklyShell(sidebar.querySelector(".v865-weekly-card"));
      else if (weekly.parentNode !== sidebar) weekly = weeklyShell(sidebar.querySelector(".v865-weekly-card"));
      var mini = byId("expMiniLeaderboard"); if (!mini) mini = miniShell();
      var continueCard = sidebar.querySelector(".v865-continue-card");
      sidebar.appendChild(account); sidebar.appendChild(weekly); sidebar.appendChild(mini); if (continueCard) sidebar.appendChild(continueCard);
      renderAccount(currentTotal); renderMissions(currentMissions);
    } finally {
      applying = false;
      if (observer && document.body) observer.observe(document.body, { childList: true, subtree: true });
    }
  }
  function scheduleLayout() { if (scheduled) return; scheduled = true; requestAnimationFrame(ensureLayout); }
  function renderAccount(total) {
    var host = byId("expHomeAccount"); if (!host) return;
    var session = core.session();
    if (!session || !session.user) {
      host.className = "v865-side-card v90-account-card is-guest";
      host.innerHTML = '<div class="v90-account-guest"><span class="v90-account-login-icon">✦</span><div><strong>Đăng nhập để lưu EXP</strong><p>Tham gia bảng xếp hạng và nhận thưởng nhiệm vụ tuần.</p></div><button type="button" data-exp-login>Đăng nhập Google</button></div>';
      accountInitialized = false; return;
    }
    var meta = core.userMeta(session.user), level = core.calculateUserLevel(total);
    host.className = "v865-side-card v90-account-card";
    host.innerHTML = '<div class="v90-account-top">' + avatarMarkup(meta.name, meta.avatar, "v90-user-avatar") + '<div class="v90-account-name"><strong title="' + core.escapeHtml(meta.name) + '">' + core.escapeHtml(meta.name) + '</strong><span>Level ' + level.level + '</span></div></div><div class="v90-account-exp"><strong>' + core.formatEXP(level.totalEXP) + '</strong><span>' + core.formatNumber(level.currentLevelEXP) + ' / ' + core.formatNumber(level.expRequired) + ' EXP</span></div><div class="v90-level-progress" role="progressbar" aria-label="Tiến độ tới Level ' + (level.level + 1) + '" aria-valuemin="0" aria-valuemax="' + level.expRequired + '" aria-valuenow="' + level.currentLevelEXP + '"><i style="width:' + (accountInitialized ? level.progressPercent : 0) + '%" data-level-progress="' + level.progressPercent + '"></i></div>';
    requestAnimationFrame(function () { var bar = host.querySelector("[data-level-progress]"); if (bar) bar.style.width = bar.getAttribute("data-level-progress") + "%"; });
    accountInitialized = true;
  }
  function missionIcon(code) { return code === "study_5_days" ? "📖" : code === "review_10_words" ? "↻" : "✓"; }
  function renderMissions(rows, error) {
    var host = byId("expWeeklyMissions"); if (!host) return;
    if (error) { host.innerHTML = '<div class="v865-card-heading"><span class="v865-heading-icon">🎁</span><h3>Nhiệm vụ tuần</h3></div><div class="v90-side-state is-error">Không tải được nhiệm vụ tuần.<small>Cần chạy migration Supabase v90.</small></div>'; return; }
    var session = core.session();
    var defaults = [
      { mission_code: "study_5_days", title: "Học đủ 5 ngày", reward_exp: 100, current_value: 0, target_value: 5, completed: false, claimed: false },
      { mission_code: "review_10_words", title: "Ôn 10 từ vựng", reward_exp: 50, current_value: 0, target_value: 10, completed: false, claimed: false },
      { mission_code: "complete_quiz", title: "Làm 1 bài kiểm tra", reward_exp: 50, current_value: 0, target_value: 1, completed: false, claimed: false }
    ];
    var list = rows && rows.length ? rows : defaults;
    var html = list.map(function (mission) {
      var current = Math.min(Number(mission.current_value || 0), Number(mission.target_value || 1));
      var target = Number(mission.target_value || 1), percent = Math.min(100, Math.round(current / target * 100));
      var reward = mission.claimed ? "✓ Đã nhận +" + mission.reward_exp + " EXP" : "⚡ +" + mission.reward_exp + " EXP";
      return '<div class="v90-mission' + (mission.completed ? " is-complete" : "") + (mission.claimed ? " is-claimed" : "") + '"><span class="v90-mission-icon">' + missionIcon(mission.mission_code) + '</span><div class="v90-mission-body"><div class="v90-mission-title"><strong>' + core.escapeHtml(mission.title) + '</strong><span class="v90-mission-reward">' + core.escapeHtml(reward) + '</span></div><div class="v90-mission-progress-line"><div class="v90-mission-track"><i style="width:' + percent + '%"></i></div><b>' + current + '/' + target + '</b></div></div></div>';
    }).join("");
    host.innerHTML = '<div class="v865-card-heading"><span class="v865-heading-icon">🎁</span><h3>Nhiệm vụ tuần</h3></div><div class="v90-mission-list">' + html + '</div><p class="v90-weekly-note">' + (session && session.user ? "Hoàn thành nhiệm vụ để nhận EXP và tăng Level." : "Đăng nhập để lưu tiến độ và nhận EXP nhiệm vụ.") + '</p>';
  }
  function refreshAccount() {
    var session = core.session(); if (!session || !session.user) { currentTotal = 0; renderAccount(0); return Promise.resolve(0); }
    return root.VDuckieEXP.getCurrentUserEXP().then(function (total) { currentTotal = Number(total || 0); renderAccount(currentTotal); return currentTotal; });
  }
  function renderMini(rows, mine, error) {
    var host = byId("expMiniList"); if (!host) return;
    if (error) { host.innerHTML = '<div class="v90-side-state is-error">Không tải được bảng xếp hạng.<small>Cần migration Supabase v90.</small></div>'; return; }
    if (!rows.length) { host.innerHTML = '<div class="v90-side-state">Chưa có dữ liệu EXP tuần này.</div>'; return; }
    host.innerHTML = rows.map(function (row) {
      var rank = Number(row.rank || 0), level = core.calculateUserLevel(row.total_exp), isMe = mine && rank === Number(mine.rank);
      return '<div class="v90-mini-row rank-' + rank + (isMe ? " is-me" : "") + '"><span class="v90-mini-rank">' + rank + '</span>' + avatarMarkup(row.display_name, row.avatar_url, "v90-mini-avatar") + '<span class="v90-mini-person"><strong title="' + core.escapeHtml(row.display_name) + '">' + core.escapeHtml(row.display_name) + '</strong><small>Level ' + level.level + '</small></span><span class="v90-mini-exp">' + core.formatNumber(row.period_exp) + '<small> EXP</small></span>' + (rank === 1 ? '<span class="v90-mini-crown" aria-hidden="true">♛</span>' : "") + '</div>';
    }).join("");
  }
  function refreshMini() {
    var host = byId("expMiniList"); if (host) host.innerHTML = '<div class="v90-side-state">Đang tải bảng xếp hạng…</div>';
    var client = core.client(); if (!client) { renderMini([], null, new Error("not configured")); return Promise.resolve([]); }
    var request = ++miniRequest, session = core.session();
    return Promise.all([client.rpc("get_leaderboard", { p_period: "week", p_limit: 5 }), session && session.user ? client.rpc("get_my_rank", { p_period: "week" }) : Promise.resolve({ data: null, error: null })]).then(function (results) {
      if (request !== miniRequest) return [];
      if (results[0].error) throw results[0].error; if (results[1].error) throw results[1].error;
      var rows = (results[0].data || []).map(root.VDuckieEXPBoard.normalize);
      var mine = Array.isArray(results[1].data) ? results[1].data[0] : results[1].data;
      renderMini(rows, mine, null); return rows;
    }).catch(function (error) { console.error("Mini leaderboard failed", error); renderMini([], null, error); return []; });
  }
  function refreshMissions() {
    var session = core.session(); if (!session || !session.user) { currentMissions = []; renderMissions([]); return Promise.resolve([]); }
    renderMissions(currentMissions);
    return root.VDuckieWeeklyMissions.refresh().then(function (rows) { currentMissions = rows || []; renderMissions(currentMissions); return currentMissions; });
  }
  function bind() {
    document.addEventListener("click", function (event) { if (event.target.closest && event.target.closest("[data-exp-open-all]")) { if (root.VDuckieEXPUI) root.VDuckieEXPUI.openLeaderboard("week"); } });
    document.addEventListener("vduckie:my-exp-loaded", function (event) { currentTotal = Number(event.detail && event.detail.totalEXP || 0); renderAccount(currentTotal); });
    document.addEventListener("vduckie:weekly-missions-updated", function (event) { currentMissions = event.detail && event.detail.missions || []; renderMissions(currentMissions, event.detail && event.detail.error); });
    document.addEventListener("vduckie:mini-leaderboard-refresh", refreshMini);
    document.addEventListener("vduckie:exp-updated", function () { refreshAccount(); refreshMini(); });
  }
  function init() {
    bind(); scheduleLayout();
    core.onSession(function (session) {
      scheduleLayout();
      if (session && session.user) core.syncProfile().then(function () { return Promise.all([refreshAccount(), refreshMissions(), refreshMini()]); });
      else { currentTotal = 0; currentMissions = []; renderAccount(0); renderMissions([]); refreshMini(); }
    });
    if (root.MutationObserver && document.body) { observer = new MutationObserver(scheduleLayout); observer.observe(document.body, { childList: true, subtree: true }); }
  }
  root.VDuckieHomeEXP90 = Object.freeze({ refreshAccount: refreshAccount, refreshMissions: refreshMissions, refreshMini: refreshMini, ensureLayout: ensureLayout });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(window, document);
