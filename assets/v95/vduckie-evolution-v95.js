(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_EVOLUTION_V95__) return;
  root.__VDUCKIE_EVOLUTION_V95__ = true;

  var progressStore = root.VDuckieProgressStore;
  var mascot = root.VDuckieMascot || root.VDuckieAvatar;
  var customizationStore = root.VDuckieCustomizationStore;
  var evolutionManifest = root.VDuckieEvolutionManifest || [];
  var thoughts = root.VDuckieThoughts;
  var core = root.VDuckieEXPCore;
  var DEVELOPER_EMAIL = "ducnguyenn138@gmail.com";

  var card = null;
  var overlay = null;
  var journeyHost = null;
  var wardrobeHost = null;
  var levelUpOverlay = null;
  var observer = null;
  var scheduled = false;
  var bound = false;
  var realSnapshot = null;
  var snapshot = null;
  var previousRealLevel = null;
  var savedSelection = mascot ? mascot.defaults() : {};
  var wardrobeDraft = null;
  var wardrobeVisual = null;
  var wardrobeCategory = "outfit";
  var wardrobeOpen = false;
  var wardrobeDirty = false;
  var wardrobeNotice = "";
  var wardrobeNoticeKind = "";
  var wardrobeSwapTimer = null;
  var wardrobeSwapToken = 0;
  var activeThought = null;
  var thoughtTimer = null;
  var lastFocus = null;
  var unsubscribeProgress = null;
  var unsubscribeCustomization = null;
  var unsubscribeSession = null;
  var authorizedUserId = "";
  var authorizationRequest = 0;
  var developerBridge = null;
  var animationTimers = new Map();
  var preview = { active: false, level: 1, eggProgress: 50, wardrobe: mascot ? mascot.defaults() : {}, developer: false };

  var ANIMATION_ALIASES = Object.freeze({ "outfit-check": "outfit-change", "egg-hatching": "hatching" });
  var PRIORITIES = Object.freeze({ idle: 0, hover: 1, tap: 2, sad: 3, success: 4, glow: 4, "outfit-change": 5, "outfit-confirm": 5, hatching: 6, "level-up": 7 });
  var DURATIONS = Object.freeze({ hover: 920, tap: 720, sad: 860, success: 860, glow: 980, "outfit-change": 1120, "outfit-confirm": 560, hatching: 1120, "level-up": 1180 });
  var ANIMATION_CLASSES = Object.keys(PRIORITIES).map(function (name) { return "is-" + name; });

  function byId(id) { return document.getElementById(id); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value || 0))); }
  function normalizedEmail(value) { return String(value || "").trim().toLowerCase(); }
  function copy(value) { return Object.assign({}, value || {}); }
  function currentSession() { return core && typeof core.session === "function" ? core.session() : null; }
  function esc(value) {
    return core && core.escapeHtml ? core.escapeHtml(value) : String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }
  function format(value) { return core && core.formatNumber ? core.formatNumber(value) : String(Math.max(0, Number(value || 0))); }
  function stageFor(level) { return mascot.getStage(level); }
  function rewardFor(level) {
    var entry = evolutionManifest[Math.max(1, Math.min(10, Number(level || 1))) - 1];
    return entry && entry.reward || (level >= 10 ? "VDuckie hoàn chỉnh nhất" : "Mở khóa hình thái tiếp theo");
  }
  function conditionFor(level) {
    var entry = evolutionManifest[Math.max(1, Math.min(10, Number(level || 1))) - 1];
    return entry && entry.condition || (level === 1 ? "Bắt đầu hành trình" : "Đạt Level " + level);
  }
  function canUseDeveloper() {
    var session = currentSession();
    return !!(authorizedUserId && session && session.user && session.user.id === authorizedUserId && normalizedEmail(session.user.email) === DEVELOPER_EMAIL);
  }
  function isDeveloperPreview() { return canUseDeveloper() && preview.active; }
  function displayLevel() { return Math.max(1, Math.min(10, Number(snapshot && snapshot.level || 1))); }
  function isWardrobeUnlocked() { return displayLevel() >= 7 || canUseDeveloper(); }
  function selectionForDisplay() {
    if (wardrobeOpen) return copy(wardrobeVisual || wardrobeDraft || savedSelection);
    if (isDeveloperPreview()) return copy(preview.wardrobe);
    return copy(savedSelection);
  }
  function allowIncompatible() { return canUseDeveloper() && (preview.active || wardrobeOpen); }

  function buildPreviewSnapshot(level) {
    var base = realSnapshot || (progressStore && progressStore.getSnapshot ? progressStore.getSnapshot() : { authenticated: false, level: 1, totalEXP: 0, currentLevelEXP: 0, expRequired: 0, progressPercent: 0, expRemaining: 0 });
    var previewLevel = Math.max(1, Math.min(10, Math.floor(Number(level || 1))));
    return Object.freeze({
      authenticated: base.authenticated,
      level: previewLevel,
      totalEXP: base.totalEXP,
      currentLevelEXP: base.currentLevelEXP,
      expRequired: base.expRequired,
      progressPercent: previewLevel === 1 ? clamp(preview.eggProgress, 0, 100) : base.progressPercent,
      expRemaining: base.expRemaining,
      previewMode: true,
      realLevel: base.level
    });
  }

  function refreshDisplaySnapshot() {
    snapshot = isDeveloperPreview() ? buildPreviewSnapshot(preview.level) : realSnapshot;
    scheduleCard();
    if (overlay && !overlay.hidden) renderOverlay();
    if (levelUpOverlay && !levelUpOverlay.hidden) renderLevelUpModal();
  }

  function nextRewardText(current) {
    return Number(current.level || 1) >= 10 ? "Đã đạt hình thái Grandmaster cao nhất" : "Level " + (Number(current.level || 1) + 1) + ": " + rewardFor(Number(current.level || 1) + 1);
  }

  function mascotMarkup(options) {
    options = options || {};
    return mascot.render({
      level: options.level || displayLevel(),
      selectedItems: options.selectedItems || selectionForDisplay(),
      animationState: "idle",
      progressPercent: options.progressPercent == null ? Number(snapshot && snapshot.progressPercent || 0) : options.progressPercent,
      previewMode: !!(options.previewMode || isDeveloperPreview()),
      allowIncompatible: options.allowIncompatible == null ? allowIncompatible() : !!options.allowIncompatible,
      size: options.size || "large"
    });
  }

  function cardMarkup(current) {
    var stage = stageFor(current.level);
    var guest = !current.authenticated ? '<span class="v92-guest-note">Đăng nhập Google để EXP và Tủ đồ được đồng bộ.</span>' : "";
    var badge = current.previewMode ? '<span class="v95-preview-badge">PREVIEW LEVEL ' + current.level + " · Level thật " + current.realLevel + "</span>" : "";
    return '<div class="v92-evolution-copy"><span class="v92-kicker">VDUCKIE EVOLUTION</span><h2>VDuckie của bạn</h2><p>Linh vật phản ánh trực tiếp Level và EXP hiện tại của website.</p>' + badge + '<div class="v92-level-line"><strong>Level ' + current.level + "</strong><span>" + format(current.totalEXP) + ' EXP thật</span></div><div class="v92-progress" role="progressbar" aria-label="Tiến độ Level hiện tại" aria-valuemin="0" aria-valuemax="' + Number(current.expRequired || 0) + '" aria-valuenow="' + Number(current.currentLevelEXP || 0) + '"><i style="width:' + clamp(current.progressPercent, 0, 100) + '%"></i></div><div class="v92-progress-meta"><span>' + format(current.currentLevelEXP) + " / " + format(current.expRequired) + " EXP trong level thật</span><span>Còn " + format(current.expRemaining) + ' EXP</span></div><div class="v92-next-reward"><span>Phần thưởng tiếp theo</span><strong>' + esc(nextRewardText(current)) + "</strong></div>" + guest + '<div class="v92-actions"><button type="button" data-v95-open="journey">Xem hành trình</button><button type="button" data-v95-open="wardrobe">Tủ đồ' + (!isWardrobeUnlocked() ? " · Khóa" : "") + "</button></div>" + (!isWardrobeUnlocked() ? "<small>Tủ đồ mở ở Level 7.</small>" : "") + '</div><div class="v92-evolution-visual">' + mascotMarkup({ level: current.level, progressPercent: current.progressPercent, size: "large" }) + '<span class="v92-stage-name">' + esc(stage && stage.name || "VDuckie") + "</span></div>";
  }

  function journeyMarkup() {
    var current = snapshot;
    return mascot.getStages().map(function (stage) {
      var unlocked = current.level >= stage.level || canUseDeveloper();
      var isCurrent = Math.min(current.level, 10) === stage.level;
      var developerAttributes = canUseDeveloper() ? ' data-v93-preview-level="' + stage.level + '" tabindex="0" role="button"' : "";
      return '<article class="v92-stage-card' + (unlocked ? " is-unlocked" : " is-locked") + (isCurrent ? " is-current" : "") + '"' + developerAttributes + '><div class="v92-stage-card-visual">' + mascotMarkup({ level: stage.level, progressPercent: stage.level === 1 && current.level === 1 ? current.progressPercent : 0, size: "compact", selectedItems: selectionForDisplay(), allowIncompatible: canUseDeveloper(), previewMode: canUseDeveloper() }) + '</div><div><span>LV' + stage.level + "</span><h3>" + esc(stage.name) + "</h3><p>" + esc(conditionFor(stage.level)) + "</p><strong>" + esc(rewardFor(stage.level)) + '</strong></div><i aria-hidden="true">' + (unlocked ? "✓" : "🔒") + "</i></article>";
    }).join("");
  }

  function categoryLabel(key) {
    var categories = mascot.getCategories();
    for (var index = 0; index < categories.length; index += 1) if (categories[index].key === key) return categories[index].label;
    return key;
  }

  function selectedSummary(selection) {
    return ["outfit", "accessory", "background", "effect"].map(function (type) {
      var item = mascot.getItem(type, selection[type]);
      return "<span>" + esc(categoryLabel(type)) + ": " + esc(item && item.name || "Mặc định") + "</span>";
    }).join("");
  }

  function itemAccess(type, item, level) {
    var reason = mascot.incompatibilityReason(item, level);
    var developer = canUseDeveloper();
    var nextSelection = copy(wardrobeDraft || savedSelection);
    nextSelection[type] = item.code;
    var status = mascot.selectionStatus(level, nextSelection, developer);
    return {
      selectable: developer || !reason,
      incompatible: !!reason,
      missing: item.status === "missing" || status.missingCombination,
      reason: reason || (item.status === "missing" || status.missingCombination ? "Chưa có hình phù hợp; preview sẽ dùng asset mặc định." : ""),
      developerWarning: developer && (!!reason || item.status === "missing" || status.missingCombination),
      status: status
    };
  }

  function itemStateLabel(access, selected) {
    if (selected) return access.missing ? "Đang thử · thiếu hình" : "Đang thử";
    if (access.incompatible && !canUseDeveloper()) return "Bị khóa";
    if (access.missing) return "Chưa có hình";
    if (access.developerWarning) return "Dev preview";
    return "Đã mở";
  }

  function wardrobeItemsMarkup() {
    var level = displayLevel();
    var items = mascot.getItems(wardrobeCategory);
    var selectedCode = wardrobeDraft && wardrobeDraft[wardrobeCategory];
    return items.map(function (item) {
      var access = itemAccess(wardrobeCategory, item, level);
      var selected = selectedCode === item.code;
      var classes = "v95-item-card" + (selected ? " is-selected" : "") + (!access.selectable ? " is-locked" : "") + (access.missing ? " is-missing" : "");
      var reason = access.reason || (item.minimumLevel > 1 ? "Mở từ Level " + item.minimumLevel : "Có thể sử dụng");
      return '<button type="button" class="' + classes + '" data-v95-item-type="' + esc(wardrobeCategory) + '" data-v95-item-code="' + esc(item.code) + '"' + (!access.selectable ? " disabled" : "") + '><span class="v95-item-visual">' + mascot.itemThumbnail(item, level) + '</span><span class="v95-item-copy"><strong>' + esc(item.name) + "</strong><small>" + esc(reason) + '</small></span><span class="v95-item-state">' + esc(itemStateLabel(access, selected)) + "</span></button>";
    }).join("");
  }

  function wardrobeTabsMarkup() {
    return mascot.getCategories().map(function (category) {
      return '<button type="button" class="' + (wardrobeCategory === category.key ? "active" : "") + '" data-v95-category="' + esc(category.key) + '">' + esc(category.label) + "</button>";
    }).join("");
  }

  function wardrobeLockedMarkup() {
    return '<div class="v92-wardrobe-locked"><span aria-hidden="true">🔒</span><h3>Tủ đồ mở ở Level 7</h3><p>Tiếp tục học để mở trang phục, phụ kiện, nền và hiệu ứng. Tủ đồ không có XP hoặc Level riêng.</p></div>';
  }

  function wardrobeMarkup() {
    if (!isWardrobeUnlocked()) return wardrobeLockedMarkup();
    if (!wardrobeDraft) wardrobeDraft = copy(isDeveloperPreview() ? preview.wardrobe : savedSelection);
    if (!wardrobeVisual) wardrobeVisual = copy(wardrobeDraft);
    var status = mascot.selectionStatus(displayLevel(), wardrobeDraft, canUseDeveloper());
    var notice = wardrobeNotice || (status.reason ? status.reason : canUseDeveloper() ? "Developer Preview có thể xem item chưa tương thích; XP và Level thật không đổi." : "Chọn một item để xem trước.");
    var noticeKind = wardrobeNoticeKind || (status.reason ? "is-warning" : "");
    var useDisabled = !status.valid && !isDeveloperPreview();
    return '<div class="v95-wardrobe-shell"><section class="v95-wardrobe-preview"><span class="v92-kicker">PREVIEW TRỰC TIẾP</span>' + mascotMarkup({ selectedItems: wardrobeVisual, allowIncompatible: canUseDeveloper(), previewMode: true, size: "large" }) + '<h3>' + esc(stageFor(displayLevel()).name) + '</h3><div class="v95-wardrobe-selected">' + selectedSummary(wardrobeDraft) + '</div><p>Chọn item để mặc thử. Chỉ lưu sau khi bấm “Sử dụng”.</p></section><section class="v95-wardrobe-browser"><nav class="v95-wardrobe-tabs" aria-label="Nhóm Tủ đồ">' + wardrobeTabsMarkup() + '</nav><p class="v95-wardrobe-notice ' + noticeKind + '">' + esc(notice) + '</p><div class="v95-item-grid">' + wardrobeItemsMarkup() + '</div><div class="v95-wardrobe-actions"><span class="v95-save-status" data-v95-save-status></span><button type="button" data-v95-reset>Đặt lại</button><button type="button" data-v95-close>Đóng</button><button type="button" data-v95-use' + (useDisabled ? " disabled" : "") + '>Sử dụng</button></div></section></div>';
  }

  function ensureOverlay() {
    if (overlay && overlay.isConnected) return;
    overlay = document.createElement("div");
    overlay.id = "v92EvolutionOverlay";
    overlay.className = "v92-overlay";
    overlay.hidden = true;
    overlay.innerHTML = '<section class="v92-dialog" role="dialog" aria-modal="true" aria-labelledby="v92DialogTitle"><header><div><span class="v92-kicker">VDUCKIE EVOLUTION</span><h2 id="v92DialogTitle">Hành trình tiến hóa</h2></div><button type="button" class="v92-close" data-v95-overlay-close aria-label="Đóng">×</button></header><nav class="v92-tabs"><button type="button" class="active" data-v95-tab="journey">Hành trình</button><button type="button" data-v95-tab="wardrobe">Tủ đồ</button></nav><div class="v92-dialog-body"><div id="v95Journey" class="v92-journey-grid"></div><div id="v95Wardrobe" class="v92-wardrobe" hidden></div></div></section>';
    document.body.appendChild(overlay);
    journeyHost = byId("v95Journey");
    wardrobeHost = byId("v95Wardrobe");
  }

  function ensureLevelUpOverlay() {
    if (levelUpOverlay && levelUpOverlay.isConnected) return;
    levelUpOverlay = document.createElement("div");
    levelUpOverlay.id = "v95LevelUpOverlay";
    levelUpOverlay.className = "v92-overlay";
    levelUpOverlay.hidden = true;
    levelUpOverlay.innerHTML = '<section class="v92-dialog" role="dialog" aria-modal="true" aria-labelledby="v95LevelUpTitle"><header><div><span class="v92-kicker">LEVEL UP</span><h2 id="v95LevelUpTitle">VDuckie tiến hóa!</h2></div><button type="button" class="v92-close" data-v95-levelup-close aria-label="Đóng">×</button></header><div class="v95-levelup-content" data-v95-levelup-content></div></section>';
    document.body.appendChild(levelUpOverlay);
  }

  function hydrate(scope) { if (mascot && typeof mascot.hydrate === "function") mascot.hydrate(scope || document); }

  function renderLevelUpModal() {
    ensureLevelUpOverlay();
    var host = levelUpOverlay.querySelector("[data-v95-levelup-content]");
    if (!host || !snapshot) return;
    var stage = stageFor(snapshot.level);
    host.innerHTML = mascotMarkup({ level: snapshot.level, selectedItems: selectionForDisplay(), size: "medium", previewMode: isDeveloperPreview() }) + "<h3>Level " + snapshot.level + " · " + esc(stage.name) + "</h3><p>" + esc(rewardFor(snapshot.level)) + '</p><button type="button" data-v95-levelup-close>Tiếp tục học</button>';
    hydrate(host);
  }

  function showLevelUpModal() {
    renderLevelUpModal();
    levelUpOverlay.hidden = false;
    document.body.classList.add("v92-modal-open");
    play("level-up", { force: true, scope: levelUpOverlay });
  }

  function closeLevelUpModal() {
    if (!levelUpOverlay || levelUpOverlay.hidden) return;
    levelUpOverlay.hidden = true;
    if (!overlay || overlay.hidden) document.body.classList.remove("v92-modal-open");
  }

  function renderOverlay() {
    ensureOverlay();
    if (wardrobeOpen) {
      journeyHost.innerHTML = "";
      wardrobeHost.innerHTML = wardrobeMarkup();
    } else {
      journeyHost.innerHTML = journeyMarkup();
      wardrobeHost.innerHTML = "";
    }
    hydrate(overlay);
  }

  function setTab(name) {
    if (!overlay) return;
    var isWardrobe = name === "wardrobe";
    if (isWardrobe && !wardrobeOpen) {
      wardrobeOpen = true;
      wardrobeDirty = false;
      wardrobeDraft = copy(isDeveloperPreview() ? preview.wardrobe : savedSelection);
      wardrobeVisual = copy(wardrobeDraft);
      wardrobeNotice = "";
      wardrobeNoticeKind = "";
    }
    if (!isWardrobe && wardrobeOpen && wardrobeDirty) {
      cancelWardrobeSwap();
      wardrobeDraft = copy(isDeveloperPreview() ? preview.wardrobe : savedSelection);
      wardrobeVisual = copy(wardrobeDraft);
      wardrobeDirty = false;
    }
    wardrobeOpen = isWardrobe;
    journeyHost.hidden = isWardrobe;
    wardrobeHost.hidden = !isWardrobe;
    Array.prototype.forEach.call(overlay.querySelectorAll("[data-v95-tab]"), function (button) {
      button.classList.toggle("active", button.getAttribute("data-v95-tab") === name);
    });
    byId("v92DialogTitle").textContent = isWardrobe ? "Tủ đồ VDuckie" : "Hành trình tiến hóa";
    renderOverlay();
  }

  function openOverlay(tab) {
    if (!snapshot) return;
    ensureOverlay();
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("v92-modal-open");
    setTab(tab === "wardrobe" ? "wardrobe" : "journey");
    var closeButton = overlay.querySelector("[data-v95-overlay-close]");
    if (closeButton) closeButton.focus();
  }

  function cancelWardrobeSwap() {
    wardrobeSwapToken += 1;
    if (wardrobeSwapTimer) root.clearTimeout(wardrobeSwapTimer);
    wardrobeSwapTimer = null;
  }

  function closeOverlay() {
    if (!overlay || overlay.hidden) return;
    cancelWardrobeSwap();
    if (wardrobeOpen && wardrobeDirty) {
      wardrobeDraft = copy(isDeveloperPreview() ? preview.wardrobe : savedSelection);
      wardrobeVisual = copy(wardrobeDraft);
      wardrobeDirty = false;
      scheduleCard();
    }
    wardrobeOpen = false;
    overlay.hidden = true;
    closeThought();
    if (!levelUpOverlay || levelUpOverlay.hidden) document.body.classList.remove("v92-modal-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function findHomeHost() { return byId("v865HomeMain") || document.querySelector(".v865-home-main") || byId("homeHub"); }

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
    hydrate(card);
  }

  function scheduleCard() {
    if (scheduled) return;
    scheduled = true;
    root.requestAnimationFrame(ensureCard);
  }

  function normalizedAnimation(name) { return ANIMATION_ALIASES[name] || name; }

  function clearNodeAnimation(node) {
    var timer = animationTimers.get(node);
    if (timer) root.clearTimeout(timer);
    animationTimers.delete(node);
    ANIMATION_CLASSES.forEach(function (className) { node.classList.remove(className); });
  }

  function playNode(node, name, options) {
    if (!node || !node.classList) return false;
    options = options || {};
    var state = normalizedAnimation(name);
    if (PRIORITIES[state] == null) return false;
    var current = normalizedAnimation(node.getAttribute("data-v95-state") || "idle");
    var restartable = options.force || state === "hover" || state === "tap" || state === "outfit-change" || state === "outfit-confirm";
    if (!restartable && PRIORITIES[state] < (PRIORITIES[current] || 0)) return false;
    clearNodeAnimation(node);
    node.classList.add("is-" + state);
    node.setAttribute("data-v95-state", state);
    var duration = Number(options.duration || DURATIONS[state] || 800);
    if (state !== "idle") {
      var timer = root.setTimeout(function () {
        animationTimers.delete(node);
        if (!node.isConnected) return;
        ANIMATION_CLASSES.forEach(function (className) { node.classList.remove(className); });
        node.classList.add("is-idle");
        node.setAttribute("data-v95-state", "idle");
      }, duration);
      animationTimers.set(node, timer);
    }
    return true;
  }

  function play(name, options) {
    options = options || {};
    var scope = options.scope && options.scope.querySelectorAll ? options.scope : document;
    var nodes = options.target ? [options.target] : Array.prototype.slice.call(scope.querySelectorAll("[data-v95-mascot]"));
    var played = false;
    nodes.forEach(function (node) { if (playNode(node, name, options)) played = true; });
    return played;
  }

  function playAfterRender(name, options) {
    root.requestAnimationFrame(function () {
      root.requestAnimationFrame(function () { play(name, options || { force: true }); });
    });
  }

  function closeThought(except) {
    if (thoughtTimer) root.clearTimeout(thoughtTimer);
    thoughtTimer = null;
    if (activeThought && activeThought !== except) {
      activeThought.classList.remove("is-thinking");
      activeThought.setAttribute("aria-expanded", "false");
    }
    if (!except) activeThought = null;
  }

  function positionThought(node) {
    if (!node || !node.isConnected) return;
    var bubble = node.querySelector(".v95-thought");
    if (!bubble) return;
    node.style.setProperty("--v95-bubble-shift", "0px");
    var rect = bubble.getBoundingClientRect();
    var shift = 0;
    if (rect.left < 8) shift += 8 - rect.left;
    if (rect.right > root.innerWidth - 8) shift -= rect.right - (root.innerWidth - 8);
    node.style.setProperty("--v95-bubble-shift", Math.round(shift) + "px");
  }

  function openThought(node) {
    if (!node || !thoughts) return false;
    closeThought(node);
    var level = Number(node.getAttribute("data-v95-level") || 1);
    var thought = thoughts.next(level);
    var zh = node.querySelector("[data-v95-thought-zh]");
    var vi = node.querySelector("[data-v95-thought-vi]");
    if (zh) zh.textContent = thought.zh;
    if (vi) vi.textContent = "(" + thought.vi + ")";
    node.classList.add("is-thinking");
    node.setAttribute("aria-expanded", "true");
    activeThought = node;
    root.requestAnimationFrame(function () { positionThought(node); });
    thoughtTimer = root.setTimeout(function () {
      if (activeThought === node) closeThought();
    }, 4700);
    return true;
  }

  function setSaveStatus(message, kind) {
    var status = overlay && overlay.querySelector("[data-v95-save-status]");
    if (!status) return;
    status.className = "v95-save-status" + (kind ? " " + kind : "");
    status.textContent = message;
  }

  function applyWardrobeVisual(selection, token) {
    if (token !== wardrobeSwapToken) return;
    wardrobeVisual = copy(selection);
    renderOverlay();
    scheduleCard();
    playAfterRender("outfit-confirm", { force: true });
  }

  function previewItem(type, code) {
    if (!wardrobeDraft) wardrobeDraft = copy(isDeveloperPreview() ? preview.wardrobe : savedSelection);
    if (!wardrobeVisual) wardrobeVisual = copy(wardrobeDraft);
    var item = mascot.getItem(type, code);
    if (!item) return false;
    var reason = mascot.incompatibilityReason(item, displayLevel());
    if (reason && !canUseDeveloper()) {
      wardrobeNotice = reason;
      wardrobeNoticeKind = "is-warning";
      renderOverlay();
      return false;
    }
    var nextSelection = copy(wardrobeDraft);
    nextSelection[type] = code;
    nextSelection = mascot.normalizeSelection(nextSelection);
    var status = mascot.selectionStatus(displayLevel(), nextSelection, canUseDeveloper());
    wardrobeDraft = nextSelection;
    wardrobeDirty = true;
    wardrobeNotice = status.reason ? status.reason + " Đang hiển thị asset mặc định." : item.name + " đã được mặc thử. Bấm “Sử dụng” để lưu.";
    wardrobeNoticeKind = status.reason ? "is-warning" : "is-good";
    mascot.preloadItem(type, code, displayLevel(), nextSelection);
    cancelWardrobeSwap();
    var token = wardrobeSwapToken;
    renderOverlay();
    scheduleCard();
    playAfterRender("outfit-change", { force: true });
    wardrobeSwapTimer = root.setTimeout(function () {
      wardrobeSwapTimer = null;
      applyWardrobeVisual(nextSelection, token);
    }, 560);
    return true;
  }

  function resetWardrobeDraft() {
    var nextSelection = mascot.defaults();
    wardrobeNotice = "Đã đưa preview về mặc định. Bấm “Sử dụng” để lưu.";
    wardrobeNoticeKind = "is-good";
    wardrobeDraft = nextSelection;
    wardrobeDirty = true;
    cancelWardrobeSwap();
    var token = wardrobeSwapToken;
    renderOverlay();
    scheduleCard();
    playAfterRender("outfit-change", { force: true });
    wardrobeSwapTimer = root.setTimeout(function () {
      wardrobeSwapTimer = null;
      applyWardrobeVisual(nextSelection, token);
    }, 560);
  }

  function commitPendingWardrobeVisual() {
    cancelWardrobeSwap();
    wardrobeVisual = copy(wardrobeDraft || wardrobeVisual || savedSelection);
    renderOverlay();
    scheduleCard();
  }

  function useWardrobeDraft() {
    if (!wardrobeDraft) return Promise.resolve(false);
    commitPendingWardrobeVisual();
    var status = mascot.selectionStatus(displayLevel(), wardrobeDraft, canUseDeveloper());
    if (!status.valid && !isDeveloperPreview()) {
      wardrobeNotice = status.reason || "Chưa thể sử dụng tổ hợp này.";
      wardrobeNoticeKind = "is-warning";
      renderOverlay();
      setSaveStatus("Chưa thể lưu", "is-warning");
      return Promise.resolve(false);
    }
    if (isDeveloperPreview()) {
      preview.wardrobe = mascot.normalizeSelection(wardrobeDraft);
      wardrobeDirty = false;
      wardrobeNotice = status.reason ? "Đã áp dụng trong Developer Preview bằng asset fallback. Không ghi Supabase." : "Đã áp dụng trong Developer Preview. Không ghi Supabase.";
      wardrobeNoticeKind = status.reason ? "is-warning" : "is-good";
      setSaveStatus("Đã dùng trong preview", status.reason ? "is-warning" : "is-good");
      scheduleCard();
      playAfterRender("outfit-confirm", { force: true });
      return Promise.resolve(true);
    }
    setSaveStatus("Đang lưu…", "");
    return customizationStore.save(wardrobeDraft).then(function (result) {
      savedSelection = copy(result && result.selection || customizationStore.get());
      wardrobeDraft = copy(savedSelection);
      wardrobeVisual = copy(savedSelection);
      wardrobeDirty = false;
      var fallback = result && result.syncStatus === "fallback";
      wardrobeNotice = fallback ? "Đã lưu trên thiết bị; Supabase sẽ thử lại sau." : "Đã lưu và mặc lên VDuckie.";
      wardrobeNoticeKind = fallback ? "is-warning" : "is-good";
      renderOverlay();
      scheduleCard();
      setSaveStatus(fallback ? "Đã lưu cục bộ" : "Đã lưu", fallback ? "is-warning" : "is-good");
      playAfterRender("outfit-confirm", { force: true });
      return true;
    }).catch(function () {
      setSaveStatus("Lưu thất bại", "is-warning");
      return false;
    });
  }

  function playEggHatchingPreview() {
    if (canUseDeveloper()) {
      preview.active = true;
      preview.level = 1;
      preview.eggProgress = 92;
      refreshDisplaySnapshot();
    }
    playAfterRender("hatching", { force: true });
    return true;
  }

  function setPreviewLevelInternal(level) {
    if (!canUseDeveloper()) return false;
    preview.active = true;
    preview.developer = true;
    preview.level = Math.max(1, Math.min(10, Math.floor(Number(level || 1))));
    if (!preview.wardrobe || !Object.keys(preview.wardrobe).length) preview.wardrobe = copy(savedSelection);
    refreshDisplaySnapshot();
    playAfterRender("level-up", { force: true });
    return developerState();
  }

  function disablePreviewInternal() {
    preview.active = false;
    preview.level = realSnapshot && realSnapshot.level || 1;
    wardrobeDraft = null;
    wardrobeVisual = null;
    wardrobeDirty = false;
    refreshDisplaySnapshot();
    return true;
  }

  function setWardrobeInternal(group, itemCode) {
    if (!canUseDeveloper() || !mascot.getItem(group, itemCode)) return false;
    preview.wardrobe[group] = itemCode;
    preview.wardrobe = mascot.normalizeSelection(preview.wardrobe);
    if (wardrobeOpen) {
      wardrobeDraft = copy(preview.wardrobe);
      wardrobeVisual = copy(preview.wardrobe);
    }
    refreshDisplaySnapshot();
    playAfterRender("outfit-change", { force: true });
    return true;
  }

  function developerState() {
    return Object.freeze({ active: preview.active, level: preview.level, eggProgress: preview.eggProgress, wardrobe: Object.freeze(copy(preview.wardrobe)), real: realSnapshot });
  }

  function revokeDeveloper() {
    authorizationRequest += 1;
    authorizedUserId = "";
    preview.active = false;
    preview.developer = false;
    preview.level = realSnapshot && realSnapshot.level || 1;
    preview.wardrobe = copy(savedSelection);
    developerBridge = null;
    refreshDisplaySnapshot();
    document.dispatchEvent(new CustomEvent("vduckie:developer-preview-revoked"));
  }

  function bridgeGuard() {
    if (!canUseDeveloper()) {
      revokeDeveloper();
      throw new Error("Developer Preview is not authorized for this session");
    }
  }

  function testThought() {
    var target = card && card.querySelector("[data-v95-mascot]") || document.querySelector("[data-v95-mascot]");
    if (!target) return false;
    openThought(target);
    playNode(target, "tap", { force: true });
    return true;
  }

  function createDeveloperBridge() {
    if (developerBridge) return developerBridge;
    developerBridge = Object.freeze({
      enable: function (level) { bridgeGuard(); return setPreviewLevelInternal(level || realSnapshot && realSnapshot.level || 1); },
      disable: function () { return canUseDeveloper() ? disablePreviewInternal() : false; },
      setLevel: function (level) { bridgeGuard(); return setPreviewLevelInternal(level); },
      setEggProgress: function (percent) { bridgeGuard(); preview.eggProgress = clamp(percent, 0, 100); if (preview.level === 1 && preview.active) refreshDisplaySnapshot(); return developerState(); },
      setWardrobe: function (group, item) { bridgeGuard(); setWardrobeInternal(group, item); return developerState(); },
      open: function (tab) { bridgeGuard(); openOverlay(tab); return true; },
      test: function (name) {
        bridgeGuard();
        if (name === "egg-hatching") return playEggHatchingPreview();
        if (!preview.active) setPreviewLevelInternal(realSnapshot && realSnapshot.level || 1);
        if (name === "level-up") { playAfterRender("level-up", { force: true }); showLevelUpModal(); return true; }
        if (name === "thought") return testThought();
        if (name === "tap") return play("tap", { force: true });
        if (name === "outfit-change" || name === "outfit-check") return play("outfit-change", { force: true });
        return play(name, { force: true });
      },
      getState: function () { bridgeGuard(); return developerState(); },
      getCatalog: function () {
        bridgeGuard();
        var catalog = {};
        mascot.getCategories().forEach(function (category) { catalog[category.key] = mascot.getItems(category.key); });
        return Object.freeze(catalog);
      }
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
      if (!verified || verified.id !== user.id || normalizedEmail(verified.email) !== DEVELOPER_EMAIL) throw new Error("Developer account verification failed");
      authorizedUserId = verified.id;
      preview.wardrobe = copy(savedSelection);
      document.dispatchEvent(new CustomEvent("vduckie:developer-preview-authorized", { detail: { userId: verified.id } }));
      return createDeveloperBridge();
    }).catch(function (error) {
      if (request === authorizationRequest) revokeDeveloper();
      throw error;
    });
  }

  function onProgress(next) {
    var oldLevel = previousRealLevel;
    realSnapshot = next;
    previousRealLevel = next.level;
    snapshot = preview.active ? buildPreviewSnapshot(preview.level) : realSnapshot;
    scheduleCard();
    if (overlay && !overlay.hidden) renderOverlay();
    if (oldLevel !== null && next.level > oldLevel && !preview.active) root.setTimeout(function () { showLevelUpModal(); }, 50);
  }

  function onDocumentClick(event) {
    var openButton = event.target.closest && event.target.closest("[data-v95-open]");
    if (openButton) { openOverlay(openButton.getAttribute("data-v95-open")); return; }
    var overlayClose = event.target.closest && event.target.closest("[data-v95-overlay-close]");
    if (overlayClose || overlay && event.target === overlay) { closeOverlay(); return; }
    var levelUpClose = event.target.closest && event.target.closest("[data-v95-levelup-close]");
    if (levelUpClose || levelUpOverlay && event.target === levelUpOverlay) { closeLevelUpModal(); return; }
    var tab = event.target.closest && event.target.closest("[data-v95-tab]");
    if (tab) { setTab(tab.getAttribute("data-v95-tab")); return; }
    var stage = event.target.closest && event.target.closest("[data-v93-preview-level]");
    if (stage && canUseDeveloper()) { setPreviewLevelInternal(stage.getAttribute("data-v93-preview-level")); return; }
    var category = event.target.closest && event.target.closest("[data-v95-category]");
    if (category) { wardrobeCategory = category.getAttribute("data-v95-category"); renderOverlay(); return; }
    var item = event.target.closest && event.target.closest("[data-v95-item-code]");
    if (item) { previewItem(item.getAttribute("data-v95-item-type"), item.getAttribute("data-v95-item-code")); return; }
    if (event.target.closest && event.target.closest("[data-v95-reset]")) { resetWardrobeDraft(); return; }
    if (event.target.closest && event.target.closest("[data-v95-use]")) { useWardrobeDraft(); return; }
    if (event.target.closest && event.target.closest("[data-v95-close]")) { closeOverlay(); return; }
    var mascotNode = event.target.closest && event.target.closest("[data-v95-mascot]");
    if (mascotNode) {
      openThought(mascotNode);
      playNode(mascotNode, "tap", { force: true });
      return;
    }
    closeThought();
  }

  function onPointerOver(event) {
    if (event.pointerType === "touch") return;
    var mascotNode = event.target.closest && event.target.closest("[data-v95-mascot]");
    if (mascotNode && !(event.relatedTarget && mascotNode.contains(event.relatedTarget))) {
      openThought(mascotNode);
      playNode(mascotNode, "hover", { force: true });
      return;
    }
    var item = event.target.closest && event.target.closest("[data-v95-item-code]");
    if (item) mascot.preloadItem(item.getAttribute("data-v95-item-type"), item.getAttribute("data-v95-item-code"), displayLevel(), wardrobeDraft || savedSelection);
  }

  function onFocusIn(event) {
    var mascotNode = event.target.closest && event.target.closest("[data-v95-mascot]");
    if (mascotNode) {
      openThought(mascotNode);
      playNode(mascotNode, "hover", { force: true });
      return;
    }
    var item = event.target.closest && event.target.closest("[data-v95-item-code]");
    if (item) mascot.preloadItem(item.getAttribute("data-v95-item-type"), item.getAttribute("data-v95-item-code"), displayLevel(), wardrobeDraft || savedSelection);
  }

  function onKeyDown(event) {
    if (event.key === "Escape") { closeThought(); closeOverlay(); closeLevelUpModal(); return; }
    var stage = event.target.closest && event.target.closest("[data-v93-preview-level]");
    if (stage && canUseDeveloper() && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setPreviewLevelInternal(stage.getAttribute("data-v93-preview-level"));
    }
  }

  function onVisibilityChange() { document.documentElement.classList.toggle("v95-page-hidden", document.hidden); }
  function onResize() { if (activeThought) positionThought(activeThought); }
  function onExpUpdated(event) { if (event.detail && event.detail.awarded) root.setTimeout(function () { play("success", { force: true }); }, 90); }
  function onSuccess() { play("success", { force: true }); }
  function onSad() { play("sad", { force: true }); }

  function bind() {
    if (bound) return;
    bound = true;
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("vduckie:exp-updated", onExpUpdated);
    document.addEventListener("vduckie:evolution-success", onSuccess);
    document.addEventListener("vduckie:evolution-sad", onSad);
    root.addEventListener("resize", onResize, { passive: true });
  }

  function unbind() {
    if (!bound) return;
    bound = false;
    document.removeEventListener("click", onDocumentClick);
    document.removeEventListener("pointerover", onPointerOver);
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    document.removeEventListener("vduckie:exp-updated", onExpUpdated);
    document.removeEventListener("vduckie:evolution-success", onSuccess);
    document.removeEventListener("vduckie:evolution-sad", onSad);
    root.removeEventListener("resize", onResize);
  }

  function init() {
    if (!progressStore || !mascot || !customizationStore || !thoughts) return;
    ensureOverlay();
    ensureLevelUpOverlay();
    bind();
    unsubscribeProgress = progressStore.subscribe(onProgress);
    realSnapshot = progressStore.getSnapshot();
    snapshot = realSnapshot;
    previousRealLevel = realSnapshot.level;
    savedSelection = copy(customizationStore.get());
    preview.wardrobe = copy(savedSelection);
    unsubscribeCustomization = customizationStore.subscribe(function (next) {
      savedSelection = copy(next.selection);
      if (!preview.active) preview.wardrobe = copy(savedSelection);
      if (!wardrobeOpen || !wardrobeDirty) {
        wardrobeDraft = copy(savedSelection);
        wardrobeVisual = copy(savedSelection);
      }
      scheduleCard();
      if (overlay && !overlay.hidden) renderOverlay();
    });
    scheduleCard();
    if (core && typeof core.onSession === "function") {
      unsubscribeSession = core.onSession(function (session) {
        var user = session && session.user;
        if ((!user || user.id !== authorizedUserId || normalizedEmail(user.email) !== DEVELOPER_EMAIL) && authorizedUserId) revokeDeveloper();
      });
    }
    if (root.MutationObserver && document.body) {
      observer = new MutationObserver(function () {
        if (!card || !card.isConnected || card.parentNode !== findHomeHost()) scheduleCard();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function destroy() {
    unbind();
    closeThought();
    cancelWardrobeSwap();
    animationTimers.forEach(function (timer) { root.clearTimeout(timer); });
    animationTimers.clear();
    if (unsubscribeProgress) unsubscribeProgress();
    if (unsubscribeCustomization) unsubscribeCustomization();
    if (unsubscribeSession) unsubscribeSession();
    if (observer) observer.disconnect();
  }

  root.VDuckieEvolution = Object.freeze({
    version: "95.0",
    requestDeveloperBridge: requestDeveloperBridge,
    open: openOverlay,
    close: closeOverlay,
    play: play,
    showThought: function () { return testThought(); },
    getStage: function () { return stageFor((snapshot || progressStore.getSnapshot()).level); },
    getSelection: function () { return Object.freeze(selectionForDisplay()); },
    saveSelection: function (selection) { return customizationStore.save(selection); },
    destroy: destroy
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})(window, document);
