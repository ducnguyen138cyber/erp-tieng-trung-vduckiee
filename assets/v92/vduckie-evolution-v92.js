(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_EVOLUTION_V92__) return;
  root.__VDUCKIE_EVOLUTION_V92__ = true;

  var store = root.VDuckieProgressStore;
  var manifest = root.VDuckieEvolutionManifest || [];
  var card = null;
  var overlay = null;
  var journeyHost = null;
  var wardrobeHost = null;
  var observer = null;
  var scheduled = false;
  var snapshot = null;
  var previousLevel = null;
  var animationTimer = null;
  var lastFocus = null;
  var unsubscribe = null;

  function byId(id) { return document.getElementById(id); }
  function esc(value) {
    var core = root.VDuckieEXPCore;
    return core && core.escapeHtml ? core.escapeHtml(value) : String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function format(value) {
    var core = root.VDuckieEXPCore;
    return core && core.formatNumber ? core.formatNumber(value) : String(Math.max(0, Number(value || 0)));
  }
  function stageFor(level) {
    var stageLevel = Math.max(1, Math.min(10, Number(level || 1)));
    return manifest[stageLevel - 1] || manifest[0];
  }
  function eggState(progressPercent) {
    var progress = Math.max(0, Math.min(100, Number(progressPercent || 0)));
    return progress < 34 ? "intact" : progress < 67 ? "cracked" : "hatching";
  }
  function nextStage(level) {
    return Number(level || 1) >= 10 ? null : stageFor(Number(level || 1) + 1);
  }
  function mascotMarkup(stage, progressPercent, compact) {
    var egg = stage.level === 1;
    var state = eggState(progressPercent);
    var classes = "v92-mascot v92-stage-" + stage.level + (egg ? " is-egg egg-" + state : "") + (compact ? " is-compact" : "");
    var visual = egg ? '<span class="v92-egg-shell" aria-hidden="true"><i></i><b></b></span>' :
      '<img src="' + esc(stage.asset) + '" alt="' + esc(stage.name) + '" loading="lazy" decoding="async"><span class="v92-stage-symbol" aria-hidden="true">' + esc(stage.symbol) + '</span>';
    return '<button type="button" class="' + classes + '" data-v92-thought aria-label="VDuckie Level ' + stage.level + ': ' + esc(stage.name) + '. Chạm để xem suy nghĩ">' +
      visual + '<span class="v92-thought-bubble" role="status">' + esc(stage.thought) + '</span></button>';
  }
  function nextRewardText(current) {
    var next = nextStage(current.level);
    return next ? "Level " + next.level + ": " + next.reward : "Đã đạt hình thái Grandmaster cao nhất";
  }
  function cardMarkup(current) {
    var stage = stageFor(current.level);
    var guest = !current.authenticated ? '<span class="v92-guest-note">Đăng nhập Google để EXP được đồng bộ.</span>' : "";
    return '<div class="v92-evolution-copy"><span class="v92-kicker">VDUCKIE EVOLUTION</span><h2>VDuckie của bạn</h2><p>Linh vật phản ánh trực tiếp Level và EXP hiện tại của website.</p>' +
      '<div class="v92-level-line"><strong>Level ' + current.level + '</strong><span>' + format(current.totalEXP) + ' EXP</span></div>' +
      '<div class="v92-progress" role="progressbar" aria-label="Tiến độ Level ' + current.level + '" aria-valuemin="0" aria-valuemax="' + current.expRequired + '" aria-valuenow="' + current.currentLevelEXP + '"><i style="width:' + current.progressPercent + '%"></i></div>' +
      '<div class="v92-progress-meta"><span>' + format(current.currentLevelEXP) + ' / ' + format(current.expRequired) + ' EXP trong level</span><span>Còn ' + format(current.expRemaining) + ' EXP</span></div>' +
      '<div class="v92-next-reward"><span>Phần thưởng tiếp theo</span><strong>' + esc(nextRewardText(current)) + '</strong></div>' + guest +
      '<div class="v92-actions"><button type="button" data-v92-open="journey">Xem hành trình</button><button type="button" data-v92-open="wardrobe"' + (current.level < 7 ? ' aria-describedby="v92WardrobeHint"' : '') + '>Tủ đồ' + (current.level < 7 ? ' · Khóa' : '') + '</button></div>' +
      (current.level < 7 ? '<small id="v92WardrobeHint">Tủ đồ mở ở Level 7.</small>' : '') + '</div>' +
      '<div class="v92-evolution-visual">' + mascotMarkup(stage, current.progressPercent, false) + '<span class="v92-stage-name">' + esc(stage.name) + '</span></div>';
  }
  function journeyMarkup(current) {
    return manifest.map(function (stage) {
      var unlocked = current.level >= stage.level;
      var isCurrent = Math.min(current.level, 10) === stage.level;
      return '<article class="v92-stage-card' + (unlocked ? ' is-unlocked' : ' is-locked') + (isCurrent ? ' is-current' : '') + '">' +
        '<div class="v92-stage-card-visual">' + mascotMarkup(stage, stage.level === 1 && current.level === 1 ? current.progressPercent : 0, true) + '</div>' +
        '<div><span>LV' + stage.level + '</span><h3>' + esc(stage.name) + '</h3><p>' + esc(stage.condition) + '</p><strong>' + esc(stage.reward) + '</strong></div>' +
        '<i aria-hidden="true">' + (unlocked ? '✓' : '🔒') + '</i></article>';
    }).join("");
  }
  function wardrobeMarkup(current) {
    if (current.level < 7) {
      return '<div class="v92-wardrobe-locked"><span aria-hidden="true">🔒</span><h3>Tủ đồ mở ở Level 7</h3><p>Tiếp tục học để mở trang phục, phụ kiện và nền cho VDuckie. Không có XP riêng cho Tủ đồ.</p></div>';
    }
    return '<div class="v92-wardrobe-grid"><section><h3>Trang phục</h3><button type="button" class="is-selected">Mặc định</button><button type="button" disabled>Slot mới</button><button type="button" disabled>Slot mới</button></section>' +
      '<section><h3>Phụ kiện</h3><button type="button" class="is-selected">Không dùng</button><button type="button" disabled>Slot mới</button><button type="button" disabled>Slot mới</button></section>' +
      '<section><h3>Nền</h3><button type="button" class="is-selected">Mặc định</button><button type="button" disabled>Slot mới</button><button type="button" disabled>Slot mới</button></section></div>' +
      '<p class="v92-framework-note">Framework Tủ đồ đã sẵn sàng. Chưa tạo bảng Supabase vì hiện chưa có item tùy biến cần đồng bộ.</p>';
  }
  function ensureOverlay() {
    if (overlay && overlay.isConnected) return;
    overlay = document.createElement("div");
    overlay.id = "v92EvolutionOverlay";
    overlay.className = "v92-overlay";
    overlay.hidden = true;
    overlay.innerHTML = '<section class="v92-dialog" role="dialog" aria-modal="true" aria-labelledby="v92DialogTitle"><header><div><span class="v92-kicker">VDUCKIE EVOLUTION</span><h2 id="v92DialogTitle">Hành trình tiến hóa</h2></div><button type="button" class="v92-close" data-v92-close aria-label="Đóng">×</button></header><nav class="v92-tabs" aria-label="VDuckie Evolution"><button type="button" class="active" data-v92-tab="journey">Hành trình</button><button type="button" data-v92-tab="wardrobe">Tủ đồ</button></nav><div class="v92-dialog-body"><div id="v92Journey" class="v92-journey-grid"></div><div id="v92Wardrobe" class="v92-wardrobe" hidden></div></div></section>';
    document.body.appendChild(overlay);
    journeyHost = byId("v92Journey");
    wardrobeHost = byId("v92Wardrobe");
  }
  function renderOverlay(current) {
    ensureOverlay();
    journeyHost.innerHTML = journeyMarkup(current);
    wardrobeHost.innerHTML = wardrobeMarkup(current);
  }
  function setTab(name) {
    if (!overlay) return;
    var wardrobe = name === "wardrobe";
    journeyHost.hidden = wardrobe;
    wardrobeHost.hidden = !wardrobe;
    Array.prototype.forEach.call(overlay.querySelectorAll("[data-v92-tab]"), function (button) {
      button.classList.toggle("active", button.getAttribute("data-v92-tab") === name);
    });
    byId("v92DialogTitle").textContent = wardrobe ? "Tủ đồ VDuckie" : "Hành trình tiến hóa";
  }
  function openOverlay(tab) {
    if (!snapshot) return;
    renderOverlay(snapshot);
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("v92-modal-open");
    setTab(tab === "wardrobe" ? "wardrobe" : "journey");
    var close = overlay.querySelector("[data-v92-close]");
    if (close) close.focus();
  }
  function closeOverlay() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.body.classList.remove("v92-modal-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function findHomeHost() {
    return byId("v865HomeMain") || document.querySelector(".v865-home-main") || byId("homeHub");
  }
  function ensureCard() {
    scheduled = false;
    var host = findHomeHost();
    if (!host || !snapshot) return;
    if (!card || !card.isConnected) {
      card = document.createElement("article");
      card.id = "v92EvolutionCard";
      card.className = "v92-evolution-card";
      card.setAttribute("aria-live", "polite");
    }
    if (card.parentNode !== host) host.insertBefore(card, host.firstChild);
    card.innerHTML = cardMarkup(snapshot);
  }
  function scheduleCard() {
    if (scheduled) return;
    scheduled = true;
    root.requestAnimationFrame(ensureCard);
  }
  function play(name) {
    if (!card) return;
    clearTimeout(animationTimer);
    card.classList.remove("is-level-up", "is-success", "is-sad");
    void card.offsetWidth;
    card.classList.add("is-" + name);
    animationTimer = root.setTimeout(function () { if (card) card.classList.remove("is-" + name); }, name === "level-up" ? 1100 : 700);
  }
  function onProgress(next) {
    var oldLevel = previousLevel;
    snapshot = next;
    previousLevel = next.level;
    scheduleCard();
    if (overlay && !overlay.hidden) renderOverlay(next);
    if (oldLevel !== null && next.level > oldLevel) root.setTimeout(function () { play("level-up"); }, 40);
  }
  function thoughtToggle(button) {
    if (!button) return;
    var active = button.classList.toggle("is-thinking");
    button.setAttribute("aria-expanded", active ? "true" : "false");
  }
  function bind() {
    document.addEventListener("click", function (event) {
      var open = event.target.closest && event.target.closest("[data-v92-open]");
      if (open) { openOverlay(open.getAttribute("data-v92-open")); return; }
      var close = event.target.closest && event.target.closest("[data-v92-close]");
      if (close || (overlay && event.target === overlay)) { closeOverlay(); return; }
      var tab = event.target.closest && event.target.closest("[data-v92-tab]");
      if (tab) { setTab(tab.getAttribute("data-v92-tab")); return; }
      var mascot = event.target.closest && event.target.closest("[data-v92-thought]");
      if (mascot) thoughtToggle(mascot);
    });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") closeOverlay(); });
    document.addEventListener("vduckie:exp-updated", function (event) {
      if (event.detail && event.detail.awarded) root.setTimeout(function () { play("success"); }, 90);
    });
    document.addEventListener("vduckie:evolution-success", function () { play("success"); });
    document.addEventListener("vduckie:evolution-sad", function () { play("sad"); });
  }
  function init() {
    if (!store || !manifest.length) return;
    ensureOverlay();
    bind();
    unsubscribe = store.subscribe(onProgress);
    snapshot = store.getSnapshot();
    previousLevel = snapshot.level;
    scheduleCard();
    if (root.MutationObserver && document.body) {
      observer = new MutationObserver(function () {
        if (!card || !card.isConnected || card.parentNode !== findHomeHost()) scheduleCard();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  root.VDuckieEvolution = Object.freeze({
    open: openOverlay,
    close: closeOverlay,
    play: play,
    getStage: function () { return stageFor((snapshot || store.getSnapshot()).level); },
    destroy: function () {
      if (unsubscribe) unsubscribe();
      unsubscribe = null;
      if (observer) observer.disconnect();
      observer = null;
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})(window, document);
