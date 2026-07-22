(function (root) {
  "use strict";
  if (root.VDuckieMascotManifest) return;

  var VERSION = "95.0";
  var STATE_ANY = "*";
  var STATES = Object.freeze(["idle", "hover", "tap", "success", "sad", "outfit-change", "level-up", "hatching", "glow"]);
  var RENDER_MODES = Object.freeze(["full-skin", "sprite", "lottie", "css-egg"]);

  var LEVELS = Object.freeze({
    1: Object.freeze({ level: 1, key: "egg", name: "Quả trứng", symbol: "🥚", defaultAsset: "", renderMode: "css-egg", motionProfile: "egg" }),
    2: Object.freeze({ level: 2, key: "duckling", name: "Vịt con", symbol: "🐥", defaultAsset: "./assets/home/vduckie-vocabulary.webp?v=95.0", renderMode: "full-skin", motionProfile: "duckling" }),
    3: Object.freeze({ level: 3, key: "primary", name: "Học sinh tiểu học", symbol: "🎒", defaultAsset: "./assets/home/vduckie-grammar.webp?v=95.0", renderMode: "full-skin", motionProfile: "primary" }),
    4: Object.freeze({ level: 4, key: "student", name: "Sinh viên đại học", symbol: "🎓", defaultAsset: "./assets/home/vduckie-welcome.webp?v=95.0", renderMode: "full-skin", motionProfile: "student" }),
    5: Object.freeze({ level: 5, key: "office", name: "Nhân viên công sở", symbol: "💻", defaultAsset: "./assets/home/vduckie-listening.webp?v=95.0", renderMode: "full-skin", motionProfile: "office" }),
    6: Object.freeze({ level: 6, key: "manager", name: "Quản lý trẻ", symbol: "📱", defaultAsset: "./assets/home/vduckie-speaking.webp?v=95.0", renderMode: "full-skin", motionProfile: "manager" }),
    7: Object.freeze({ level: 7, key: "expert", name: "Chuyên gia", symbol: "🧰", defaultAsset: "./assets/home/vduckie-welcome.webp?v=95.0", renderMode: "full-skin", motionProfile: "expert" }),
    8: Object.freeze({ level: 8, key: "leader", name: "Lãnh đạo", symbol: "👔", defaultAsset: "./assets/home/vduckie-vocabulary.webp?v=95.0", renderMode: "full-skin", motionProfile: "leader" }),
    9: Object.freeze({ level: 9, key: "master", name: "Master", symbol: "✨", defaultAsset: "./assets/home/vduckie-listening.webp?v=95.0", renderMode: "full-skin", motionProfile: "master" }),
    10: Object.freeze({ level: 10, key: "grandmaster", name: "Grandmaster", symbol: "🏆", defaultAsset: "./assets/home/vduckie-speaking.webp?v=95.0", renderMode: "full-skin", motionProfile: "grandmaster" })
  });

  function item(data) {
    var result = Object.assign({
      status: "available",
      minimumLevel: 1,
      compatibleLevels: null,
      renderMode: "full-skin",
      thumbnail: "•",
      assetStatus: "available"
    }, data || {});
    result.minimumLevel = Number(result.minimumLevel || 1);
    return Object.freeze(result);
  }

  var ITEMS = Object.freeze({
    outfit: Object.freeze([
      item({ code: "stage-default", type: "outfit", name: "Trang phục theo Level", thumbnail: "🦆", renderMode: "full-skin" }),
      item({ code: "primary-school", type: "outfit", name: "Học sinh tiểu học", thumbnail: "🎒", minimumLevel: 3, compatibleLevels: [3, 4] }),
      item({ code: "university", type: "outfit", name: "Sinh viên", thumbnail: "🎓", minimumLevel: 4, compatibleLevels: [4, 5, 6] }),
      item({ code: "office", type: "outfit", name: "Nhân viên ERP", thumbnail: "💼", minimumLevel: 5, compatibleLevels: [5, 6, 7, 8, 9, 10] }),
      item({ code: "manager", type: "outfit", name: "Quản lý trẻ", thumbnail: "📊", minimumLevel: 6, compatibleLevels: [6, 7, 8, 9, 10] }),
      item({ code: "executive", type: "outfit", name: "Vest lãnh đạo", thumbnail: "👔", minimumLevel: 7, compatibleLevels: [7, 8, 9, 10] }),
      item({ code: "master", type: "outfit", name: "Master", thumbnail: "✨", minimumLevel: 9, compatibleLevels: [9, 10] }),
      item({ code: "grandmaster", type: "outfit", name: "Grandmaster", thumbnail: "🏆", minimumLevel: 10, compatibleLevels: [10] })
    ]),
    accessory: Object.freeze([
      item({ code: "none", type: "accessory", name: "Không phụ kiện", thumbnail: "—", renderMode: "full-skin" }),
      item({ code: "book", type: "accessory", name: "Sách học", thumbnail: "📘", minimumLevel: 2, compatibleLevels: [2, 3, 4] }),
      item({ code: "headphones", type: "accessory", name: "Tai nghe luyện nghe", thumbnail: "🎧", minimumLevel: 4, compatibleLevels: [4, 5, 6, 7, 8, 9, 10] }),
      item({ code: "microphone", type: "accessory", name: "Micro luyện nói", thumbnail: "🎤", minimumLevel: 4, compatibleLevels: [4, 5, 6, 7, 8, 9, 10] }),
      item({ code: "laptop", type: "accessory", name: "Laptop ERP", thumbnail: "💻", minimumLevel: 5, compatibleLevels: [5, 6, 7, 8, 9, 10], status: "missing", assetStatus: "missing" }),
      item({ code: "tablet", type: "accessory", name: "Tablet quản lý", thumbnail: "📱", minimumLevel: 6, compatibleLevels: [6, 7, 8, 9, 10], status: "missing", assetStatus: "missing" })
    ]),
    background: Object.freeze([
      item({ code: "default", type: "background", name: "Nền mặc định", thumbnail: "◯", renderMode: "css", cssClass: "bg-default" }),
      item({ code: "classroom", type: "background", name: "Lớp học", thumbnail: "🏫", renderMode: "css", cssClass: "bg-classroom", minimumLevel: 3 }),
      item({ code: "office", type: "background", name: "Văn phòng", thumbnail: "🏢", renderMode: "css", cssClass: "bg-office", minimumLevel: 5 }),
      item({ code: "master", type: "background", name: "Sân khấu Master", thumbnail: "🌌", renderMode: "css", cssClass: "bg-master", minimumLevel: 9 })
    ]),
    effect: Object.freeze([
      item({ code: "none", type: "effect", name: "Không hiệu ứng", thumbnail: "—", renderMode: "css", cssClass: "fx-none" }),
      item({ code: "sparkle", type: "effect", name: "Lấp lánh", thumbnail: "✨", renderMode: "css", cssClass: "fx-sparkle", minimumLevel: 4 }),
      item({ code: "success", type: "effect", name: "Success", thumbnail: "✅", renderMode: "css", cssClass: "fx-success", minimumLevel: 5 }),
      item({ code: "glow", type: "effect", name: "Glow", thumbnail: "🌟", renderMode: "css", cssClass: "fx-glow", minimumLevel: 7 })
    ]),
    skin: Object.freeze([
      item({ code: "default", type: "skin", name: "Mặc định", renderMode: "legacy-hidden" })
    ]),
    glasses: Object.freeze([
      item({ code: "none", type: "glasses", name: "Không dùng", renderMode: "legacy-hidden" })
    ])
  });

  var DEFAULTS = Object.freeze({
    skin: "default",
    outfit: "stage-default",
    glasses: "none",
    accessory: "none",
    background: "default",
    effect: "none"
  });

  function variant(data) {
    return Object.freeze(Object.assign({
      level: 1,
      outfit: "stage-default",
      accessory: "none",
      state: STATE_ANY,
      asset: "",
      renderMode: "full-skin",
      fallbackAsset: "",
      frames: 1,
      fps: 12,
      columns: 1,
      rows: 1
    }, data || {}));
  }

  var VARIANTS = Object.freeze([
    variant({ level: 1, state: STATE_ANY, renderMode: "css-egg" }),
    variant({ level: 2, asset: "./assets/home/vduckie-vocabulary.webp?v=95.0" }),
    variant({ level: 3, asset: "./assets/home/vduckie-grammar.webp?v=95.0" }),
    variant({ level: 4, asset: "./assets/home/vduckie-welcome.webp?v=95.0" }),
    variant({ level: 5, asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 6, asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),
    variant({ level: 7, asset: "./assets/home/vduckie-welcome.webp?v=95.0" }),
    variant({ level: 8, asset: "./assets/home/vduckie-vocabulary.webp?v=95.0" }),
    variant({ level: 9, asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 10, asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),

    variant({ level: 3, outfit: "primary-school", asset: "./assets/home/vduckie-grammar.webp?v=95.0" }),
    variant({ level: 4, outfit: "primary-school", asset: "./assets/home/vduckie-grammar.webp?v=95.0" }),
    variant({ level: 4, outfit: "university", asset: "./assets/home/vduckie-welcome.webp?v=95.0" }),
    variant({ level: 5, outfit: "university", asset: "./assets/home/vduckie-welcome.webp?v=95.0" }),
    variant({ level: 6, outfit: "university", asset: "./assets/home/vduckie-welcome.webp?v=95.0" }),
    variant({ level: 5, outfit: "office", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 6, outfit: "office", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 7, outfit: "office", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 8, outfit: "office", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 9, outfit: "office", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 10, outfit: "office", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 6, outfit: "manager", asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),
    variant({ level: 7, outfit: "manager", asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),
    variant({ level: 8, outfit: "manager", asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),
    variant({ level: 9, outfit: "manager", asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),
    variant({ level: 10, outfit: "manager", asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),
    variant({ level: 7, outfit: "executive", asset: "./assets/home/vduckie-welcome.webp?v=95.0" }),
    variant({ level: 8, outfit: "executive", asset: "./assets/home/vduckie-vocabulary.webp?v=95.0" }),
    variant({ level: 9, outfit: "executive", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 10, outfit: "executive", asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),
    variant({ level: 9, outfit: "master", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 10, outfit: "master", asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),
    variant({ level: 10, outfit: "grandmaster", asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),

    variant({ level: 2, outfit: "*", accessory: "book", asset: "./assets/home/vduckie-vocabulary.webp?v=95.0" }),
    variant({ level: 3, outfit: "*", accessory: "book", asset: "./assets/home/vduckie-grammar.webp?v=95.0" }),
    variant({ level: 4, outfit: "*", accessory: "book", asset: "./assets/home/vduckie-welcome.webp?v=95.0" }),
    variant({ level: 4, outfit: "*", accessory: "headphones", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 5, outfit: "*", accessory: "headphones", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 6, outfit: "*", accessory: "headphones", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 7, outfit: "*", accessory: "headphones", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 8, outfit: "*", accessory: "headphones", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 9, outfit: "*", accessory: "headphones", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 10, outfit: "*", accessory: "headphones", asset: "./assets/home/vduckie-listening.webp?v=95.0" }),
    variant({ level: 4, outfit: "*", accessory: "microphone", asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),
    variant({ level: 5, outfit: "*", accessory: "microphone", asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),
    variant({ level: 6, outfit: "*", accessory: "microphone", asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),
    variant({ level: 7, outfit: "*", accessory: "microphone", asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),
    variant({ level: 8, outfit: "*", accessory: "microphone", asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),
    variant({ level: 9, outfit: "*", accessory: "microphone", asset: "./assets/home/vduckie-speaking.webp?v=95.0" }),
    variant({ level: 10, outfit: "*", accessory: "microphone", asset: "./assets/home/vduckie-speaking.webp?v=95.0" })
  ]);

  var MOTION = Object.freeze({
    1: Object.freeze({ profile: "egg", accentX: "50%", accentY: "36%", transformOrigin: "50% 78%" }),
    2: Object.freeze({ profile: "duckling", accentX: "54%", accentY: "29%", transformOrigin: "50% 72%" }),
    3: Object.freeze({ profile: "primary", accentX: "59%", accentY: "27%", transformOrigin: "50% 76%" }),
    4: Object.freeze({ profile: "student", accentX: "58%", accentY: "25%", transformOrigin: "50% 74%" }),
    5: Object.freeze({ profile: "office", accentX: "52%", accentY: "49%", transformOrigin: "50% 76%" }),
    6: Object.freeze({ profile: "manager", accentX: "55%", accentY: "42%", transformOrigin: "50% 76%" }),
    7: Object.freeze({ profile: "expert", accentX: "62%", accentY: "43%", transformOrigin: "50% 76%" }),
    8: Object.freeze({ profile: "leader", accentX: "60%", accentY: "53%", transformOrigin: "50% 77%" }),
    9: Object.freeze({ profile: "master", accentX: "56%", accentY: "40%", transformOrigin: "50% 77%" }),
    10: Object.freeze({ profile: "grandmaster", accentX: "58%", accentY: "31%", transformOrigin: "50% 77%" })
  });

  var CATEGORIES = Object.freeze([
    Object.freeze({ key: "outfit", label: "Trang phục" }),
    Object.freeze({ key: "accessory", label: "Phụ kiện" }),
    Object.freeze({ key: "background", label: "Nền" }),
    Object.freeze({ key: "effect", label: "Hiệu ứng" })
  ]);

  function normalizedLevel(value) {
    return Math.max(1, Math.min(10, Math.floor(Number(value || 1))));
  }

  function findVariant(level, outfit, accessory, state) {
    var candidates = [
      [outfit, accessory, state],
      [outfit, accessory, STATE_ANY],
      ["*", accessory, state],
      ["*", accessory, STATE_ANY],
      [outfit, "none", state],
      [outfit, "none", STATE_ANY],
      ["stage-default", "none", state],
      ["stage-default", "none", STATE_ANY]
    ];
    for (var candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
      var candidate = candidates[candidateIndex];
      for (var index = 0; index < VARIANTS.length; index += 1) {
        var entry = VARIANTS[index];
        if (entry.level === level && entry.outfit === candidate[0] && entry.accessory === candidate[1] && entry.state === candidate[2]) return entry;
      }
    }
    return null;
  }

  function resolve(query) {
    query = query || {};
    var level = normalizedLevel(query.level);
    var outfit = String(query.outfit || DEFAULTS.outfit);
    var accessory = String(query.accessory || DEFAULTS.accessory);
    var state = STATES.indexOf(query.state) >= 0 ? query.state : "idle";
    var exact = findVariant(level, outfit, accessory, state);
    var fallback = findVariant(level, "stage-default", "none", state) || findVariant(level, "stage-default", "none", STATE_ANY);
    var requestedCustomization = outfit !== "stage-default" || accessory !== "none";
    var exactCombination = false;
    if (exact) {
      exactCombination = (exact.outfit === outfit || exact.outfit === "*") && exact.accessory === accessory;
      if (accessory === "none") exactCombination = exact.outfit === outfit;
    }
    var entry = exact || fallback || variant({ level: level, asset: LEVELS[level].defaultAsset, renderMode: LEVELS[level].renderMode });
    return Object.freeze({
      level: level,
      state: state,
      outfit: outfit,
      accessory: accessory,
      asset: entry.asset || LEVELS[level].defaultAsset,
      fallbackAsset: entry.fallbackAsset || LEVELS[level].defaultAsset,
      renderMode: entry.renderMode || LEVELS[level].renderMode,
      frames: Number(entry.frames || 1),
      fps: Number(entry.fps || 12),
      columns: Number(entry.columns || 1),
      rows: Number(entry.rows || 1),
      exactCombination: !requestedCustomization || exactCombination,
      missingCombination: requestedCustomization && !exactCombination,
      source: entry
    });
  }

  var configCompatibility = Object.freeze({
    version: VERSION,
    levels: LEVELS,
    items: ITEMS,
    defaults: DEFAULTS,
    categories: CATEGORIES
  });

  root.VDuckieMascotManifest = Object.freeze({
    version: VERSION,
    states: STATES,
    renderModes: RENDER_MODES,
    levels: LEVELS,
    items: ITEMS,
    defaults: DEFAULTS,
    categories: CATEGORIES,
    variants: VARIANTS,
    motion: MOTION,
    resolve: resolve,
    getLevel: function (level) { return LEVELS[normalizedLevel(level)]; },
    getItems: function (type) { return (ITEMS[type] || []).slice(); },
    getItem: function (type, code) {
      var list = ITEMS[type] || [];
      for (var index = 0; index < list.length; index += 1) if (list[index].code === code) return list[index];
      return null;
    }
  });

  root.VDuckieAvatarConfig = configCompatibility;
})(window);
