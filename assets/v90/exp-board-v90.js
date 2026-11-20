(function (root, document) {
  "use strict";

  var core = root.VDuckieEXPCore;
  var period = "total";
  var requestNumber = 0;
  var snapshot = null, pending = null, renderedKey = null;
  function userKey() { var session = core.session(); return session && session.user ? session.user.id : "guest"; }
  function invalidate() { snapshot = null; pending = null; }
  // One snapshot for Top 5, podium, list and own rank. Never mix identities.
  function load(force) {
    var key = userKey();
    if (pending && pending.key === key) return pending.promise;
    if (!force && snapshot && snapshot.key === key && Date.now() - snapshot.at < 15000) return Promise.resolve(snapshot);
    var client = core.client(), session = core.session();
    if (!client) return Promise.reject(new Error("not configured"));
    var task = { key: key };
    task.promise = Promise.all([
      client.rpc("get_leaderboard", { p_period: "total", p_limit: 100 }),
      session && session.user ? client.rpc("get_my_rank", { p_period: "total" }) : Promise.resolve({ data: null, error: null })
    ]).then(function (results) {
      if (results[0].error) throw results[0].error;
      if (results[1].error) throw results[1].error;
      var mine = Array.isArray(results[1].data) ? results[1].data[0] : results[1].data;
      var value = { key: key, at: Date.now(), rows: (results[0].data || []).map(normalize), mine: mine ? normalize(mine) : null };
      if (pending === task && userKey() === key) snapshot = value;
      return value;
    }).finally(function () { if (pending === task) pending = null; });
    pending = task;
    return task.promise;
  }
  document.addEventListener("vduckie:exp-updated", invalidate);

  function byId(id) { return document.getElementById(id); }
  function avatar(name, url, className) {
    var classes = "exp-avatar" + (className ? " " + className : "");
    if (url) return '<span class="' + classes + '"><img src="' + core.escapeHtml(url) + '" alt="" referrerpolicy="no-referrer"></span>';
    return '<span class="' + classes + '" aria-hidden="true">' + core.escapeHtml(core.initials(name)) + "</span>";
  }
  function normalize(row) {
    if (!row) return null;
    if (row.period_exp == null || row.total_exp == null) throw new Error("Supabase migration v90 is required: leaderboard totals are missing");
    return {
      rank: Number(row.rank || 0),
      display_name: String(row.display_name || "Người học"),
      avatar_url: String(row.avatar_url || ""),
      period_exp: Number(row.period_exp || 0),
      total_exp: Number(row.total_exp || 0)
    };
  }
  function levelText(total) { return "Level " + core.calculateUserLevel(total).level; }
  function loadingPodium() {
    var host = byId("expPodium"); if (!host) return;
    host.innerHTML = [1,2,3].map(function(rank) {
      return '<article class="exp-podium-card exp-podium-loading rank-' + rank + '" aria-hidden="true"><span class="exp-medal">&nbsp;</span><span class="exp-avatar">&nbsp;</span><strong>&nbsp;</strong><small>&nbsp;</small><b>&nbsp;</b></article>';
    }).join("");
  }
  function podium(rows) {
    var host = byId("expPodium"); if (!host) return;
    var medals = ["🥇", "🥈", "🥉"], html = "";
    for (var index = 0; index < 3; index += 1) {
      var row = rows[index];
      if (!row) html += '<article class="exp-podium-card rank-' + (index + 1) + '"><span class="exp-medal">' + medals[index] + '</span><span class="exp-avatar">?</span><strong>Chưa có người học</strong><small>Level 1</small><b>0 EXP</b></article>';
      else html += '<article class="exp-podium-card rank-' + (index + 1) + '"><span class="exp-medal">' + medals[index] + '</span>' + avatar(row.display_name, row.avatar_url) + '<strong>' + core.escapeHtml(row.display_name) + '</strong><small>' + levelText(row.total_exp) + '</small><b>' + core.escapeHtml(core.formatEXP(row.total_exp)) + '</b></article>';
    }
    if (host.innerHTML !== html) host.innerHTML = html;
  }
  function rows(rowsData, myRank) {
    var host = byId("expLeaderboardList"); if (!host) return;
    if (!rowsData.length) { host.innerHTML = '<div class="exp-state"><strong>Chưa có dữ liệu EXP</strong>Hãy hoàn thành bài học đầu tiên để xuất hiện ở đây.</div>'; return; }
    var noEXP=rowsData.every(function(row){return row.total_exp===0;});
    var note=noEXP?'<div class="exp-state exp-zero-explained"><strong>Chưa ai nhận EXP</strong>Đăng nhập để xem EXP và theo dõi tiến độ học của bạn.</div>':'';
    host.innerHTML = note+rowsData.map(function (row) {
      var mine = myRank && Number(row.rank) === Number(myRank.rank);
      return '<div class="exp-row' + (mine ? " is-me" : "") + '"><span class="exp-rank">#' + core.escapeHtml(row.rank) + '</span>' + avatar(row.display_name, row.avatar_url) + '<span class="exp-person"><span class="exp-name">' + core.escapeHtml(row.display_name) + '</span><small>' + levelText(row.total_exp) + '</small></span><span class="exp-points">' + core.escapeHtml(core.formatEXP(row.total_exp)) + '</span></div>';
    }).join("");
  }
  function ownRank(row, rowsData) {
    var host = byId("expMyRank"), session = core.session(); if (!host) return;
    if (!session || !session.user || !row || rowsData.some(function (item) { return Number(item.rank) === Number(row.rank); })) { host.innerHTML = ""; return; }
    host.innerHTML = '<div class="exp-my-rank"><div><strong>Hạng của bạn: #' + core.escapeHtml(row.rank || "—") + '</strong><small>' + levelText(Number(row.total_exp || 0)) + '</small></div><span>' + core.escapeHtml(core.formatEXP(row.total_exp || 0)) + ' tổng</span></div>';
  }
  function refresh() {
    // Rank on the server across all transactions, including callers from older routes.
    period = "total";
    var tabs = document.querySelectorAll("[data-exp-period]");
    Array.prototype.forEach.call(tabs, function (tab) { var active = tab.getAttribute("data-exp-period") === period; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", active ? "true" : "false"); });
    var host = byId("expLeaderboardList"), key = userKey();
    var requestId = ++requestNumber;
    var board = byId("leaderboard");
    if (board) board.setAttribute("aria-busy", "true");
    // Keep confirmed content during same-account revalidation. Initial space is reserved in CSS.
    if (renderedKey !== key) {
      var pod = byId("expPodium"), own = byId("expMyRank");
      if (pod) loadingPodium();
      if (own) own.innerHTML = "";
      if (host) host.innerHTML = '<div class="exp-state">Đang tải bảng xếp hạng…</div>';
    }
    return load(arguments[0] === true).then(function (value) {
      if (requestId !== requestNumber || userKey() !== key) return [];
      var list = value.rows, mine = value.mine;
      podium(list); rows(list, mine); ownRank(mine, list); renderedKey = key;
      document.dispatchEvent(new CustomEvent("vduckie:leaderboard-updated", { detail: { period: period, rows: list, myRank: mine } }));
      return list;
    }).catch(function (error) {
      if (requestId !== requestNumber || userKey() !== key) return [];
      console.error("Leaderboard failed", error);
      var pod = byId("expPodium"); if (pod) loadingPodium();
      if (host) host.innerHTML = '<div class="exp-state"><strong>Không tải được bảng xếp hạng</strong>' + (/migration v90|function|schema cache|relation|period_exp|total_exp/i.test(String(error.message || error)) ? "Hãy thử lại sau ít phút." : "Hãy kiểm tra kết nối và thử lại.") + '<button type="button" data-exp-retry-board>Thử lại</button></div>';
      return [];
    }).finally(function () { if (board && requestId === requestNumber) board.setAttribute("aria-busy", "false"); });
  }
  root.VDuckieEXPBoard = { refresh: refresh, load: load, invalidate: invalidate, period: function () { return period; }, normalize: normalize };
})(window, document);
