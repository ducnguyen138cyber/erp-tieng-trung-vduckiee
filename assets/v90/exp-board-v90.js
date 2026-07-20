(function (root, document) {
  "use strict";

  var core = root.VDuckieEXPCore;
  var period = "week";
  var requestNumber = 0;

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
  function periodLabel(value) { return value === "month" ? "tháng này" : value === "total" ? "tổng EXP" : "tuần này"; }
  function podium(rows) {
    var host = byId("expPodium"); if (!host) return;
    var medals = ["🥇", "🥈", "🥉"], html = "";
    for (var index = 0; index < 3; index += 1) {
      var row = rows[index];
      if (!row) html += '<article class="exp-podium-card rank-' + (index + 1) + '"><span class="exp-medal">' + medals[index] + '</span><span class="exp-avatar">?</span><strong>Chưa có người học</strong><small>Level 1</small><b>0 EXP</b></article>';
      else html += '<article class="exp-podium-card rank-' + (index + 1) + '"><span class="exp-medal">' + medals[index] + '</span>' + avatar(row.display_name, row.avatar_url) + '<strong>' + core.escapeHtml(row.display_name) + '</strong><small>' + levelText(row.total_exp) + '</small><b>' + core.escapeHtml(core.formatEXP(row.period_exp)) + '</b></article>';
    }
    host.innerHTML = html;
  }
  function rows(rowsData, myRank) {
    var host = byId("expLeaderboardList"); if (!host) return;
    if (!rowsData.length) { host.innerHTML = '<div class="exp-state"><strong>Chưa có dữ liệu EXP</strong>Hãy hoàn thành bài học đầu tiên để xuất hiện ở đây.</div>'; return; }
    host.innerHTML = rowsData.map(function (row) {
      var mine = myRank && Number(row.rank) === Number(myRank.rank);
      return '<div class="exp-row' + (mine ? " is-me" : "") + '"><span class="exp-rank">#' + core.escapeHtml(row.rank) + '</span>' + avatar(row.display_name, row.avatar_url) + '<span class="exp-person"><span class="exp-name">' + core.escapeHtml(row.display_name) + '</span><small>' + levelText(row.total_exp) + '</small></span><span class="exp-points">' + core.escapeHtml(core.formatEXP(row.period_exp)) + '</span></div>';
    }).join("");
  }
  function ownRank(row, rowsData) {
    var host = byId("expMyRank"), session = core.session(); if (!host) return;
    if (!session || !session.user || !row || rowsData.some(function (item) { return Number(item.rank) === Number(row.rank); })) { host.innerHTML = ""; return; }
    host.innerHTML = '<div class="exp-my-rank"><div><strong>Hạng của bạn: #' + core.escapeHtml(row.rank || "—") + '</strong><small>' + levelText(Number(row.total_exp || 0)) + '</small></div><span>' + core.escapeHtml(core.formatEXP(row.period_exp || 0)) + ' ' + core.escapeHtml(periodLabel(period)) + '</span></div>';
  }
  function refresh(nextPeriod) {
    period = nextPeriod || period || "week";
    var tabs = document.querySelectorAll("[data-exp-period]");
    Array.prototype.forEach.call(tabs, function (tab) { var active = tab.getAttribute("data-exp-period") === period; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", active ? "true" : "false"); });
    var host = byId("expLeaderboardList"), client = core.client(), session = core.session();
    if (host) host.innerHTML = '<div class="exp-state">Đang tải bảng xếp hạng…</div>';
    var requestId = ++requestNumber;
    if (!client) { podium([]); if (host) host.innerHTML = '<div class="exp-state"><strong>Chưa kết nối Supabase</strong>Không thể tải bảng xếp hạng.</div>'; return Promise.resolve([]); }
    return Promise.all([
      client.rpc("get_leaderboard", { p_period: period, p_limit: 100 }),
      session && session.user ? client.rpc("get_my_rank", { p_period: period }) : Promise.resolve({ data: null, error: null })
    ]).then(function (results) {
      if (requestId !== requestNumber) return [];
      if (results[0].error) throw results[0].error;
      if (results[1].error) throw results[1].error;
      var list = (results[0].data || []).map(normalize);
      var rawMine = Array.isArray(results[1].data) ? results[1].data[0] : results[1].data;
      var mine = rawMine ? { rank: Number(rawMine.rank || 0), period_exp: Number(rawMine.period_exp || 0), total_exp: Number(rawMine.total_exp || 0) } : null;
      podium(list); rows(list, mine); ownRank(mine, list);
      document.dispatchEvent(new CustomEvent("vduckie:leaderboard-updated", { detail: { period: period, rows: list, myRank: mine } }));
      return list;
    }).catch(function (error) {
      console.error("Leaderboard failed", error); podium([]);
      if (host) host.innerHTML = '<div class="exp-state"><strong>Không tải được bảng xếp hạng</strong>' + (/migration v90|function|schema cache|relation|period_exp|total_exp/i.test(String(error.message || error)) ? "Cần chạy migration Supabase v90 trước." : "Hãy kiểm tra kết nối và thử lại.") + '</div>';
      return [];
    });
  }
  root.VDuckieEXPBoard = { refresh: refresh, period: function () { return period; }, normalize: normalize };
})(window, document);
