(function (root, document) {
  "use strict";
  var core = root.VDuckieEXPCore;
  var period = "week";
  var requestNumber = 0;
  function byId(id) { return document.getElementById(id); }
  function avatar(name, url) {
    if (url) return '<span class="exp-avatar"><img src="' + core.escapeHtml(url) + '" alt="" referrerpolicy="no-referrer"></span>';
    return '<span class="exp-avatar" aria-hidden="true">' + core.escapeHtml(core.initials(name)) + "</span>";
  }
  function podium(rows) {
    var host = byId("expPodium"); if (!host) return;
    var medals = ["🥇", "🥈", "🥉"], html = "";
    for (var index = 0; index < 3; index++) {
      var row = rows[index];
      if (!row) html += '<article class="exp-podium-card rank-' + (index + 1) + '"><span class="exp-medal">' + medals[index] + '</span><span class="exp-avatar">?</span><strong>Chưa có người học</strong><small>0 EXP</small></article>';
      else html += '<article class="exp-podium-card rank-' + (index + 1) + '"><span class="exp-medal">' + medals[index] + "</span>" + avatar(row.display_name, row.avatar_url) + "<strong>" + core.escapeHtml(row.display_name) + "</strong><small>" + core.escapeHtml(core.formatEXP(row.exp)) + "</small></article>";
    }
    host.innerHTML = html;
  }
  function rows(rowsData, myRank) {
    var host = byId("expLeaderboardList"); if (!host) return;
    if (!rowsData.length) { host.innerHTML = '<div class="exp-state"><strong>Chưa có dữ liệu EXP</strong>Hãy hoàn thành bài học đầu tiên để xuất hiện ở đây.</div>'; return; }
    var html = "";
    for (var index = 0; index < rowsData.length; index++) {
      var row = rowsData[index], mine = myRank && Number(row.rank) === Number(myRank.rank);
      html += '<div class="exp-row' + (mine ? " is-me" : "") + '"><span class="exp-rank">#' + core.escapeHtml(row.rank) + "</span>" + avatar(row.display_name, row.avatar_url) + '<span class="exp-name">' + core.escapeHtml(row.display_name) + '</span><span class="exp-points">' + core.escapeHtml(core.formatEXP(row.exp)) + "</span></div>";
    }
    host.innerHTML = html;
  }
  function ownRank(row, rowsData) {
    var host = byId("expMyRank"), session = core.session(); if (!host) return;
    if (!session || !session.user || !row || rowsData.some(function (item) { return Number(item.rank) === Number(row.rank); })) { host.innerHTML = ""; return; }
    host.innerHTML = '<div class="exp-my-rank"><strong>Hạng của bạn: #' + core.escapeHtml(row.rank) + '</strong><span>' + core.escapeHtml(core.formatEXP(row.exp)) + "</span></div>";
  }
  function refresh(nextPeriod) {
    period = nextPeriod || period;
    var own = byId("expMyRank"); if (own) own.innerHTML = "";
    var tabs = document.querySelectorAll("[data-exp-period]");
    for (var index = 0; index < tabs.length; index++) tabs[index].classList.toggle("active", tabs[index].getAttribute("data-exp-period") === period);
    var host = byId("expLeaderboardList"), client = core.client(), session = core.session();
    if (host) host.innerHTML = '<div class="exp-state">Đang tải bảng xếp hạng…</div>';
    var requestId = ++requestNumber;
    if (!client) { if (host) host.innerHTML = '<div class="exp-state"><strong>Chưa kết nối Supabase</strong>Không thể tải bảng xếp hạng.</div>'; return Promise.resolve(); }
    return Promise.all([
      client.rpc("get_leaderboard", { p_period: period, p_limit: 100 }),
      session && session.user ? client.rpc("get_my_rank", { p_period: period }) : Promise.resolve({ data: null, error: null })
    ]).then(function (results) {
      if (requestId !== requestNumber) return;
      if (results[0].error) throw results[0].error;
      if (results[1].error) throw results[1].error;
      var list = results[0].data || [], mine = Array.isArray(results[1].data) ? results[1].data[0] : results[1].data;
      podium(list); rows(list, mine); ownRank(mine, list);
    }).catch(function (error) {
      console.error("Leaderboard failed", error); podium([]);
      if (host) host.innerHTML = '<div class="exp-state"><strong>Không tải được bảng xếp hạng</strong>' + (/function|schema cache|relation/i.test(String(error.message || error)) ? "Cần chạy migration Supabase trước." : "Hãy kiểm tra kết nối và thử lại.") + "</div>";
    });
  }
  root.VDuckieEXPBoard = { refresh: refresh, period: function () { return period; } };
})(window, document);
