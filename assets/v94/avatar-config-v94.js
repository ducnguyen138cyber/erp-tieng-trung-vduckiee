(function (root) {
  "use strict";
  if (root.VDuckieAvatarConfig) return;

  var levels = {
    1: { level: 1, key: "egg", name: "Quả trứng", symbol: "🥚", asset: "", renderMode: "css-egg", animation: "egg", thought: "我要出生啦！ (Tôi sắp chào đời rồi!)" },
    2: { level: 2, key: "duckling", name: "Vịt con", symbol: "🐥", asset: "./assets/home/vduckie-vocabulary.webp?v=94.0", renderMode: "full-skin", animation: "duckling", thought: "今天学什么？ (Hôm nay học gì nhỉ?)" },
    3: { level: 3, key: "primary", name: "Học sinh tiểu học", symbol: "🎒", asset: "./assets/home/vduckie-grammar.webp?v=94.0", renderMode: "full-skin", animation: "primary", thought: "我要认真学习！ (Tôi phải học thật chăm!)" },
    4: { level: 4, key: "student", name: "Sinh viên đại học", symbol: "🎓", asset: "./assets/home/vduckie-welcome.webp?v=94.0", renderMode: "full-skin", animation: "student", thought: "知识就是力量！ (Kiến thức chính là sức mạnh!)" },
    5: { level: 5, key: "office", name: "Nhân viên công sở", symbol: "💻", asset: "./assets/home/vduckie-listening.webp?v=94.0", renderMode: "full-skin", animation: "office", thought: "先检查数据。 (Trước tiên hãy kiểm tra dữ liệu.)" },
    6: { level: 6, key: "manager", name: "Quản lý trẻ", symbol: "📱", asset: "./assets/home/vduckie-speaking.webp?v=94.0", renderMode: "full-skin", animation: "manager", thought: "我们一起解决问题。 (Chúng ta cùng giải quyết vấn đề.)" },
    7: { level: 7, key: "expert", name: "Chuyên gia", symbol: "🧰", asset: "./assets/home/vduckie-welcome.webp?v=94.0", renderMode: "full-skin", animation: "expert", thought: "这个问题交给我。 (Vấn đề này cứ giao cho tôi.)" },
    8: { level: 8, key: "leader", name: "Lãnh đạo", symbol: "👔", asset: "./assets/home/vduckie-vocabulary.webp?v=94.0", renderMode: "full-skin", animation: "leader", thought: "方向比速度更重要。 (Hướng đi quan trọng hơn tốc độ.)" },
    9: { level: 9, key: "master", name: "Master", symbol: "✨", asset: "./assets/home/vduckie-listening.webp?v=94.0", renderMode: "full-skin", animation: "master", thought: "每天进步一点点。 (Mỗi ngày tiến bộ thêm một chút.)" },
    10: { level: 10, key: "grandmaster", name: "Grandmaster", symbol: "🏆", asset: "./assets/home/vduckie-speaking.webp?v=94.0", renderMode: "full-skin", animation: "grandmaster", thought: "学无止境！ (Việc học không có điểm dừng!)" }
  };

  function item(data) {
    data.status = data.status || "available";
    data.anchor = data.anchor || "body";
    data.offsetX = Number(data.offsetX || 0);
    data.offsetY = Number(data.offsetY || 0);
    data.scale = Number(data.scale || 1);
    data.zIndex = Number(data.zIndex || 20);
    data.minimumLevel = Number(data.minimumLevel || 1);
    data.compatibleLevels = data.compatibleLevels || null;
    data.renderMode = data.renderMode || "layered";
    return Object.freeze(data);
  }

  var items = {
    skin: [
      item({ code: "default", type: "skin", name: "Màu nguyên bản", thumbnail: "🟡", renderMode: "filter", filter: "none", zIndex: 0 }),
      item({ code: "warm", type: "skin", name: "Vàng ấm", thumbnail: "🌤️", renderMode: "filter", filter: "sepia(.12) saturate(1.1) brightness(1.03)", zIndex: 0, minimumLevel: 2 }),
      item({ code: "cool", type: "skin", name: "Xanh ngọc", thumbnail: "🩵", renderMode: "filter", filter: "hue-rotate(38deg) saturate(.9)", zIndex: 0, minimumLevel: 2 })
    ],
    outfit: [
      item({ code: "stage-default", type: "outfit", name: "Trang phục theo Level", thumbnail: "🦆", renderMode: "stage-default", zIndex: 20 }),
      item({ code: "primary-school", type: "outfit", name: "Học sinh tiểu học", thumbnail: "🎒", asset: "./assets/home/vduckie-grammar.webp?v=94.0", renderMode: "full-skin", compatibleLevels: [3,4], minimumLevel: 3, zIndex: 20 }),
      item({ code: "university", type: "outfit", name: "Sinh viên", thumbnail: "🎓", asset: "./assets/home/vduckie-welcome.webp?v=94.0", renderMode: "full-skin", compatibleLevels: [4,5,6], minimumLevel: 4, zIndex: 20 }),
      item({ code: "office", type: "outfit", name: "Nhân viên ERP", thumbnail: "💻", asset: "./assets/home/vduckie-listening.webp?v=94.0", renderMode: "full-skin", compatibleLevels: [5,6,7,8,9,10], minimumLevel: 5, zIndex: 20 }),
      item({ code: "manager", type: "outfit", name: "Quản lý trẻ", thumbnail: "📱", asset: "./assets/home/vduckie-speaking.webp?v=94.0", renderMode: "full-skin", compatibleLevels: [6,7,8,9,10], minimumLevel: 6, zIndex: 20 }),
      item({ code: "executive", type: "outfit", name: "Vest lãnh đạo", thumbnail: "👔", asset: "./assets/home/vduckie-welcome.webp?v=94.0", renderMode: "full-skin", compatibleLevels: [7,8,9,10], minimumLevel: 7, zIndex: 20 }),
      item({ code: "grandmaster", type: "outfit", name: "Grandmaster", thumbnail: "🏆", asset: "./assets/home/vduckie-speaking.webp?v=94.0", renderMode: "full-skin", compatibleLevels: [9,10], minimumLevel: 9, zIndex: 20, status: "preview" })
    ],
    glasses: [
      item({ code: "none", type: "glasses", name: "Không kính", thumbnail: "—", renderMode: "none", anchor: "face", zIndex: 40 }),
      item({ code: "round", type: "glasses", name: "Kính tròn", thumbnail: "👓", asset: "./assets/duck-customization/glasses/round.svg?v=94.0", anchor: "face", offsetX: 0, offsetY: -7, scale: 1, minimumLevel: 2, compatibleLevels: [2,3,4,5,6,7,8,9,10], zIndex: 40 }),
      item({ code: "square", type: "glasses", name: "Kính vuông", thumbnail: "▣", asset: "./assets/duck-customization/glasses/square.svg?v=94.0", anchor: "face", offsetX: 0, offsetY: -7, scale: 1, minimumLevel: 4, compatibleLevels: [4,5,6,7,8,9,10], zIndex: 40 }),
      item({ code: "gold", type: "glasses", name: "Kính vàng", thumbnail: "✨", asset: "./assets/duck-customization/glasses/gold.svg?v=94.0", anchor: "face", offsetX: 0, offsetY: -7, scale: 1, minimumLevel: 8, compatibleLevels: [8,9,10], zIndex: 40, status: "preview" })
    ],
    accessory: [
      item({ code: "none", type: "accessory", name: "Không phụ kiện", thumbnail: "—", renderMode: "none", zIndex: 50 }),
      item({ code: "book", type: "accessory", name: "Sách học", thumbnail: "📘", asset: "./assets/duck-customization/accessories/book.svg?v=94.0", anchor: "hand-front", offsetX: 7, offsetY: 12, scale: .92, minimumLevel: 3, compatibleLevels: [3,4,5,6,7,8,9,10], zIndex: 52 }),
      item({ code: "laptop", type: "accessory", name: "Laptop ERP", thumbnail: "💻", asset: "./assets/duck-customization/accessories/laptop.svg?v=94.0", anchor: "hand-front", offsetX: 4, offsetY: 22, scale: .94, minimumLevel: 5, compatibleLevels: [5,6,7,8,9,10], zIndex: 52 }),
      item({ code: "tablet", type: "accessory", name: "Tablet quản lý", thumbnail: "📱", asset: "./assets/duck-customization/accessories/tablet.svg?v=94.0", anchor: "hand-front", offsetX: 10, offsetY: 13, scale: .9, minimumLevel: 6, compatibleLevels: [6,7,8,9,10], zIndex: 52 }),
      item({ code: "badge", type: "accessory", name: "Huy hiệu chuyên gia", thumbnail: "🏅", asset: "./assets/duck-customization/accessories/badge.svg?v=94.0", anchor: "chest", offsetX: 0, offsetY: 2, scale: .86, minimumLevel: 7, compatibleLevels: [7,8,9,10], zIndex: 48 })
    ],
    background: [
      item({ code: "default", type: "background", name: "Nền mặc định", thumbnail: "◯", renderMode: "css", cssClass: "bg-default", zIndex: 1 }),
      item({ code: "classroom", type: "background", name: "Lớp học", thumbnail: "🏫", renderMode: "css", cssClass: "bg-classroom", minimumLevel: 3, zIndex: 1 }),
      item({ code: "office", type: "background", name: "Văn phòng", thumbnail: "🏢", renderMode: "css", cssClass: "bg-office", minimumLevel: 5, zIndex: 1 }),
      item({ code: "master", type: "background", name: "Sân khấu Master", thumbnail: "🌌", renderMode: "css", cssClass: "bg-master", minimumLevel: 9, zIndex: 1 })
    ],
    effect: [
      item({ code: "none", type: "effect", name: "Không hiệu ứng", thumbnail: "—", renderMode: "css", cssClass: "fx-none", zIndex: 70 }),
      item({ code: "sparkle", type: "effect", name: "Lấp lánh", thumbnail: "✨", renderMode: "css", cssClass: "fx-sparkle", minimumLevel: 4, zIndex: 70 }),
      item({ code: "success", type: "effect", name: "Success", thumbnail: "✅", renderMode: "css", cssClass: "fx-success", minimumLevel: 5, zIndex: 70 }),
      item({ code: "glow", type: "effect", name: "Glow", thumbnail: "🌟", renderMode: "css", cssClass: "fx-glow", minimumLevel: 7, zIndex: 70 })
    ]
  };

  var defaults = Object.freeze({
    skin: "default",
    outfit: "stage-default",
    glasses: "none",
    accessory: "none",
    background: "default",
    effect: "none"
  });

  root.VDuckieAvatarConfig = Object.freeze({
    version: "94.0",
    levels: Object.freeze(levels),
    items: Object.freeze(items),
    defaults: defaults,
    categories: Object.freeze([
      { key: "outfit", label: "Trang phục" },
      { key: "glasses", label: "Kính" },
      { key: "accessory", label: "Phụ kiện" },
      { key: "skin", label: "Màu sắc" },
      { key: "background", label: "Nền" },
      { key: "effect", label: "Hiệu ứng" }
    ])
  });
})(window);