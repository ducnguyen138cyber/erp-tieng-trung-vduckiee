(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_EVOLUTION_V92__) return;
  root.__VDUCKIE_EVOLUTION_V92__ = true;

  var store = root.VDuckieProgressStore;
  var manifest = root.VDuckieEvolutionManifest || [];
  var core = root.VDuckieEXPCore;
  var DEVELOPER_EMAIL = "ducnguyenn138@gmail.com";
  var card = null;
  var overlay = null;
  var journeyHost = null;
  var wardrobeHost = null;
  var levelUpOverlay = null;
  var observer = null;
  var scheduled = false;
  var realSnapshot = null;
  var snapshot = null;
  var previousRealLevel = null;
  var animationTimer = null;
  var previewRestoreTimer = null;
  var lastFocus = null;
  var unsubscribe = null;
  var unsubscribeSession = null;
  var authorizedUserId = "";
  var authorizationRequest = 0;
  var developerBridge = null;
  var preview = {
    active: false,
    level: 1,
    eggProgress: 50,
    wardrobe: {
      skin: "default",
      glasses: "none",
      accessory: "none",
      background: "default",
      effect: "none"
    }
  };

  var wardrobeCatalog = Object.freeze({
    skin: Object.freeze([
      { id: "default", label: "Mặc định" },
      { id: "warm", label: "Vàng ấm" },
      { id: "cool", label: "Xanh ngọc" }
    ]),
    glasses: Object.freeze([
      { id: "none", label: "Không kính" },
      { id: "round", label: "Kính tròn" },
      { id: "square", label: "Kính vuông" }
    ]),
    accessory: Object.freeze([
      { id: "none", label: "Không dùng" },
      { id: "book", label: "Sách học" },
      { id: "laptop", label: "Laptop ERP" },
      { id: "tablet", label: "Tablet quản lý" }
    ]),
    background: Object.freeze([
      { id: "default", label: "Mặc định" },
      { id: "classroom", label: "Lớp học" },
      { id: "office", label: "Văn phòng" },
      { id: "master", label: "Master" }
    ]),
    effect: Object.freeze([
      { id: "none", label: "Không dùng" },
      { id: "sparkle", label: "Lấp lánh" },
      { id: "success", label: "Success" },
      { id: "glow", label: "Glow" }
    ])
  });

  function byId(id) { return document.getElementById(id); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value || 0))); }
  function normalizedEmail(value) { return String(value || "").trim().toLowerCase(); }
  function esc(value) {
    return core && core.escapeHtml ? core.escapeHtml(value) : String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function format(value) {
    return core && core.formatNumber ? core.formatNumber(value) : String(Math.max(0, Number(value || 0)));
  }
  function stageFor(level) {
    var stageLevel = clamp(level || 1, 1, 10);
    return manifest[stageLevel - 1] || manifest[0];
  }
  function eggState(progressPercent) {
    var progressValue = clamp(progressPercent, 0, 100);
    return progressValue < 34 ? "intact" : progressValue < 67 ? "cracked" : "hatching";
  }
  function nextStage(level) {
    return Number(level || 1) >= 10 ? null : stageFor(Number(level || 1) + 1);
  }
  function currentSession() {
    return core && typeof core.session === "function" ? core.session() : null;
  }
  function canUseDeveloper() {
    var session = currentSession();
    var user = session && session.user;
    return !!authorizedUserId && !!user && user.id === authorizedUserId && normalizedEmail(user.email) === DEVELOPER_EMAIL;
  }
  function defaultWardrobe() {
    return { skin: "default", glasses: "none", accessory: "none", background: "default", effect: "none" };
  }
  function wardrobeState() {
    return preview.active && canUseDeveloper() ? preview.wardrobe : defaultWardrobe();
  }
  function accessorySymbol(id) {
    return id === "book" ? "📖" : id === "laptop" ? "💻" : id === "tablet" ? "📱" : "";
  }
  function mascotMarkup(stage, progressPercent, compact) {
    var egg = stage.level === 1;
    var state = eggState(progressPercent);
    var outfit = wardrobeState();
    var classes = "v92-mascot v92-stage-" + stage.level +
      (egg ? " is-egg egg-" + state : "") +
      (compact ? " is-compact" : "") +
      " v93-skin-" + outfit.skin +
      " v93-bg-" + outfit.background +
      " v93-effect-" + outfit.effect;
    var visual = egg ?
      '<span class="v92-egg-shell" aria-hidden="true"><i></i><b></b></span>' :
      '<span class="v93-asset-fallback" aria-hidden="true">' + esc(stage.symbol) + '</span><img src="' + esc(stage.asset) + '" alt="' + esc(stage.name) + '" loading="lazy" decoding="async"><span class="v92-stage-symbol" aria-hidden="true">' + esc(stage.symbol) + '</span>';
    var decorations =
      '<span class="v93-glasses v93-glasses-' + outfit.glasses + '" aria-hidden="true"></span>' +
      '<span class="v93-accessory" aria-hidden="true">' + esc(accessorySymbol(outfit.accessory)) + '</span>' +
      '<span class="v93-effect-layer" aria-hidden="true">✦</span>';
    return '<button type="button" class="' + classes + '" data-v92-thought data-v93-glasses="' + esc(outfit.glasses) +
      '" data-v93-accessory="' + esc(outfit.accessory) + '" aria-label="VDuckie Level ' + stage.level + ': ' + esc(stage.name) + '. Chạm để xem suy nghĩ">' +
      visual + decorations + '<span class="v92-thought-bubble" role="status">' + esc(stage.thought) + '</span></button>';
  }
  function nextRewardText(current) {
    var next = nextStage(current.level);
    return next ? "Level " + next.level + ": " + next.reward : "Đã đạt hình thái Grandmaster cao nhất";
  }
  function buildPreviewSnapshot() {
    var base = realSnapshot || (store && store.getSnapshot ? store.getSnapshot() : null) || {
      authenticated: true,
      level: 1,
      totalEXP: 0,
      currentLevelEXP: 0,
      expRequired: 0,
      progressPercent: 0,
      expRemaining: 0
    };
    return Object.freeze({
      authenticated: base.authenticated,
      level: clamp(preview.level, 1, 10),
      totalEXP: Number(base.totalEXP || 0),
      currentLevelEXP: Number(base.currentLevelEXP || 0),
      expRequired: Number(base.expRequired || 0),
      progressPercent: preview.level === 1 ? clamp(preview.eggProgress, 0, 100) : 50,
      expRemaining: Number(base.expRemaining || 0),
      preview: true,
      realLevel: Number(base.level || 1),
      realProgressPercent: Number(base.progressPercent || 0)
    });
  }
  function refreshDisplaySnapshot() {
    snapshot = preview.active && canUseDeveloper() ? buildPreviewSnapshot() : realSnapshot;
    scheduleCard();
    if (overlay && !overlay.hidden && snapshot) renderOverlay(snapshot);
  }
  function cardMarkup(current) {
    var stage = stageFor(current.level);
    var developer = canUseDeveloper();
    var wardrobeUnlocked = developer || current.level >= 7;
    var guest = !current.authenticated ? '<span class="v92-guest-note">Đăng nhập Google để EXP được đồng bộ.</span>' : "";
    var previewBadge = current.preview ?
      '<span class="v93-preview-badge">Developer Preview · Level thật ' + current.realLevel + ' · EXP thật không đổi</span>' : "";
    var progressMeta = current.preview ?
      '<div class="v92-progress-meta"><span>' + format(current.progressPercent) + '% tiến độ hình thái preview</span><span>Level thật: ' + current.realLevel + '</span></div>' :
      '<div class="v92-progress-meta"><span>' + format(current.currentLevelEXP) + ' / ' + format(current.expRequired) + ' EXP trong level</span><span>Còn ' + format(current.expRemaining) + ' EXP</span></div>';
    var progressMax = current.preview ? 100 : current.expRequired;
    var progressNow = current.preview ? current.progressPercent : current.currentLevelEXP;
    return '<div class="v92-evolution-copy"><span class="v92-kicker">VDUCKIE EVOLUTION</span><h2>VDuckie của bạn</h2>' +
      previewBadge + '<p>' + (current.preview ? 'Đang ghi đè giao diện để kiểm thử. EXP và Level thật không bị thay đổi.' : 'Linh vật phản ánh trực tiếp Level và EXP hiện tại của website.') + '</p>' +
      '<div class="v92-level-line"><strong>Level ' + current.level + (current.preview ? ' · Preview' : '') + '</strong><span>' + (current.preview ? 'XP thật: ' : '') + format(current.totalEXP) + ' EXP</span></div>' +
      '<div class="v92-progress" role="progressbar" aria-label="Tiến độ Level ' + current.level + '" aria-valuemin="0" aria-valuemax="' + progressMax + '" aria-valuenow="' + progressNow + '"><i style="width:' + current.progressPercent + '%"></i></div>' +
      progressMeta +
      '<div class="v92-next-reward"><span>Phần thưởng tiếp theo</span><strong>' + esc(nextRewardText(current)) + '</strong></div>' + guest +
      '<div class="v92-actions"><button type="button" data-v92-open="journey">Xem hành trình</button><button type="button" data-v92-open="wardrobe"' +
      (!wardrobeUnlocked ? ' aria-describedby="v92WardrobeHint"' : '') + '>Tủ đồ' + (!wardrobeUnlocked ? ' · Khóa' : '') + '</button></div>' +
      (!wardrobeUnlocked ? '<small id="v92WardrobeHint">Tủ đồ mở ở Level 7.</small>' : '') + '</div>' +
      '<div class="v92-evolution-visual">' + mascotMarkup(stage, current.progressPercent, false) + '<span class="v92-stage-name">' + esc(stage.name) + '</span></div>';
  }
  function journeyMarkup(current) {
    var developer = canUseDeveloper();
    return manifest.map(function (stage) {
      var unlocked = developer || current.level >= stage.level;
      var isCurrent = Math.min(current.level, 10) === stage.level;
      var interactive = developer ? ' role="button" tabindex="0" data-v93-preview-level="' + stage.level + '"' : "";
      return '<article class="v92-stage-card' + (unlocked ? ' is-unlocked' : ' is-locked') + (isCurrent ? ' is-current' : '') +
        (developer ? ' is-developer-selectable' : '') + '"' + interactive + '>' +
        '<div class="v92-stage-card-visual">' + mascotMarkup(stage, stage.level === 1 && current.level === 1 ? current.progressPercent : 0, true) + '</div>' +
        '<div><span>LV' + stage.level + '</span><h3>' + esc(stage.name) + '</h3><p>' + esc(stage.condition) + '</p><strong>' + esc(stage.reward) + '</strong></div>' +
        '<i aria-hidden="true">' + (unlocked ? '✓' : '🔒') + '</i></article>';
    }).join("");
  }
  function catalogSection(group, title) {
    var items = wardrobeCatalog[group] || [];
    return '<section><h3>' + esc(title) + '</h3>' + items.map(function (item) {
      var selected = preview.wardrobe[group] === item.id;
      return '<button type="button" class="' + (selected ? 'is-selected' : '') + '" data-v93-wardrobe-group="' + esc(group) +
        '" data-v93-wardrobe-item="' + esc(item.id) + '">' + esc(item.label) + '</button>';
    }).join("") + '</section>';
  }
  function wardrobeMarkup(current) {
    if (canUseDeveloper()) {
      return '<div class="v92-wardrobe-grid v93-wardrobe-grid">' +
        catalogSection("skin", "Skin") +
        catalogSection("glasses", "Kính") +
        catalogSection("accessory", "Phụ kiện") +
        catalogSection("background", "Nền") +
        catalogSection("effect", "Hiệu ứng") +
        '</div><p class="v92-framework-note">Developer Preview: mọi lựa chọn chỉ tồn tại trong bộ nhớ của tab này, không ghi Supabase.</p>';
    }
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
  function ensureLevelUpOverlay() {
    if (levelUpOverlay && levelUpOverlay.isConnected) return;
    levelUpOverlay = document.createElement("div");
    levelUpOverlay.id = "v93LevelUpOverlay";
    levelUpOverlay.className = "v93-levelup-overlay";
    levelUpOverlay.hidden = true;
    levelUpOverlay.innerHTML = '<section class="v93-levelup-card" role="dialog" aria-modal="true" aria-labelledby="v93LevelUpTitle"><button type="button" data-v93-levelup-close aria-label="Đóng">×</button><div id="v93LevelUpVisual"></div><span>LEVEL UP PREVIEW</span><h2 id="v93LevelUpTitle"></h2><p id="v93LevelUpReward"></p></section>';
    document.body.appendChild(levelUpOverlay);
  }
  function showLevelUpModal() {
    if (!canUseDeveloper() || !snapshot) return false;
    ensureLevelUpOverlay();
    var stage = stageFor(snapshot.level);
    byId("v93LevelUpVisual").innerHTML = mascotMarkup(stage, snapshot.progressPercent, true);
    byId("v93LevelUpTitle").textContent = "Level " + stage.level + " · " + stage.name;
    byId("v93LevelUpReward").textContent = stage.reward;
    levelUpOverlay.hidden = false;
    return true;
  }
  function closeLevelUpModal() {
    if (levelUpOverlay) levelUpOverlay.hidden = true;
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
    ["level-up", "success", "sad", "hover", "glow", "egg-hatching"].forEach(function (item) {
      card.classList.remove("is-" + item);
    });
    void card.offsetWidth;
    card.classList.add("is-" + name);
    var duration = name === "level-up" || name === "egg-hatching" ? 1200 : name === "glow" ? 1500 : 750;
    animationTimer = root.setTimeout(function () { if (card) card.classList.remove("is-" + name); }, duration);
  }
  function setPreviewLevelInternal(level, eggProgress) {
    if (!canUseDeveloper()) return false;
    preview.active = true;
    preview.level = clamp(level, 1, 10);
    if (preview.level === 1 && eggProgress != null) preview.eggProgress = clamp(eggProgress, 0, 100);
    refreshDisplaySnapshot();
    root.setTimeout(function () { play("level-up"); }, 30);
    return true;
  }
  function setWardrobeInternal(group, item) {
    if (!canUseDeveloper() || !wardrobeCatalog[group]) return false;
    var valid = wardrobeCatalog[group].some(function (entry) { return entry.id === item; });
    if (!valid) return false;
    preview.active = true;
    preview.wardrobe[group] = item;
    refreshDisplaySnapshot();
    return true;
  }
  function disablePreviewInternal() {
    preview.active = false;
    clearTimeout(previewRestoreTimer);
    snapshot = realSnapshot;
    scheduleCard();
    if (overlay && !overlay.hidden && snapshot) renderOverlay(snapshot);
    closeLevelUpModal();
    return true;
  }
  function playEggHatchingPreview() {
    if (!canUseDeveloper()) return false;
    clearTimeout(previewRestoreTimer);
    var previous = {
      active: preview.active,
      level: preview.level,
      eggProgress: preview.eggProgress
    };
    preview.active = true;
    preview.level = 1;
    preview.eggProgress = 100;
    refreshDisplaySnapshot();
    root.setTimeout(function () { play("egg-hatching"); }, 30);
    previewRestoreTimer = root.setTimeout(function () {
      preview.active = previous.active;
      preview.level = previous.level;
      preview.eggProgress = previous.eggProgress;
      refreshDisplaySnapshot();
    }, 1300);
    return true;
  }
  function onProgress(next) {
    var oldRealLevel = previousRealLevel;
    realSnapshot = next;
    previousRealLevel = next.level;
    snapshot = preview.active && canUseDeveloper() ? buildPreviewSnapshot() : next;
    scheduleCard();
    if (overlay && !overlay.hidden) renderOverlay(snapshot);
    if (!preview.active && oldRealLevel !== null && next.level > oldRealLevel) root.setTimeout(function () { play("level-up"); }, 40);
  }
  function thoughtToggle(button) {
    if (!button) return;
    var active = button.classList.toggle("is-thinking");
    button.setAttribute("aria-expanded", active ? "true" : "false");
  }
  function revokeDeveloper() {
    authorizationRequest += 1;
    authorizedUserId = "";
    developerBridge = null;
    disablePreviewInternal();
    document.dispatchEvent(new CustomEvent("vduckie:developer-preview-revoked"));
  }
  function bridgeGuard() {
    if (!canUseDeveloper()) {
      revokeDeveloper();
      throw new Error("Developer Preview is not authorized for this session");
    }
  }
  function bridgeState() {
    return Object.freeze({
      active: preview.active,
      level: preview.level,
      eggProgress: preview.eggProgress,
      wardrobe: Object.freeze({
        skin: preview.wardrobe.skin,
        glasses: preview.wardrobe.glasses,
        accessory: preview.wardrobe.accessory,
        background: preview.wardrobe.background,
        effect: preview.wardrobe.effect
      }),
      real: realSnapshot
    });
  }
  function createDeveloperBridge() {
    if (developerBridge) return developerBridge;
    developerBridge = Object.freeze({
      enable: function (level) { bridgeGuard(); return setPreviewLevelInternal(level || (realSnapshot && realSnapshot.level) || 1); },
      disable: function () { if (canUseDeveloper()) return disablePreviewInternal(); return false; },
      setLevel: function (level) { bridgeGuard(); return setPreviewLevelInternal(level); },
      setEggProgress: function (percent) { bridgeGuard(); preview.eggProgress = clamp(percent, 0, 100); if (preview.level === 1 && preview.active) refreshDisplaySnapshot(); return bridgeState(); },
      setWardrobe: function (group, item) { bridgeGuard(); setWardrobeInternal(group, item); return bridgeState(); },
      open: function (tab) { bridgeGuard(); openOverlay(tab); return true; },
      test: function (name) {
        bridgeGuard();
        if (name === "egg-hatching") return playEggHatchingPreview();
        if (!preview.active) setPreviewLevelInternal((realSnapshot && realSnapshot.level) || 1);
        if (name === "level-up") {
          play("level-up");
          showLevelUpModal();
          return true;
        }
        play(name);
        return true;
      },
      getState: function () { bridgeGuard(); return bridgeState(); },
      getCatalog: function () { bridgeGuard(); return wardrobeCatalog; }
    });
    return developerBridge;
  }
  function requestDeveloperBridge() {
    var request = ++authorizationRequest;
    var session = currentSession();
    var user = session && session.user;
    var client = core && typeof core.client === "function" ? core.client() : null;
    if (!user || normalizedEmail(user.email) !== DEVELOPER_EMAIL || !client || !client.auth || typeof client.auth.getUser !== "function" || !session.access_token) {
      revokeDeveloper();
      return Promise.reject(new Error("Developer Preview is not available"));
    }
    return client.auth.getUser(session.access_token).then(function (result) {
      if (request !== authorizationRequest) throw new Error("Developer authorization request expired");
      if (result.error) throw result.error;
      var verified = result.data && result.data.user;
      if (!verified || verified.id !== user.id || normalizedEmail(verified.email) !== DEVELOPER_EMAIL) {
        throw new Error("Developer account verification failed");
      }
      authorizedUserId = verified.id;
      document.dispatchEvent(new CustomEvent("vduckie:developer-preview-authorized", { detail: { userId: verified.id } }));
      return createDeveloperBridge();
    }).catch(function (error) {
      if (request === authorizationRequest) revokeDeveloper();
      throw error;
    });
  }
  function bind() {
    document.addEventListener("click", function (event) {
      var open = event.target.closest && event.target.closest("[data-v92-open]");
      if (open) { openOverlay(open.getAttribute("data-v92-open")); return; }
      var close = event.target.closest && event.target.closest("[data-v92-close]");
      if (close || (overlay && event.target === overlay)) { closeOverlay(); return; }
      var levelUpClose = event.target.closest && event.target.closest("[data-v93-levelup-close]");
      if (levelUpClose || (levelUpOverlay && event.target === levelUpOverlay)) { closeLevelUpModal(); return; }
      var tab = event.target.closest && event.target.closest("[data-v92-tab]");
      if (tab) { setTab(tab.getAttribute("data-v92-tab")); return; }
      var stage = event.target.closest && event.target.closest("[data-v93-preview-level]");
      if (stage && canUseDeveloper()) { setPreviewLevelInternal(stage.getAttribute("data-v93-preview-level")); return; }
      var wardrobe = event.target.closest && event.target.closest("[data-v93-wardrobe-group]");
      if (wardrobe && canUseDeveloper()) {
        setWardrobeInternal(wardrobe.getAttribute("data-v93-wardrobe-group"), wardrobe.getAttribute("data-v93-wardrobe-item"));
        return;
      }
      var mascot = event.target.closest && event.target.closest("[data-v92-thought]");
      if (mascot) thoughtToggle(mascot);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { closeOverlay(); closeLevelUpModal(); return; }
      var stage = event.target.closest && event.target.closest("[data-v93-preview-level]");
      if (stage && canUseDeveloper() && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        setPreviewLevelInternal(stage.getAttribute("data-v93-preview-level"));
      }
    });
    document.addEventListener("vduckie:exp-updated", function (event) {
      if (event.detail && event.detail.awarded) root.setTimeout(function () { play("success"); }, 90);
    });
    document.addEventListener("vduckie:evolution-success", function () { play("success"); });
    document.addEventListener("vduckie:evolution-sad", function () { play("sad"); });
  }
  function init() {
    if (!store || !manifest.length) return;
    ensureOverlay();
    ensureLevelUpOverlay();
    bind();
    unsubscribe = store.subscribe(onProgress);
    realSnapshot = store.getSnapshot();
    snapshot = realSnapshot;
    previousRealLevel = realSnapshot.level;
    scheduleCard();
    if (core && typeof core.onSession === "function") {
      unsubscribeSession = core.onSession(function (session) {
        var user = session && session.user;
        if (!user || user.id !== authorizedUserId || normalizedEmail(user.email) !== DEVELOPER_EMAIL) {
          if (authorizedUserId) revokeDeveloper();
        }
      });
    }
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
    getStage: function () { return stageFor((snapshot || realSnapshot || store.getSnapshot()).level); },
    requestDeveloperBridge: requestDeveloperBridge,
    isDeveloperPreviewActive: function () { return preview.active && canUseDeveloper(); },
    destroy: function () {
      if (unsubscribe) unsubscribe();
      unsubscribe = null;
      if (unsubscribeSession) unsubscribeSession();
      unsubscribeSession = null;
      if (observer) observer.disconnect();
      observer = null;
      revokeDeveloper();
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})(window, document);
