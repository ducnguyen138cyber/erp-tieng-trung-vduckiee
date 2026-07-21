(function (root, document) {
  "use strict";
  if (root.__VDUCKIE_EVOLUTION_V94__) return;
  root.__VDUCKIE_EVOLUTION_V94__ = true;

  var store = root.VDuckieProgressStore;
  var avatar = root.VDuckieAvatar;
  var customizationStore = root.VDuckieCustomizationStore;
  var manifest = root.VDuckieEvolutionManifest || [];
  var core = root.VDuckieEXPCore;
  var DEVELOPER_EMAIL = "ducnguyenn138@gmail.com";
  var card = null, overlay = null, journeyHost = null, wardrobeHost = null, levelUpOverlay = null, observer = null;
  var scheduled = false, realSnapshot = null, snapshot = null, previousRealLevel = null;
  var savedSelection = avatar ? avatar.defaults() : {}, wardrobeDraft = null, wardrobeCategory = "outfit";
  var wardrobeOpen = false, wardrobeDirty = false, wardrobeNotice = "", wardrobeNoticeKind = "";
  var activeAnimation = "idle", animationTimer = null, thoughtTimer = null, lastFocus = null;
  var unsubscribeProgress = null, unsubscribeCustomization = null, unsubscribeSession = null;
  var authorizedUserId = "", authorizationRequest = 0, developerBridge = null;
  var preview = { active: false, level: 1, eggProgress: 50, wardrobe: avatar ? avatar.defaults() : {}, developer: false };
  var priorities = Object.freeze({ idle: 1, hover: 2, sad: 3, success: 4, glow: 4, "outfit-check": 5, hatching: 6, "level-up": 7 });
  var durations = Object.freeze({ hover: 900, sad: 760, success: 760, glow: 980, "outfit-check": 1080, hatching: 1120, "level-up": 1180 });

  function byId(id) { return document.getElementById(id); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value || 0))); }
  function normalizedEmail(value) { return String(value || "").trim().toLowerCase(); }
  function esc(value) { return core && core.escapeHtml ? core.escapeHtml(value) : String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function format(value) { return core && core.formatNumber ? core.formatNumber(value) : String(Math.max(0, Number(value || 0))); }
  function copy(value) { return Object.assign({}, value || {}); }
  function currentSession() { return core && typeof core.session === "function" ? core.session() : null; }
  function stageFor(level) { return avatar ? avatar.getStage(level) : manifest[Math.max(1, Math.min(10, Number(level || 1))) - 1]; }
  function rewardFor(level) { var entry = manifest[Math.max(1, Math.min(10, Number(level || 1))) - 1]; return entry && entry.reward || (level >= 10 ? "VDuckie hoàn chỉnh nhất" : "Mở khóa hình thái tiếp theo"); }
  function conditionFor(level) { var entry = manifest[Math.max(1, Math.min(10, Number(level || 1))) - 1]; return entry && entry.condition || (level === 1 ? "Bắt đầu hành trình" : "Đạt Level " + level); }
  function canUseDeveloper() { var session = currentSession(); return !!(authorizedUserId && session && session.user && session.user.id === authorizedUserId && normalizedEmail(session.user.email) === DEVELOPER_EMAIL); }
  function isDeveloperPreview() { return canUseDeveloper() && preview.active; }
  function displayLevel() { return Math.max(1, Math.min(10, Number(snapshot && snapshot.level || 1))); }
  function isWardrobeUnlocked() { return displayLevel() >= 7 || canUseDeveloper(); }
  function selectionForDisplay() { if (wardrobeOpen && wardrobeDraft) return copy(wardrobeDraft); if (isDeveloperPreview()) return copy(preview.wardrobe); return copy(savedSelection); }
  function allowIncompatible() { return canUseDeveloper() && (preview.active || wardrobeOpen); }

  function buildPreviewSnapshot(level) {
    var base = realSnapshot || (store && store.getSnapshot ? store.getSnapshot() : { authenticated: false, level: 1, totalEXP: 0, currentLevelEXP: 0, expRequired: 0, progressPercent: 0, expRemaining: 0 });
    var previewLevel = Math.max(1, Math.min(10, Math.floor(Number(level || 1))));
    return Object.freeze({ authenticated: base.authenticated, level: previewLevel, totalEXP: base.totalEXP, currentLevelEXP: base.currentLevelEXP, expRequired: base.expRequired, progressPercent: previewLevel === 1 ? clamp(preview.eggProgress, 0, 100) : base.progressPercent, expRemaining: base.expRemaining, previewMode: true, realLevel: base.level });
  }
  function refreshDisplaySnapshot() { snapshot = isDeveloperPreview() ? buildPreviewSnapshot(preview.level) : realSnapshot; scheduleCard(); if (overlay && !overlay.hidden) renderOverlay(); if (levelUpOverlay && !levelUpOverlay.hidden) renderLevelUpModal(); }
  function nextRewardText(current) { return Number(current.level || 1) >= 10 ? "Đã đạt hình thái Grandmaster cao nhất" : "Level " + (Number(current.level || 1) + 1) + ": " + rewardFor(Number(current.level || 1) + 1); }

  function avatarMarkup(options) {
    options = options || {};
    return avatar.render({ level: options.level || displayLevel(), selectedItems: options.selectedItems || selectionForDisplay(), animationState: activeAnimation, progressPercent: options.progressPercent == null ? Number(snapshot && snapshot.progressPercent || 0) : options.progressPercent, thought: options.thought, previewMode: !!(options.previewMode || isDeveloperPreview()), allowIncompatible: options.allowIncompatible == null ? allowIncompatible() : !!options.allowIncompatible, size: options.size || "large" });
  }

  function cardMarkup(current) {
    var stage = stageFor(current.level);
    var guest = !current.authenticated ? '<span class="v92-guest-note">Đăng nhập Google để EXP và Tủ đồ được đồng bộ.</span>' : "";
    var badge = current.previewMode ? '<span class="v94-preview-badge">PREVIEW LEVEL ' + current.level + ' · Level thật ' + current.realLevel + '</span>' : "";
    return '<div class="v92-evolution-copy"><span class="v92-kicker">VDUCKIE EVOLUTION</span><h2>VDuckie của bạn</h2><p>Linh vật phản ánh trực tiếp Level và EXP hiện tại của website.</p>' + badge + '<div class="v92-level-line"><strong>Level ' + current.level + '</strong><span>' + format(current.totalEXP) + ' EXP thật</span></div><div class="v92-progress" role="progressbar" aria-label="Tiến độ Level hiện tại" aria-valuemin="0" aria-valuemax="' + Number(current.expRequired || 0) + '" aria-valuenow="' + Number(current.currentLevelEXP || 0) + '"><i style="width:' + clamp(current.progressPercent, 0, 100) + '%"></i></div><div class="v92-progress-meta"><span>' + format(current.currentLevelEXP) + ' / ' + format(current.expRequired) + ' EXP trong level thật</span><span>Còn ' + format(current.expRemaining) + ' EXP</span></div><div class="v92-next-reward"><span>Phần thưởng tiếp theo</span><strong>' + esc(nextRewardText(current)) + '</strong></div>' + guest + '<div class="v92-actions"><button type="button" data-v92-open="journey">Xem hành trình</button><button type="button" data-v92-open="wardrobe">Tủ đồ' + (!isWardrobeUnlocked() ? ' · Khóa' : '') + '</button></div>' + (!isWardrobeUnlocked() ? '<small>Tủ đồ mở ở Level 7.</small>' : '') + '</div><div class="v92-evolution-visual">' + avatarMarkup({ level: current.level, progressPercent: current.progressPercent, size: "large" }) + '<span class="v92-stage-name">' + esc(stage && stage.name || "VDuckie") + '</span></div>';
  }

  function journeyMarkup() {
    var current = snapshot;
    var stages = Object.keys(root.VDuckieAvatarConfig.levels).map(function (key) { return root.VDuckieAvatarConfig.levels[key]; });
    return stages.map(function (stage) {
      var unlocked = current.level >= stage.level || canUseDeveloper(), isCurrent = Math.min(current.level, 10) === stage.level;
      var dev = canUseDeveloper() ? ' data-v93-preview-level="' + stage.level + '" tabindex="0" role="button"' : "";
      return '<article class="v92-stage-card' + (unlocked ? ' is-unlocked' : ' is-locked') + (isCurrent ? ' is-current' : '') + '"' + dev + '><div class="v92-stage-card-visual">' + avatarMarkup({ level: stage.level, progressPercent: stage.level === 1 && current.level === 1 ? current.progressPercent : 0, size: "compact", selectedItems: selectionForDisplay(), allowIncompatible: canUseDeveloper(), previewMode: canUseDeveloper() }) + '</div><div><span>LV' + stage.level + '</span><h3>' + esc(stage.name) + '</h3><p>' + esc(conditionFor(stage.level)) + '</p><strong>' + esc(rewardFor(stage.level)) + '</strong></div><i aria-hidden="true">' + (unlocked ? '✓' : '🔒') + '</i></article>';
    }).join("");
  }

  function categoryLabel(key) { var categories = avatar.getCategories(); for (var i = 0; i < categories.length; i += 1) if (categories[i].key === key) return categories[i].label; return key; }
  function selectedSummary(selection) { return ["outfit", "glasses", "accessory", "skin", "background", "effect"].map(function (type) { var item = avatar.getItem(type, selection[type]); return '<span>' + esc(categoryLabel(type)) + ': ' + esc(item && item.name || "Mặc định") + '</span>'; }).join(""); }
  function itemAccess(item, level) { var reason = avatar.incompatibilityReason(item, level), future = item.status === "preview", developer = canUseDeveloper(); return { selectable: developer || (!future && !reason), incompatible: !!reason, future: future, reason: future && !developer ? "Sắp mở." : reason, developerWarning: developer && (future || !!reason) }; }
  function itemStateLabel(item, access, selected) { if (selected) return "Đang dùng"; if (access.future && !canUseDeveloper()) return "Sắp mở"; if (!access.selectable) return "Bị khóa"; if (access.developerWarning) return "Dev preview"; return "Đã mở"; }

  function wardrobeItemsMarkup() {
    var level = displayLevel(), items = avatar.getItems(wardrobeCategory), selectedCode = wardrobeDraft && wardrobeDraft[wardrobeCategory];
    return items.map(function (item) {
      var access = itemAccess(item, level), selected = selectedCode === item.code;
      var classes = "v94-item-card" + (selected ? " is-selected" : "") + (!access.selectable ? " is-locked" : "") + (access.incompatible ? " is-incompatible" : "") + (canUseDeveloper() ? " is-developer" : "");
      var reason = access.reason || (item.minimumLevel > 1 ? "Mở từ Level " + item.minimumLevel : "Có thể sử dụng");
      return '<button type="button" class="' + classes + '" data-v94-item-type="' + esc(wardrobeCategory) + '" data-v94-item-code="' + esc(item.code) + '"' + (!access.selectable ? ' disabled' : '') + '><span class="v94-item-visual">' + avatar.itemThumbnail(item, level) + '</span><span class="v94-item-copy"><strong>' + esc(item.name) + '</strong><small>' + esc(reason) + '</small></span><span class="v94-item-state">' + esc(itemStateLabel(item, access, selected)) + '</span></button>';
    }).join("");
  }
  function wardrobeTabsMarkup() { return avatar.getCategories().map(function (category) { return '<button type="button" class="' + (wardrobeCategory === category.key ? 'active' : '') + '" data-v94-category="' + esc(category.key) + '">' + esc(category.label) + '</button>'; }).join(""); }
  function wardrobeLockedMarkup() { return '<div class="v92-wardrobe-locked"><span aria-hidden="true">🔒</span><h3>Tủ đồ mở ở Level 7</h3><p>Tiếp tục học để mở trang phục, kính, phụ kiện, nền và hiệu ứng. Tủ đồ không có XP hoặc Level riêng.</p></div>'; }
  function wardrobeMarkup() {
    if (!isWardrobeUnlocked()) return wardrobeLockedMarkup();
    if (!wardrobeDraft) wardrobeDraft = copy(isDeveloperPreview() ? preview.wardrobe : savedSelection);
    var noticeClass = wardrobeNoticeKind ? " " + wardrobeNoticeKind : "";
    return '<div class="v94-wardrobe-shell"><section class="v94-wardrobe-preview"><span class="v92-kicker">PREVIEW TRỰC TIẾP</span>' + avatarMarkup({ selectedItems: wardrobeDraft, allowIncompatible: canUseDeveloper(), previewMode: true, size: "large" }) + '<h3>' + esc(stageFor(displayLevel()).name) + '</h3><div class="v94-wardrobe-selected">' + selectedSummary(wardrobeDraft) + '</div><p>Chọn item để mặc thử. Chỉ lưu sau khi bấm “Sử dụng”.</p></section><section class="v94-wardrobe-browser"><nav class="v94-wardrobe-tabs" aria-label="Nhóm Tủ đồ">' + wardrobeTabsMarkup() + '</nav><p class="v94-wardrobe-notice' + noticeClass + '">' + esc(wardrobeNotice || (canUseDeveloper() ? "Developer có thể xem thử item không tương thích; cảnh báo vẫn được hiển thị." : "Chọn một item tương thích với Level hiện tại.")) + '</p><div class="v94-item-list">' + wardrobeItemsMarkup() + '</div><div class="v94-wardrobe-actions"><span class="v94-save-status" data-v94-save-status></span><button type="button" data-v94-reset>Đặt lại</button><button type="button" data-v94-close>Đóng</button><button type="button" data-v94-use>Sử dụng</button></div></section></div>';
  }

  function ensureOverlay() {
    if (overlay && overlay.isConnected) return;
    overlay = document.createElement("div"); overlay.id = "v92EvolutionOverlay"; overlay.className = "v92-overlay"; overlay.hidden = true;
    overlay.innerHTML = '<section class="v92-dialog" role="dialog" aria-modal="true" aria-labelledby="v92DialogTitle"><header><div><span class="v92-kicker">VDUCKIE EVOLUTION</span><h2 id="v92DialogTitle">Hành trình tiến hóa</h2></div><button type="button" class="v92-close" data-v92-close aria-label="Đóng">×</button></header><nav class="v92-tabs"><button type="button" class="active" data-v92-tab="journey">Hành trình</button><button type="button" data-v92-tab="wardrobe">Tủ đồ</button></nav><div class="v92-dialog-body"><div id="v92Journey" class="v92-journey-grid"></div><div id="v92Wardrobe" class="v92-wardrobe" hidden></div></div></section>';
    document.body.appendChild(overlay); journeyHost = byId("v92Journey"); wardrobeHost = byId("v92Wardrobe");
  }
  function ensureLevelUpOverlay() {
    if (levelUpOverlay && levelUpOverlay.isConnected) return;
    levelUpOverlay = document.createElement("div"); levelUpOverlay.id = "v94LevelUpOverlay"; levelUpOverlay.className = "v92-overlay"; levelUpOverlay.hidden = true;
    levelUpOverlay.innerHTML = '<section class="v92-dialog" role="dialog" aria-modal="true" aria-labelledby="v94LevelUpTitle"><header><div><span class="v92-kicker">LEVEL UP</span><h2 id="v94LevelUpTitle">VDuckie tiến hóa!</h2></div><button type="button" class="v92-close" data-v93-levelup-close aria-label="Đóng">×</button></header><div class="v94-levelup-content" data-v94-levelup-content></div></section>';
    document.body.appendChild(levelUpOverlay);
  }
  function renderLevelUpModal() { ensureLevelUpOverlay(); var host = levelUpOverlay.querySelector("[data-v94-levelup-content]"); if (!host || !snapshot) return; var stage = stageFor(snapshot.level); host.innerHTML = avatarMarkup({ level: snapshot.level, selectedItems: selectionForDisplay(), size: "medium", previewMode: isDeveloperPreview() }) + '<h3>Level ' + snapshot.level + ' · ' + esc(stage.name) + '</h3><p>' + esc(rewardFor(snapshot.level)) + '</p><button type="button" data-v93-levelup-close>Tiếp tục học</button>'; }
  function showLevelUpModal() { renderLevelUpModal(); levelUpOverlay.hidden = false; document.body.classList.add("v92-modal-open"); }
  function closeLevelUpModal() { if (!levelUpOverlay || levelUpOverlay.hidden) return; levelUpOverlay.hidden = true; if (!overlay || overlay.hidden) document.body.classList.remove("v92-modal-open"); }
  function renderOverlay() { ensureOverlay(); journeyHost.innerHTML = journeyMarkup(); wardrobeHost.innerHTML = wardrobeMarkup(); }
  function setTab(name) {
    if (!overlay) return; var wardrobe = name === "wardrobe";
    if (wardrobe && !wardrobeOpen) { wardrobeOpen = true; wardrobeDirty = false; wardrobeDraft = copy(isDeveloperPreview() ? preview.wardrobe : savedSelection); wardrobeNotice = ""; wardrobeNoticeKind = ""; }
    if (!wardrobe && wardrobeOpen && wardrobeDirty) { wardrobeDraft = copy(isDeveloperPreview() ? preview.wardrobe : savedSelection); wardrobeDirty = false; }
    wardrobeOpen = wardrobe; journeyHost.hidden = wardrobe; wardrobeHost.hidden = !wardrobe;
    Array.prototype.forEach.call(overlay.querySelectorAll("[data-v92-tab]"), function (button) { button.classList.toggle("active", button.getAttribute("data-v92-tab") === name); });
    byId("v92DialogTitle").textContent = wardrobe ? "Tủ đồ VDuckie" : "Hành trình tiến hóa"; renderOverlay();
  }
  function openOverlay(tab) { if (!snapshot) return; ensureOverlay(); lastFocus = document.activeElement; overlay.hidden = false; document.body.classList.add("v92-modal-open"); setTab(tab === "wardrobe" ? "wardrobe" : "journey"); var close = overlay.querySelector("[data-v92-close]"); if (close) close.focus(); }
  function closeOverlay() { if (!overlay || overlay.hidden) return; if (wardrobeOpen && wardrobeDirty) { wardrobeDraft = copy(isDeveloperPreview() ? preview.wardrobe : savedSelection); wardrobeDirty = false; scheduleCard(); } wardrobeOpen = false; overlay.hidden = true; if (!levelUpOverlay || levelUpOverlay.hidden) document.body.classList.remove("v92-modal-open"); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function findHomeHost() { return byId("v865HomeMain") || document.querySelector(".v865-home-main") || byId("homeHub"); }
  function ensureCard() { scheduled = false; var host = findHomeHost(); if (!host || !snapshot) return; if (!card || !card.isConnected) { card = document.createElement("article"); card.id = "v92EvolutionCard"; card.className = "v92-evolution-card"; card.setAttribute("aria-live", "polite"); } if (card.parentNode !== host) host.insertBefore(card, host.firstChild); card.innerHTML = cardMarkup(snapshot); syncAnimationClasses(); }
  function scheduleCard() { if (scheduled) return; scheduled = true; root.requestAnimationFrame(ensureCard); }
  function syncAnimationClasses() { var avatars = document.querySelectorAll("[data-v94-avatar]"), names = Object.keys(priorities); for (var i = 0; i < avatars.length; i += 1) { for (var n = 0; n < names.length; n += 1) avatars[i].classList.remove("is-" + names[n]); avatars[i].classList.add("is-" + activeAnimation); avatars[i].setAttribute("data-v94-animation", activeAnimation); } }
  function play(name, options) { options = options || {}; if (!priorities[name]) return false; var currentPriority = priorities[activeAnimation] || 0, nextPriority = priorities[name], restartable = name === "outfit-check" || name === "hover" || options.force; if (nextPriority < currentPriority && !restartable) return false; if (animationTimer) root.clearTimeout(animationTimer); activeAnimation = name; syncAnimationClasses(); animationTimer = root.setTimeout(function () { activeAnimation = "idle"; animationTimer = null; syncAnimationClasses(); }, Number(options.duration || durations[name] || 800)); return true; }
  function playEggHatchingPreview() { if (canUseDeveloper()) { preview.active = true; preview.level = 1; preview.eggProgress = 92; refreshDisplaySnapshot(); } play("hatching", { force: true }); return true; }
  function thoughtToggle(button) { if (!button) return; var active = !button.classList.contains("is-thinking"); Array.prototype.forEach.call(document.querySelectorAll("[data-v94-avatar].is-thinking"), function (other) { other.classList.remove("is-thinking"); other.setAttribute("aria-expanded", "false"); }); if (thoughtTimer) root.clearTimeout(thoughtTimer); if (active) { button.classList.add("is-thinking"); button.setAttribute("aria-expanded", "true"); thoughtTimer = root.setTimeout(function () { button.classList.remove("is-thinking"); button.setAttribute("aria-expanded", "false"); }, 3400); } }

  function previewItem(type, code) { if (!wardrobeDraft) wardrobeDraft = copy(isDeveloperPreview() ? preview.wardrobe : savedSelection); var item = avatar.getItem(type, code), access = itemAccess(item, displayLevel()); if (!access.selectable) { wardrobeNotice = access.reason || "Item chưa thể sử dụng."; wardrobeNoticeKind = "is-warning"; renderOverlay(); return false; } wardrobeDraft[type] = code; wardrobeDirty = true; wardrobeNotice = access.developerWarning ? "Developer Preview: asset này không tương thích hoàn toàn với Level hiện tại." : item.name + " đã được mặc thử. Bấm “Sử dụng” để lưu."; wardrobeNoticeKind = access.developerWarning ? "is-warning" : "is-good"; avatar.preloadItem(type, code); scheduleCard(); renderOverlay(); play("outfit-check", { force: true }); return true; }
  function resetWardrobeDraft() { wardrobeDraft = avatar.defaults(); wardrobeDirty = true; wardrobeNotice = "Đã đưa preview về mặc định. Bấm “Sử dụng” để lưu."; wardrobeNoticeKind = "is-good"; scheduleCard(); renderOverlay(); play("outfit-check", { force: true }); }
  function setSaveStatus(message, kind) { var status = overlay && overlay.querySelector("[data-v94-save-status]"); if (!status) return; status.className = "v94-save-status" + (kind ? " " + kind : ""); status.textContent = message; }
  function useWardrobeDraft() {
    if (!wardrobeDraft) return Promise.resolve(false);
    if (isDeveloperPreview()) { preview.wardrobe = avatar.normalizeSelection(wardrobeDraft); wardrobeDirty = false; wardrobeNotice = "Đã áp dụng trong Developer Preview. Không ghi Supabase."; wardrobeNoticeKind = "is-good"; setSaveStatus("Đã dùng trong preview", "is-good"); scheduleCard(); play("outfit-check", { force: true }); return Promise.resolve(true); }
    setSaveStatus("Đang lưu…", "");
    return customizationStore.save(wardrobeDraft).then(function (result) { savedSelection = copy(result && result.selection || customizationStore.get()); wardrobeDraft = copy(savedSelection); wardrobeDirty = false; wardrobeNotice = result && result.syncStatus === "fallback" ? "Đã lưu trên thiết bị; Supabase sẽ thử lại sau." : "Đã lưu và mặc lên VDuckie."; wardrobeNoticeKind = result && result.syncStatus === "fallback" ? "is-warning" : "is-good"; renderOverlay(); scheduleCard(); setSaveStatus(result && result.syncStatus === "fallback" ? "Đã lưu cục bộ" : "Đã lưu", result && result.syncStatus === "fallback" ? "is-warning" : "is-good"); play("outfit-check", { force: true }); return true; });
  }

  function setPreviewLevelInternal(level) { if (!canUseDeveloper()) return false; preview.active = true; preview.developer = true; preview.level = Math.max(1, Math.min(10, Math.floor(Number(level || 1)))); if (!preview.wardrobe || !Object.keys(preview.wardrobe).length) preview.wardrobe = copy(savedSelection); refreshDisplaySnapshot(); play("level-up", { force: true }); return developerState(); }
  function disablePreviewInternal() { preview.active = false; preview.level = realSnapshot && realSnapshot.level || 1; wardrobeDraft = null; wardrobeDirty = false; refreshDisplaySnapshot(); return true; }
  function setWardrobeInternal(group, itemCode) { if (!canUseDeveloper() || !avatar.getItem(group, itemCode)) return false; preview.wardrobe[group] = itemCode; if (wardrobeOpen) wardrobeDraft = copy(preview.wardrobe); refreshDisplaySnapshot(); play("outfit-check", { force: true }); return true; }
  function developerState() { return Object.freeze({ active: preview.active, level: preview.level, eggProgress: preview.eggProgress, wardrobe: Object.freeze(copy(preview.wardrobe)), real: realSnapshot }); }
  function revokeDeveloper() { authorizationRequest += 1; authorizedUserId = ""; preview.active = false; preview.developer = false; preview.level = realSnapshot && realSnapshot.level || 1; preview.wardrobe = copy(savedSelection); developerBridge = null; refreshDisplaySnapshot(); document.dispatchEvent(new CustomEvent("vduckie:developer-preview-revoked")); }
  function bridgeGuard() { if (!canUseDeveloper()) { revokeDeveloper(); throw new Error("Developer Preview is not authorized for this session"); } }
  function createDeveloperBridge() {
    if (developerBridge) return developerBridge;
    developerBridge = Object.freeze({
      enable: function (level) { bridgeGuard(); return setPreviewLevelInternal(level || (realSnapshot && realSnapshot.level) || 1); },
      disable: function () { if (canUseDeveloper()) return disablePreviewInternal(); return false; },
      setLevel: function (level) { bridgeGuard(); return setPreviewLevelInternal(level); },
      setEggProgress: function (percent) { bridgeGuard(); preview.eggProgress = clamp(percent, 0, 100); if (preview.level === 1 && preview.active) refreshDisplaySnapshot(); return developerState(); },
      setWardrobe: function (group, item) { bridgeGuard(); setWardrobeInternal(group, item); return developerState(); },
      open: function (tab) { bridgeGuard(); openOverlay(tab); return true; },
      test: function (name) { bridgeGuard(); if (name === "egg-hatching") return playEggHatchingPreview(); if (!preview.active) setPreviewLevelInternal((realSnapshot && realSnapshot.level) || 1); if (name === "level-up") { play("level-up", { force: true }); showLevelUpModal(); return true; } if (name === "hover") return play("hover", { force: true }); if (name === "glow") return play("glow", { force: true }); return play(name, { force: true }); },
      getState: function () { bridgeGuard(); return developerState(); },
      getCatalog: function () { bridgeGuard(); var catalog = {}; avatar.getCategories().forEach(function (category) { catalog[category.key] = avatar.getItems(category.key); }); return Object.freeze(catalog); }
    });
    return developerBridge;
  }
  function requestDeveloperBridge() {
    var request = ++authorizationRequest, session = currentSession(), user = session && session.user, client = core && typeof core.client === "function" ? core.client() : null;
    if (!user || normalizedEmail(user.email) !== DEVELOPER_EMAIL || !client || !client.auth || typeof client.auth.getUser !== "function" || !session.access_token) { revokeDeveloper(); return Promise.reject(new Error("Developer Preview is not available")); }
    return client.auth.getUser(session.access_token).then(function (result) { if (request !== authorizationRequest) throw new Error("Developer authorization request expired"); if (result.error) throw result.error; var verified = result.data && result.data.user; if (!verified || verified.id !== user.id || normalizedEmail(verified.email) !== DEVELOPER_EMAIL) throw new Error("Developer account verification failed"); authorizedUserId = verified.id; preview.wardrobe = copy(savedSelection); document.dispatchEvent(new CustomEvent("vduckie:developer-preview-authorized", { detail: { userId: verified.id } })); return createDeveloperBridge(); }).catch(function (error) { if (request === authorizationRequest) revokeDeveloper(); throw error; });
  }

  function onProgress(next) { var oldLevel = previousRealLevel; realSnapshot = next; previousRealLevel = next.level; snapshot = preview.active ? buildPreviewSnapshot(preview.level) : realSnapshot; scheduleCard(); if (overlay && !overlay.hidden) renderOverlay(); if (oldLevel !== null && next.level > oldLevel && !preview.active) root.setTimeout(function () { play("level-up", { force: true }); showLevelUpModal(); }, 40); }
  function bind() {
    document.addEventListener("click", function (event) {
      var open = event.target.closest && event.target.closest("[data-v92-open]"); if (open) { openOverlay(open.getAttribute("data-v92-open")); return; }
      var close = event.target.closest && event.target.closest("[data-v92-close]"); if (close || (overlay && event.target === overlay)) { closeOverlay(); return; }
      var levelUpClose = event.target.closest && event.target.closest("[data-v93-levelup-close]"); if (levelUpClose || (levelUpOverlay && event.target === levelUpOverlay)) { closeLevelUpModal(); return; }
      var tab = event.target.closest && event.target.closest("[data-v92-tab]"); if (tab) { setTab(tab.getAttribute("data-v92-tab")); return; }
      var stage = event.target.closest && event.target.closest("[data-v93-preview-level]"); if (stage && canUseDeveloper()) { setPreviewLevelInternal(stage.getAttribute("data-v93-preview-level")); return; }
      var category = event.target.closest && event.target.closest("[data-v94-category]"); if (category) { wardrobeCategory = category.getAttribute("data-v94-category"); renderOverlay(); return; }
      var item = event.target.closest && event.target.closest("[data-v94-item-code]"); if (item) { previewItem(item.getAttribute("data-v94-item-type"), item.getAttribute("data-v94-item-code")); return; }
      if (event.target.closest && event.target.closest("[data-v94-reset]")) { resetWardrobeDraft(); return; }
      if (event.target.closest && event.target.closest("[data-v94-use]")) { useWardrobeDraft(); return; }
      if (event.target.closest && event.target.closest("[data-v94-close]")) { closeOverlay(); return; }
      var mascot = event.target.closest && event.target.closest("[data-v94-avatar]"); if (mascot) { thoughtToggle(mascot); play("hover", { force: true }); }
    });
    document.addEventListener("pointerover", function (event) { var item = event.target.closest && event.target.closest("[data-v94-item-code]"); if (item) avatar.preloadItem(item.getAttribute("data-v94-item-type"), item.getAttribute("data-v94-item-code")); });
    document.addEventListener("focusin", function (event) { var item = event.target.closest && event.target.closest("[data-v94-item-code]"); if (item) avatar.preloadItem(item.getAttribute("data-v94-item-type"), item.getAttribute("data-v94-item-code")); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") { closeOverlay(); closeLevelUpModal(); return; } var stage = event.target.closest && event.target.closest("[data-v93-preview-level]"); if (stage && canUseDeveloper() && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setPreviewLevelInternal(stage.getAttribute("data-v93-preview-level")); } });
    document.addEventListener("vduckie:exp-updated", function (event) { if (event.detail && event.detail.awarded) root.setTimeout(function () { play("success"); }, 90); });
    document.addEventListener("vduckie:evolution-success", function () { play("success", { force: true }); });
    document.addEventListener("vduckie:evolution-sad", function () { play("sad", { force: true }); });
    document.addEventListener("visibilitychange", function () { document.documentElement.classList.toggle("v94-page-hidden", document.hidden); });
  }
  function init() {
    if (!store || !avatar || !customizationStore) return;
    ensureOverlay(); ensureLevelUpOverlay(); bind(); unsubscribeProgress = store.subscribe(onProgress); realSnapshot = store.getSnapshot(); snapshot = realSnapshot; previousRealLevel = realSnapshot.level; savedSelection = copy(customizationStore.get()); preview.wardrobe = copy(savedSelection);
    unsubscribeCustomization = customizationStore.subscribe(function (next) { savedSelection = copy(next.selection); if (!preview.active) preview.wardrobe = copy(savedSelection); if (!wardrobeOpen || !wardrobeDirty) wardrobeDraft = copy(savedSelection); scheduleCard(); if (overlay && !overlay.hidden) renderOverlay(); });
    scheduleCard();
    if (core && typeof core.onSession === "function") unsubscribeSession = core.onSession(function (session) { var user = session && session.user; if (!user || user.id !== authorizedUserId || normalizedEmail(user.email) !== DEVELOPER_EMAIL) if (authorizedUserId) revokeDeveloper(); });
    if (root.MutationObserver && document.body) { observer = new MutationObserver(function () { if (!card || !card.isConnected || card.parentNode !== findHomeHost()) scheduleCard(); }); observer.observe(document.body, { childList: true, subtree: true }); }
  }
  root.VDuckieEvolution = Object.freeze({ requestDeveloperBridge: requestDeveloperBridge, open: openOverlay, close: closeOverlay, play: play, getStage: function () { return stageFor((snapshot || store.getSnapshot()).level); }, getSelection: function () { return Object.freeze(selectionForDisplay()); }, saveSelection: function (selection) { return customizationStore.save(selection); }, destroy: function () { if (unsubscribeProgress) unsubscribeProgress(); if (unsubscribeCustomization) unsubscribeCustomization(); if (unsubscribeSession) unsubscribeSession(); if (observer) observer.disconnect(); if (animationTimer) root.clearTimeout(animationTimer); if (thoughtTimer) root.clearTimeout(thoughtTimer); } });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})(window, document);