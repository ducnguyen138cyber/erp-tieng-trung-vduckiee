(function (root) {
  "use strict";
  if (root.VDuckieEvolutionManifest) return;

  /* Placeholder WebP files already exist in the project. Replace only each `asset`
     path with a final stage-specific WebP later; the rendering logic does not change. */
  root.VDuckieEvolutionManifest = Object.freeze([
    { level: 1, key: "egg", name: "Quả trứng", symbol: "🥚", asset: "", placeholder: true, condition: "Bắt đầu hành trình", reward: "Chuẩn bị nở thành vịt con", thought: "我要出生啦！ (Tôi sắp chào đời rồi!)" },
    { level: 2, key: "duckling", name: "Vịt con", symbol: "🐥", asset: "./assets/home/vduckie-vocabulary.webp?v=73.0", placeholder: true, condition: "Đạt Level 2", reward: "Mở khóa bong bóng suy nghĩ", thought: "今天学什么？ (Hôm nay học gì nhỉ?)" },
    { level: 3, key: "primary", name: "Học sinh tiểu học", symbol: "🎒", asset: "./assets/home/vduckie-grammar.webp?v=73.0", placeholder: true, condition: "Đạt Level 3", reward: "Đồng phục và kính tròn", thought: "我要认真学习！ (Tôi phải học thật chăm!)" },
    { level: 4, key: "student", name: "Sinh viên đại học", symbol: "🎓", asset: "./assets/home/vduckie-welcome.webp?v=92.0", placeholder: true, condition: "Đạt Level 4", reward: "Phong cách sinh viên VDuckie", thought: "知识就是力量！ (Kiến thức chính là sức mạnh!)" },
    { level: 5, key: "office", name: "Nhân viên công sở", symbol: "💻", asset: "./assets/home/vduckie-listening.webp?v=73.0", placeholder: true, condition: "Đạt Level 5", reward: "Laptop và tài liệu ERP", thought: "先检查数据。 (Trước tiên hãy kiểm tra dữ liệu.)" },
    { level: 6, key: "manager", name: "Quản lý trẻ", symbol: "📱", asset: "./assets/home/vduckie-speaking.webp?v=73.0", placeholder: true, condition: "Đạt Level 6", reward: "Vest và tablet quản lý", thought: "我们一起解决问题。 (Chúng ta cùng giải quyết vấn đề.)" },
    { level: 7, key: "expert", name: "Chuyên gia", symbol: "🧰", asset: "./assets/home/vduckie-welcome.webp?v=92.0", placeholder: true, condition: "Đạt Level 7", reward: "Mở khóa Tủ đồ", thought: "这个问题交给我。 (Vấn đề này cứ giao cho tôi.)" },
    { level: 8, key: "leader", name: "Lãnh đạo", symbol: "👔", asset: "./assets/home/vduckie-vocabulary.webp?v=73.0", placeholder: true, condition: "Đạt Level 8", reward: "Trang phục lãnh đạo cao cấp", thought: "方向比速度更重要。 (Hướng đi quan trọng hơn tốc độ.)" },
    { level: 9, key: "master", name: "Master", symbol: "✨", asset: "./assets/home/vduckie-listening.webp?v=73.0", placeholder: true, condition: "Đạt Level 9", reward: "Hiệu ứng glow Master", thought: "每天进步一点点。 (Mỗi ngày tiến bộ thêm một chút.)" },
    { level: 10, key: "grandmaster", name: "Grandmaster", symbol: "🏆", asset: "./assets/home/vduckie-speaking.webp?v=73.0", placeholder: true, condition: "Đạt Level 10", reward: "VDuckie hoàn chỉnh nhất", thought: "学无止境！ (Việc học không có điểm dừng!)" }
  ]);
})(window);
