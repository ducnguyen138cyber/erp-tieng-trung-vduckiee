#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const ACCESS_DATE = "2026-07-29";
const BASELINE_COMMIT = "9cee996de80c775ba288b896455917fd89add81c";
const ARCHITECTURE_FILE = "data/hsk/curriculum/architecture.json";
const AUDIT_FILE = "reports/hsk-c0-content-audit.json";
const DOC_FILE = "docs/hsk-curriculum-map.md";

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(read(relativePath));
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = stable(value[key]);
    return result;
  }, {});
}

function serialize(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : serialize(value)).digest("hex");
}

function write(relativePath, content) {
  const file = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function loadCollection(directory, indexFile) {
  const index = json(`${directory}/${indexFile}`);
  return index.shards.flatMap((shard) => json(`${directory}/${shard.file}`).records || []);
}

function loadLegacyHsk1() {
  let source = "";
  for (let part = 1; part <= 4; part += 1) source += read(`assets/v75/hsk1-data.part${part}.txt`);
  const window = {};
  vm.runInNewContext(source, { window }, { filename: "hsk1-v75-data.js" });
  return window.HSK1_V75_LESSONS;
}

const sources = Object.freeze({
  standard: "moe-gf0025-2021-standard",
  standardQa: "moe-gf0025-2021-qa",
  exam: "cti-hsk3-syllabus-pdf-2026",
  rollout: "cti-hsk3-pilot-notice-2026",
  competency: "cti-hsk3-competency-profile-2026",
  pedagogy: "blcu-new-standard-pedagogy-2025",
  original: "vduckie-hsk1-phase2a-original"
});

const examVocabularyCumulative = Object.freeze({
  1: 300,
  2: 500,
  3: 1000,
  4: 2000,
  5: 3600,
  6: 5400,
  "7-9": 11000
});

const standardBenchmarks = Object.freeze({
  1: { syllables: 269, characters: 300, vocabulary: 500, grammar: 48 },
  2: { syllables: 468, characters: 600, vocabulary: 1272, grammar: 129 },
  3: { syllables: 608, characters: 900, vocabulary: 2245, grammar: 210 },
  4: { syllables: 724, characters: 1200, vocabulary: 3245, grammar: 286 },
  5: { syllables: 822, characters: 1500, vocabulary: 4316, grammar: 357 },
  6: { syllables: 908, characters: 1800, vocabulary: 5456, grammar: 424 },
  "7-9": { syllables: 1110, characters: 3000, vocabulary: 11092, grammar: 572 }
});

const sharedLessonSections = [
  { id: "objectives", required: true, purposeVi: "Nêu năng lực có thể thực hiện sau bài học." },
  { id: "warm-up", required: true, purposeVi: "Kích hoạt ngữ cảnh, trải nghiệm và kiến thức nền." },
  { id: "vocabulary", required: true, purposeVi: "Dạy nghĩa, cách dùng, kết hợp từ và lỗi dễ mắc." },
  { id: "characters", required: true, purposeVi: "Nhận diện chữ; luyện viết theo yêu cầu cấp độ." },
  { id: "grammar", required: true, purposeVi: "Dạy hình thức, ý nghĩa, ngữ dụng và đối chiếu." },
  { id: "input", required: true, purposeVi: "Hội thoại hoặc bài đọc chính có mục đích giao tiếp." },
  { id: "comprehension", required: true, purposeVi: "Giải mã ý chính, chi tiết, hàm ý phù hợp cấp độ." },
  { id: "listening", required: true, purposeVi: "Nghe ý chính, chi tiết, chép chính tả và shadowing." },
  { id: "speaking", required: true, purposeVi: "Phản xạ, role-play hoặc sản sinh lời nói." },
  { id: "reading", required: true, purposeVi: "Đọc có chiến lược và giải thích đáp án." },
  { id: "writing", required: true, purposeVi: "Viết từ chữ/câu đến văn bản theo cấp độ." },
  { id: "translation", required: false, purposeVi: "Trung–Việt hoặc Việt–Trung khi mục tiêu yêu cầu." },
  { id: "integrated-practice", required: true, purposeVi: "Vận dụng nhiều kỹ năng trong một nhiệm vụ." },
  { id: "summary", required: true, purposeVi: "Tóm tắt điều đã học và checklist tự đánh giá." },
  { id: "spaced-review", required: true, purposeVi: "Gắn lịch ôn 1/3/7/14/30 ngày và mục tiêu yếu." },
  { id: "real-world-task", required: true, purposeVi: "Hoàn thành một tình huống dùng tiếng Trung thật." }
];

const stageDefinitions = [
  {
    id: "elementary",
    labelVi: "Sơ cấp",
    levels: [1, 2, 3],
    progressionVi: "Từ âm–từ–câu kiểm soát đến tương tác quen thuộc nhiều lượt và đoạn văn ngắn.",
    discourseFocus: "Giao tiếp đời sống, học tập và công việc cơ bản.",
    translationRole: "Chuyển đạt nghĩa ngắn để kiểm tra hiểu; không dạy dịch từng chữ."
  },
  {
    id: "intermediate",
    labelVi: "Trung cấp",
    levels: [4, 5, 6],
    progressionVi: "Từ diễn đạt mạch lạc về tình huống quen thuộc đến lập luận và xử lý văn bản dài.",
    discourseFocus: "Đời sống xã hội, nghề nghiệp, giáo dục, truyền thông và kiến thức phổ thông.",
    translationRole: "Dịch ngắn có ngữ cảnh, sắc thái, cấu trúc thông tin và thuật ngữ phổ thông."
  },
  {
    id: "advanced",
    labelVi: "Cao cấp",
    levels: [7, 8, 9],
    progressionVi: "Từ xử lý diễn ngôn nâng cao đến tổng hợp, phản biện và sử dụng ngôn ngữ chuyên nghiệp chính xác.",
    discourseFocus: "Học thuật, nghề nghiệp, xã hội, khoa học, chính sách, văn học và liên văn bản.",
    translationRole: "Dịch nói/viết, biên tập và giải thích lựa chọn theo mục đích, đối tượng và phong cách."
  }
];

const levelSpecs = [
  {
    level: 1,
    stage: "elementary",
    competency: "Giao tiếp đơn giản về thông tin cá nhân, sự vật, thời gian, nơi chốn và nhu cầu thường nhật.",
    outcomes: [
      "Chào hỏi, tự giới thiệu và hỏi–đáp thông tin cá nhân cơ bản.",
      "Xử lý giao dịch rất ngắn về thời gian, ăn uống, mua sắm, phương hướng và sức khỏe.",
      "Nghe/đọc thông tin rõ ràng trong câu ngắn; tạo câu đơn có trật tự đúng.",
      "Nhận diện âm tiết, thanh điệu và chữ Hán trọng tâm; tự sửa các lỗi phát âm phổ biến của người Việt."
    ],
    units: [
      ["Định hướng phát âm và chữ Hán", "Phân biệt thanh điệu, nhóm âm khó với người Việt và viết nét cơ bản."],
      ["Gặp gỡ lần đầu", "Chào, nói tên, quốc tịch, vai trò và hỏi lại lịch sự."],
      ["Gia đình và người quen", "Giới thiệu quan hệ, số người và thông tin rất ngắn về một người."],
      ["Lớp học và ngôn ngữ", "Hỏi nghĩa, xin nhắc lại, nói khả năng và đồ dùng học tập."],
      ["Số, ngày và cuộc hẹn", "Nói số, ngày, giờ, điện thoại và hẹn thời điểm đơn giản."],
      ["Một ngày của tôi", "Nói hoạt động, nơi chốn, trình tự và thói quen cơ bản."],
      ["Ăn uống hằng ngày", "Gọi món đơn giản, nói thích/không thích, số lượng và nhu cầu."],
      ["Mua sắm và đồ vật", "Hỏi giá, màu sắc, kích thước, lượng và đưa ra lựa chọn."],
      ["Đi lại và phương hướng", "Hỏi nơi chốn, vị trí, phương tiện và chỉ đường rất ngắn."],
      ["Thời tiết, sức khỏe và kế hoạch", "Mô tả thời tiết, cảm giác cơ thể và kế hoạch gần."]
    ],
    coreLessons: 24,
    languageFocus: [
      "Trật tự chủ–vị–tân và vị ngữ tính từ",
      "是, 有, 在 và câu tồn hiện cơ bản",
      "的 chỉ sở hữu/định ngữ",
      "不, 没（有） và câu phủ định",
      "吗, 呢, 谁, 什么, 哪, 哪儿, 几, 多少, 怎么, 怎么样",
      "Số–lượng từ–danh từ; biểu thức thời gian đứng trước động từ",
      "会, 能, 可以, 想, 要",
      "正在/在…呢, 了 ở mức nhập môn, 吧 để đề nghị"
    ],
    characterScope: "Nhận diện inventory HSK1 chính thức; luyện viết bộ chữ tần suất cao sau khi xác minh với danh sách viết chính thức.",
    listening: "Âm tiết, từ, câu 2–12 chữ và hội thoại 2–4 lượt; nghe ý chính, số liệu, lựa chọn và chép câu ngắn.",
    speaking: "Bắt chước thanh điệu, trả lời nhanh, hỏi–đáp, role-play 30–60 giây và giới thiệu 45–90 giây.",
    reading: "Biển báo, danh thiếp, menu, tin nhắn và đoạn 20–80 chữ có hỗ trợ pinyin tùy chọn.",
    writing: "Nét/chữ trọng tâm, sắp xếp thành câu và viết 3–5 câu theo mẫu có thay thông tin.",
    translation: "Chuyển đạt câu ngắn để chứng minh hiểu nghĩa; ưu tiên tiếng Việt tự nhiên, không đối dịch từng chữ.",
    textCharacters: [5, 80],
    audioSeconds: [5, 35],
    speechSyllablesPerMinute: [90, 135],
    advancement: { knowledge: 80, receptive: 75, productive: 70, mandatory: ["phát âm nền tảng", "final assessment", "nhiệm vụ nói"] }
  },
  {
    level: 2,
    stage: "elementary",
    competency: "Giao tiếp cơ bản trong đời sống, học tập và công việc quen thuộc bằng chuỗi câu có liên kết.",
    outcomes: [
      "Duy trì hội thoại ngắn về lịch trình, dịch vụ, sở thích, trải nghiệm và nhu cầu.",
      "Hiểu thông báo/tin nhắn ngắn và kể lại một chuỗi sự việc đơn giản.",
      "Viết đoạn thực dụng 5–8 câu với thời gian, trình tự và quan hệ nguyên nhân cơ bản."
    ],
    units: [
      ["Ôn cầu nối HSK1", "Khôi phục phản xạ âm, chữ, câu và chiến lược học."],
      ["Lịch sinh hoạt và tần suất", "Sắp xếp lịch, nói tần suất, thời lượng và thay đổi kế hoạch."],
      ["Nhà ở và khu phố", "Mô tả phòng, vị trí, tiện ích và hỏi thông tin khu vực."],
      ["Đi lại và du lịch ngắn", "Mua vé, hỏi tuyến, nói điểm đi/đến và xử lý thay đổi."],
      ["Ăn uống và dịch vụ", "Đặt món, nêu yêu cầu, nhận xét và giải quyết thiếu/sai đơn giản."],
      ["Sức khỏe và chăm sóc bản thân", "Mô tả triệu chứng cơ bản, lời khuyên và lịch hẹn."],
      ["Học tập và kỹ năng", "Nói mục tiêu, tiến bộ, khó khăn và cách luyện tập."],
      ["Công việc thường ngày", "Mô tả nhiệm vụ, đồng nghiệp, thời hạn và nhờ hỗ trợ."],
      ["Giải trí và quan hệ", "Mời, từ chối lịch sự, kể hoạt động và bày tỏ cảm xúc."],
      ["Trải nghiệm và kế hoạch", "Kể việc đã làm, so sánh lựa chọn và lập kế hoạch gần."]
    ],
    coreLessons: 28,
    languageFocus: ["了/过 ở mức cơ bản", "正在 và thời lượng", "比 và so sánh", "因为…所以…", "虽然…但是…", "先…再…然后…", "bổ ngữ kết quả nhập môn", "câu kiêm ngữ và câu chữ 把 nhập môn có kiểm soát"],
    characterScope: "Mở rộng nhận diện/viết theo inventory HSK2; ôn có khoảng cách chữ HSK1 qua từ ghép mới.",
    listening: "Hội thoại 4–8 lượt, thông báo và chuyện ngắn 20–60 giây; nghe ý chính, thời gian và quan hệ sự việc.",
    speaking: "Role-play 1–2 phút, kể lại theo tranh, giải thích lựa chọn và phản hồi lời mời/đề nghị.",
    reading: "Tin nhắn, thông báo, hướng dẫn và đoạn 60–180 chữ.",
    writing: "Câu liên kết và đoạn 60–100 chữ: tin nhắn, ghi chú, mô tả và kể ngắn.",
    translation: "Chuyển đạt thông tin thực dụng ngắn, chú ý chủ ngữ lược bỏ và trật tự thời gian.",
    textCharacters: [30, 180],
    audioSeconds: [15, 65],
    speechSyllablesPerMinute: [105, 150],
    advancement: { knowledge: 80, receptive: 75, productive: 72, mandatory: ["unit checkpoints", "final assessment", "nói kể theo tranh"] }
  },
  {
    level: 3,
    stage: "elementary",
    competency: "Giao tiếp hiệu quả về các nhiệm vụ quen thuộc, xử lý vấn đề đơn giản và diễn đạt thành đoạn.",
    outcomes: [
      "Xử lý tình huống du lịch, học tập, công việc và quan hệ xã hội có nhiều bước.",
      "Nắm ý chính/chi tiết của hội thoại và bài kể gần tốc độ tự nhiên.",
      "Kể, mô tả và viết đoạn có trình tự, nguyên nhân, kết quả và đánh giá."
    ],
    units: [
      ["Cầu nối sang giao tiếp theo đoạn", "Ôn cấu trúc nền và chuyển từ câu rời sang đoạn."],
      ["Học tập và chiến lược", "Mô tả mục tiêu, phương pháp, kết quả và điều chỉnh."],
      ["Tìm việc và môi trường làm việc", "Đọc tin tuyển dụng, trao đổi lịch và nhiệm vụ."],
      ["Du lịch và sự cố", "Lập lịch trình, hỏi thông tin và giải quyết lỡ/chậm/thất lạc."],
      ["Nhà ở và chuyển nhà", "So sánh, thương lượng, mô tả quy trình và vấn đề."],
      ["Sức khỏe và lối sống", "Mô tả tình trạng, nguyên nhân, thói quen và lời khuyên."],
      ["Quan hệ và giao tiếp số", "Giải thích hiểu lầm, bày tỏ thái độ và ứng xử online."],
      ["Mua sắm và quyền lợi", "So sánh sản phẩm, đổi trả và trình bày lý do."],
      ["Kể chuyện và trải nghiệm", "Dùng mốc thời gian, điểm ngoặt và cảm nhận."],
      ["Văn hóa đời sống", "Hiểu lời mời, quà tặng, phép lịch sự và khác biệt ngữ cảnh."],
      ["Môi trường quanh ta", "Mô tả thay đổi, vấn đề và giải pháp cá nhân."],
      ["Dự án tổng hợp sơ cấp", "Hoàn thành nhiệm vụ nghe–nói–đọc–viết nhiều bước."]
    ],
    coreLessons: 36,
    languageFocus: ["把/被 cơ bản", "bổ ngữ kết quả/hướng/khả năng", "越…越…", "一边…一边…", "除了…以外…", "只要…就…", "nối câu và lược bỏ", "câu phức nguyên nhân–điều kiện–nhượng bộ cơ bản"],
    characterScope: "Hoàn tất inventory sơ cấp theo đề cương; ưu tiên nhận diện nhanh, gõ/viết từ nhiệm vụ và phân biệt chữ gần hình.",
    listening: "Hội thoại nhiều lượt, thông báo và kể chuyện 45–120 giây ở tốc độ chậm đến gần tự nhiên.",
    speaking: "Kể lại 2–3 phút, mô tả tranh/sự kiện, giải quyết vấn đề và nêu ý kiến có lý do.",
    reading: "Email, hướng dẫn, câu chuyện và bài thông tin 150–350 chữ.",
    writing: "Email/đoạn kể hoặc mô tả 100–180 chữ, có liên kết và tự sửa theo checklist.",
    translation: "Dịch câu/đoạn có hướng dẫn, xử lý khác biệt trật tự và đại từ theo ngữ cảnh.",
    textCharacters: [100, 350],
    audioSeconds: [35, 130],
    speechSyllablesPerMinute: [120, 165],
    advancement: { knowledge: 82, receptive: 78, productive: 75, mandatory: ["mid-level assessment", "final assessment", "project sơ cấp"] }
  },
  {
    level: 4,
    stage: "intermediate",
    competency: "Giao tiếp đầy đủ, liên tục về đời sống, học tập và công việc; giải thích quan điểm quen thuộc.",
    outcomes: [
      "Theo dõi hội thoại dài, chỉ dẫn và bài trình bày phổ thông; nhận biết thái độ rõ.",
      "Trình bày/viết có bố cục về trải nghiệm, quy trình, vấn đề và giải pháp.",
      "Đọc suy luận từ bài thực dụng và bài báo phổ thông ngắn."
    ],
    units: [
      ["Cầu nối diễn ngôn trung cấp", "Ôn liên kết, tóm tắt và chiến lược đoán nghĩa."],
      ["Nhà ở và dịch vụ đô thị", "Trao đổi hợp đồng, sửa chữa và khiếu nại lịch sự."],
      ["Tuyển dụng và phỏng vấn", "Giới thiệu năng lực, hỏi việc và phản hồi phỏng vấn."],
      ["Làm việc nhóm", "Phân công, cập nhật, góp ý và xử lý bất đồng."],
      ["Giáo dục và lựa chọn học tập", "So sánh chương trình, mục tiêu và kết quả."],
      ["Du lịch có kế hoạch", "Đọc hướng dẫn, điều chỉnh lịch và giải quyết sự cố."],
      ["Sức khỏe cộng đồng", "Hiểu tư vấn, trình bày thói quen và đánh giá khuyến nghị."],
      ["Truyền thông và mạng xã hội", "Tóm tắt thông tin, phân biệt ý kiến và sự kiện."],
      ["Môi trường và tiêu dùng", "Phân tích hành vi, tác động và đề xuất thay đổi."],
      ["Văn hóa và quan hệ", "Điều chỉnh cách nói theo vai, khoảng cách và ngữ cảnh."],
      ["Kể chuyện có điểm nhìn", "Tổ chức sự kiện, nhân vật, động cơ và kết quả."],
      ["Dự án giao tiếp thực tế", "Thực hiện phỏng vấn, báo cáo và phản hồi."]
    ],
    coreLessons: 40,
    languageFocus: ["liên kết tham chiếu và tỉnh lược", "把/被 mở rộng", "bổ ngữ phức", "既然…就…", "即使…也…", "不但…而且…", "mệnh đề định ngữ dài", "khẩu ngữ–trang trọng cơ bản"],
    characterScope: "Mở rộng chữ trung cấp theo inventory chính thức; tăng tốc nhận diện và viết đoạn, không chỉ chép chữ đơn.",
    listening: "Hội thoại dài, phỏng vấn, thông báo và kể chuyện 1–3 phút gần tốc độ tự nhiên.",
    speaking: "Trình bày 3–4 phút, so sánh, giải thích quan điểm và xử lý tình huống nghề nghiệp quen thuộc.",
    reading: "Email, bài báo, truyện và hướng dẫn 300–650 chữ với câu hỏi suy luận.",
    writing: "Email, tường thuật, mô tả và báo cáo 180–300 chữ.",
    translation: "Dịch ngắn theo ngữ cảnh, ưu tiên chức năng câu và sắc thái lịch sự.",
    textCharacters: [220, 650],
    audioSeconds: [60, 190],
    speechSyllablesPerMinute: [140, 185],
    advancement: { knowledge: 82, receptive: 80, productive: 76, mandatory: ["speaking task", "writing portfolio", "mock challenge"] }
  },
  {
    level: 5,
    stage: "intermediate",
    competency: "Giao tiếp chính xác, phù hợp hơn trong công việc và học thuật phổ thông; tóm tắt và lập luận đơn giản.",
    outcomes: [
      "Hiểu phỏng vấn, tin ngắn và thuyết trình; phân biệt ý chính, chứng cứ và thái độ.",
      "Tóm tắt, trình bày và viết nhiều đoạn có lập luận nhất quán.",
      "Điều chỉnh từ ngữ theo ngữ cảnh thân mật, trung tính và trang trọng."
    ],
    units: [
      ["Tóm tắt và cấu trúc thông tin", "Ghi ý, nhận diện luận điểm và diễn đạt lại."],
      ["Giáo dục và phát triển cá nhân", "Phân tích lựa chọn, động lực và kết quả."],
      ["Công nghệ trong đời sống", "Giải thích tính năng, tác động và rủi ro."],
      ["Truyền thông và độ tin cậy", "So sánh nguồn, nhận diện thiên lệch và tóm tắt tin."],
      ["Kinh tế đời sống", "Giải thích giá cả, tiêu dùng, tiết kiệm và xu hướng."],
      ["Tổ chức và quản lý", "Báo cáo tiến độ, ưu tiên, rủi ro và cải tiến."],
      ["Tâm lý và quan hệ", "Phân tích cảm xúc, động cơ và chiến lược giao tiếp."],
      ["Sức khỏe và khoa học phổ thông", "Đọc/đánh giá lời khuyên và chứng cứ cơ bản."],
      ["Môi trường và thành phố", "Lập luận về chính sách đời sống và trách nhiệm."],
      ["Văn hóa và sáng tạo", "Phân tích tác phẩm/sự kiện ở mức phổ thông."],
      ["Lịch sử qua câu chuyện", "Kết nối sự kiện, bối cảnh và góc nhìn."],
      ["Thuyết trình và hỏi đáp", "Tổ chức bài nói, dùng dẫn chứng và xử lý câu hỏi."],
      ["Viết thực dụng nhiều đoạn", "Email trang trọng, báo cáo và đề xuất."],
      ["Dự án tổng hợp", "Tổng hợp hai nguồn ngắn thành sản phẩm nói/viết."]
    ],
    coreLessons: 48,
    languageFocus: ["liên kết logic đa dạng", "danh hóa và nén thông tin", "câu phức nhiều tầng vừa phải", "thái độ và mức độ chắc chắn", "từ nối văn viết", "so sánh cấu trúc gần nghĩa", "collocation và register"],
    characterScope: "Tăng tự động hóa đọc chữ, nhận diện hình vị và dùng chữ/từ đúng register trong văn bản nhiều đoạn.",
    listening: "Phỏng vấn, tin ngắn và bài nói 2–5 phút ở tốc độ tự nhiên, có ghi chú.",
    speaking: "Tóm tắt và trình bày 4–6 phút, trả lời chất vấn và đưa dẫn chứng.",
    reading: "Bài báo, bình luận và bài giải thích 500–1000 chữ.",
    writing: "Tóm tắt, email trang trọng, báo cáo/đề xuất 300–500 chữ.",
    translation: "Trung–Việt và Việt–Trung đoạn ngắn, xử lý kết hợp từ, register và cấu trúc thông tin.",
    textCharacters: [400, 1000],
    audioSeconds: [100, 320],
    speechSyllablesPerMinute: [160, 205],
    advancement: { knowledge: 84, receptive: 82, productive: 78, mandatory: ["source-based writing", "presentation", "final assessment"] }
  },
  {
    level: 6,
    stage: "intermediate",
    competency: "Dùng tiếng Trung phong phú, lưu loát trong bối cảnh nghề nghiệp, học thuật và chủ đề phổ thông tương đối phức tạp.",
    outcomes: [
      "Xử lý văn bản dài, suy luận hàm ý và đánh giá quan hệ giữa luận điểm–chứng cứ.",
      "Tranh luận, thuyết trình và viết bài phân tích có bố cục, sắc thái và phản hồi quan điểm khác.",
      "Diễn đạt lại/tóm tắt nguồn mà không làm sai lập trường."
    ],
    units: [
      ["Đọc sâu và suy luận", "Theo dõi tham chiếu, hàm ý, cấu trúc và giọng điệu."],
      ["Tin tức và diễn ngôn công cộng", "Phân tích khung tin, nguồn và cách trình bày."],
      ["Khoa học và công nghệ", "Giải thích quy trình, bằng chứng, giới hạn và tác động."],
      ["Kinh tế và tổ chức", "Đọc dữ liệu mô tả, nguyên nhân, rủi ro và quyết định."],
      ["Giáo dục và nghiên cứu", "Hiểu câu hỏi nghiên cứu, phương pháp và kết quả phổ thông."],
      ["Xã hội và thế hệ", "So sánh quan điểm, bối cảnh và hệ quả."],
      ["Lịch sử và ký ức", "Phân biệt sự kiện, diễn giải và góc nhìn."],
      ["Văn học và phong cách", "Đọc hình ảnh, giọng kể và hiệu quả biểu đạt."],
      ["Môi trường và chính sách", "Đánh giá lợi ích, chi phí và bên liên quan."],
      ["Đạo đức trong đời sống", "Xây lập luận, phản ví dụ và nhượng bộ."],
      ["Giao tiếp nghề nghiệp nâng cao", "Chủ trì họp, đàm phán và xử lý bất đồng."],
      ["Tóm tắt và diễn đạt lại", "Tổng hợp nguồn, tránh chép và giữ độ chính xác."],
      ["Tranh luận có chứng cứ", "Phản biện lập luận và trả lời chất vấn."],
      ["Dự án kết thúc trung cấp", "Thực hiện báo cáo đa kỹ năng có nguồn."]
    ],
    coreLessons: 52,
    languageFocus: ["cấu trúc văn viết và nén thông tin", "phương tiện liên kết diễn ngôn", "hàm ý và tiền giả định cơ bản", "thành ngữ có ngữ cảnh", "thái độ/stance", "câu phức đa tầng", "đối chiếu register"],
    characterScope: "Hoàn tất inventory HSK6; đọc nhanh từ đa hình vị, sửa lỗi chữ trong văn bản và chọn từ theo văn phong.",
    listening: "Tin, phỏng vấn, tranh luận và bài giảng 3–7 phút ở tốc độ tự nhiên, có hàm ý.",
    speaking: "Thuyết trình/tranh luận 6–8 phút, tóm tắt nguồn và phản hồi có cấu trúc.",
    reading: "Bài báo, báo cáo, tiểu luận phổ thông và văn học 800–1800 chữ.",
    writing: "Bài luận, báo cáo và tổng hợp nguồn 500–800 chữ.",
    translation: "Dịch văn bản phổ thông tương đối dài, giải thích lựa chọn với đa nghĩa, thuật ngữ và phong cách.",
    textCharacters: [700, 1800],
    audioSeconds: [160, 440],
    speechSyllablesPerMinute: [175, 220],
    advancement: { knowledge: 85, receptive: 83, productive: 80, mandatory: ["analytical essay", "debate", "mock exam"] }
  },
  {
    level: 7,
    stage: "advanced",
    competency: "Dùng tiếng Trung chuẩn mực, lưu loát trong nghề nghiệp, chuyên môn phổ thông và học thuật; bắt đầu dịch có hệ thống.",
    outcomes: [
      "Theo dõi bài giảng, bài báo và lập luận nâng cao; ghi chú và tóm tắt chính xác.",
      "Trình bày quan điểm có luận cứ, nhận biết phong cách và chuyển register có kiểm soát.",
      "Dịch thông tin nói/viết có chuẩn bị và giải thích vấn đề thuật ngữ cơ bản."
    ],
    units: [
      ["Cầu nối diễn ngôn cao cấp", "Chuẩn hóa ghi chú, tóm tắt, register và chiến lược từ vựng 7–9."],
      ["Báo chí và cấu trúc tin", "Phân tích tiêu đề, nguồn, dẫn lời, khung và hàm ý."],
      ["Bài giảng và ghi chú", "Tổ chức luận điểm, ví dụ, chuyển ý và câu hỏi."],
      ["Nghiên cứu nhập môn", "Đọc tóm tắt, câu hỏi, phương pháp và kết luận."],
      ["Chính sách công cơ bản", "Nhận diện vấn đề, bên liên quan, công cụ và tác động."],
      ["Kinh tế và dữ liệu mô tả", "Diễn giải xu hướng, nguyên nhân và giới hạn."],
      ["Khoa học và truyền thông", "So sánh nghiên cứu với cách báo chí diễn giải."],
      ["Văn hóa và bản sắc", "Phân tích khái niệm, ví dụ và khác biệt góc nhìn."],
      ["Văn học hiện đại", "Đọc giọng kể, hình tượng và bối cảnh."],
      ["Giao tiếp nghề nghiệp", "Thuyết trình, thương lượng và biên bản ở mức nâng cao."],
      ["Lập luận và phản biện", "Kiểm tra giả định, chứng cứ và ngụy biện phổ biến."],
      ["Dịch thông tin", "Dịch tin, giới thiệu, tóm tắt và lời nói có chuẩn bị."],
      ["Phiên dịch nối tiếp nhập môn", "Nghe–ghi chú–chuyển đạt đoạn ngắn theo ý."],
      ["Viết học thuật nhập môn", "Xây đoạn luận, trích dẫn ý và tránh sao chép."],
      ["Dự án cấp 7", "Tổng hợp nhiều nguồn thành báo cáo và thuyết trình."]
    ],
    coreLessons: 56,
    languageFocus: ["tổ chức diễn ngôn nâng cao", "thái độ học thuật", "danh hóa/cấu trúc bị động trang trọng", "thành ngữ theo register", "hàm ý", "chuỗi lập luận", "đối chiếu biên dịch"],
    characterScope: "Dùng combined official 7–9 inventory; pedagogicTargetLevel=7 chỉ là trình tự nội bộ, không phải membership chính thức.",
    listening: "Bài giảng, phỏng vấn, tin và thảo luận 4–9 phút; ghi chú, suy luận và tổng hợp.",
    speaking: "Tóm tắt học thuật, thuyết trình 8–10 phút, bảo vệ quan điểm và phiên dịch nối tiếp đoạn ngắn.",
    reading: "Báo chí, bài luận và văn bản học thuật phổ thông 1000–2400 chữ.",
    writing: "Phân tích có nguồn, báo cáo và tóm tắt 700–1100 chữ.",
    translation: "Dịch thông tin và lập luận phổ thông; nêu bối cảnh, thuật ngữ, phương án và lỗi dịch từng chữ.",
    textCharacters: [900, 2400],
    audioSeconds: [240, 560],
    speechSyllablesPerMinute: [185, 225],
    advancement: { knowledge: 85, receptive: 84, productive: 81, mandatory: ["translation portfolio", "academic presentation", "level challenge"] }
  },
  {
    level: 8,
    stage: "advanced",
    competency: "Dùng tiếng Trung thích hợp, có chiều sâu trong nghề nghiệp và học thuật; tổng hợp, phản biện và dịch theo mục đích.",
    outcomes: [
      "Đánh giá nhiều nguồn, lập trường, hàm ý và độ tin cậy trong diễn ngôn phức tạp.",
      "Tranh luận, phản biện và viết bài dựa trên nguồn với register nhất quán.",
      "Dịch/hiệu đính văn bản phức tạp vừa phải và biện minh lựa chọn."
    ],
    units: [
      ["Tổng hợp nhiều nguồn", "Kết nối điểm đồng/khác, bằng chứng và khoảng trống."],
      ["Chính sách và quản trị", "Đánh giá mục tiêu, công cụ, hệ quả và đánh đổi."],
      ["Luật và ngôn ngữ quy phạm", "Hiểu định nghĩa, điều kiện, ngoại lệ và mức độ bắt buộc."],
      ["Kinh tế và phân tích", "Diễn giải dữ liệu, mô hình, rủi ro và quan điểm."],
      ["Đạo đức và công nghệ", "Xây luận điểm, phản biện và xử lý xung đột giá trị."],
      ["Khoa học, bằng chứng và bất định", "Đánh giá phương pháp, xác suất và giới hạn kết luận."],
      ["Giáo dục và bất bình đẳng", "Tổng hợp nghiên cứu và quan điểm chính sách."],
      ["Môi trường và phát triển", "Phân tích hệ thống, đánh đổi và trách nhiệm."],
      ["Truyền thông và tu từ", "Phân tích framing, ẩn dụ, giọng điệu và thuyết phục."],
      ["Văn học và phê bình", "Đối chiếu cách đọc, thủ pháp và bối cảnh."],
      ["Xã hội và bản sắc", "Xử lý khái niệm trừu tượng và quan điểm đa chiều."],
      ["Giao tiếp lãnh đạo", "Chủ trì, đàm phán, giải trình và xử lý khủng hoảng."],
      ["Tranh luận và phản bác", "Xây rebuttal, concession và tổng kết."],
      ["Dịch theo chức năng", "Điều chỉnh nội dung cho đối tượng, thể loại và mục đích."],
      ["Phiên dịch nối tiếp", "Xử lý đoạn dài hơn, số liệu, thuật ngữ và tự sửa."],
      ["Dự án cấp 8", "Tổng hợp nguồn, phản biện và sản phẩm song ngữ."]
    ],
    coreLessons: 60,
    languageFocus: ["tu từ và lập luận", "cấu trúc thông tin", "ẩn dụ khái niệm", "hàm ý tinh tế", "register chuyên nghiệp", "collocation nâng cao", "biên tập và chuyển đổi thể loại"],
    characterScope: "Tiếp tục combined 7–9 inventory theo tần suất/chủ đề; tăng độ chính xác khi đọc, viết, biên tập và dịch.",
    listening: "Bài giảng, tranh luận, tin chuyên sâu và họp 5–11 phút; nhận diện stance và tổng hợp nguồn.",
    speaking: "Tranh luận 10–12 phút, phản biện, thuyết trình dựa trên nguồn và phiên dịch nối tiếp.",
    reading: "Bài nghiên cứu phổ thông, chính sách, bình luận và văn học 1600–3400 chữ.",
    writing: "Bài dựa trên nhiều nguồn, policy brief và biên tập 1000–1500 chữ.",
    translation: "Dịch/hiệu đính văn bản thông tin–lập luận; xử lý register, thuật ngữ và nhiều phương án hợp lệ.",
    textCharacters: [1400, 3400],
    audioSeconds: [300, 680],
    speechSyllablesPerMinute: [195, 235],
    advancement: { knowledge: 86, receptive: 85, productive: 83, mandatory: ["multi-source essay", "debate", "bilingual portfolio"] }
  },
  {
    level: 9,
    stage: "advanced",
    competency: "Dùng tiếng Trung chính xác, sâu sắc trong bối cảnh nghề nghiệp, chuyên môn và học thuật phức tạp.",
    outcomes: [
      "Xử lý diễn ngôn mật độ cao, liên văn bản, hàm ý và biến đổi phong cách.",
      "Sản sinh lập luận dài, tổng hợp nghiên cứu và thảo luận ở mức chuyên nghiệp.",
      "Dịch nói/viết, biên tập và bảo vệ giải pháp dựa trên mục đích giao tiếp."
    ],
    units: [
      ["Đọc nghiên cứu chuyên sâu", "Đánh giá câu hỏi, phương pháp, bằng chứng và giới hạn."],
      ["Lý thuyết và khái niệm trừu tượng", "Giải thích, đối chiếu và vận dụng khái niệm."],
      ["Chính sách và phân tích hệ thống", "Tổng hợp nhiều cấp độ, bên liên quan và hệ quả dài hạn."],
      ["Kinh tế vĩ mô và xã hội", "Phân tích lập luận, dữ liệu và giả định."],
      ["Khoa học liên ngành", "Kết nối mô hình, bằng chứng và cách truyền đạt."],
      ["Luật, hành chính và ngoại giao", "Xử lý register chính thức, điều kiện và tính mơ hồ có chủ ý."],
      ["Triết học và đạo đức", "Xây/đánh giá lập luận trừu tượng và phản ví dụ."],
      ["Văn học và liên văn bản", "Phân tích phong cách, giọng, biểu tượng và đối thoại văn bản."],
      ["Truyền thông công chúng", "Biên tập thông điệp cho đối tượng và kênh khác nhau."],
      ["Nghiên cứu và tổng quan tài liệu", "Tổ chức nguồn, lập khoảng trống và tổng hợp."],
      ["Thuyết trình chuyên nghiệp", "Thuyết trình dài, hỏi đáp khó và ứng biến."],
      ["Tranh luận chuyên sâu", "Xử lý định nghĩa, chứng cứ, phản bác và tổng kết."],
      ["Dịch học thuật", "Dịch khái niệm, lập luận, trích dẫn và cấu trúc thông tin."],
      ["Dịch nghề nghiệp", "Dịch báo cáo, hành chính, truyền thông và tình huống họp."],
      ["Phiên dịch và quản lý thông tin", "Ghi chú, phân đoạn, tự sửa và giữ lập trường người nói."],
      ["Capstone HSK 1–9", "Hoàn thành nghiên cứu/tình huống đa kỹ năng có phản biện."]
    ],
    coreLessons: 64,
    languageFocus: ["ngữ dụng và hàm ý cấp cao", "tu từ thể loại", "liên văn bản", "register chuyên ngành", "nén/mở rộng thông tin", "thành ngữ có kiểm soát", "biên tập và lý giải lựa chọn dịch"],
    characterScope: "Hoàn tất combined 7–9 inventory theo nhu cầu đọc/viết chuyên sâu; không tuyên bố một official Level 9 word list riêng.",
    listening: "Hội thảo, diễn thuyết, tranh luận và nội dung chuyên sâu 6–14 phút với mật độ cao.",
    speaking: "Thuyết trình 12–15 phút, đối thoại chuyên môn, phản biện và phiên dịch nối tiếp nâng cao.",
    reading: "Nghiên cứu, báo cáo, chính sách, văn học và văn bản chuyên ngành 2200–5000 chữ.",
    writing: "Tổng hợp nghiên cứu, báo cáo, bài luận và sản phẩm chuyên nghiệp 1400–2200 chữ.",
    translation: "Dịch nói/viết và biên tập ở mức nâng cao; trình bày thuật ngữ, phương án, đánh đổi và tiêu chí chất lượng.",
    textCharacters: [2000, 5000],
    audioSeconds: [360, 840],
    speechSyllablesPerMinute: [205, 245],
    advancement: { knowledge: 87, receptive: 86, productive: 84, mandatory: ["capstone", "translation/interpreting portfolio", "mastery review"] }
  }
];

function buildUnit(level, entry, index) {
  return {
    id: `hsk${level}-unit-${String(index + 1).padStart(2, "0")}`,
    order: index + 1,
    titleVi: entry[0],
    communicativeTaskVi: entry[1],
    lifecycle: {
      introduce: index === 0 ? ["chiến lược cấp độ", "năng lực mới của unit"] : ["năng lực mới của unit"],
      retrieve: index === 0 ? ["đầu vào cấp trước"] : [`nội dung unit ${Math.max(1, index - 1)}`],
      expand: index > 1 ? [`ngôn ngữ từ unit ${index - 1} trong ngữ cảnh mới`] : [],
      assess: ["nhiệm vụ giao tiếp", "mini-checkpoint", "tự đánh giá"]
    },
    reviewAfterUnit: index % 2 === 1,
    contentStatus: "planned"
  };
}

function buildLevel(spec) {
  const officialBand = spec.level <= 6 ? String(spec.level) : "7-9";
  const vocabularyTarget = spec.level <= 6 ? examVocabularyCumulative[spec.level] : examVocabularyCumulative["7-9"];
  const benchmark = spec.level <= 6 ? standardBenchmarks[spec.level] : standardBenchmarks["7-9"];
  return {
    id: `hsk${spec.level}`,
    level: spec.level,
    stage: spec.stage,
    officialCompetencyParaphraseVi: spec.competency,
    outputObjectivesVi: spec.outcomes,
    communicativeDomains: spec.units.map((entry) => entry[0]),
    officialAlignment: {
      framework: "GF0025-2021",
      examSyllabus: "CTI-HSK3.0-2026",
      examVocabularyBand: officialBand,
      examVocabularyCumulativeTarget: vocabularyTarget,
      standardCumulativeBenchmark: benchmark,
      advancedBandSplitPolicy: spec.level >= 7
        ? "Combined official 7-9 membership; pedagogicTargetLevel is internal sequencing only."
        : "Official level-specific exam inventory.",
      sourceIds: [sources.standard, sources.exam, sources.competency]
    },
    levelStructure: {
      orientation: true,
      unitCount: spec.units.length,
      coreLessonCount: spec.coreLessons,
      reviews: "Sau mỗi hai unit và cumulative review giữa/cuối cấp.",
      midLevelAssessment: true,
      skillWorkshops: spec.level <= 3
        ? ["phát âm", "nghe–nói", "đọc–viết"]
        : spec.level <= 6
          ? ["nghe ghi chú", "thuyết trình", "viết theo thể loại"]
          : ["đọc học thuật", "tranh luận", "dịch nói", "dịch viết"],
      finalAssessment: true,
      mockOrChallenge: true,
      remedialPractice: true,
      masteryReview: true
    },
    units: spec.units.map((entry, index) => buildUnit(spec.level, entry, index)),
    languageSystem: {
      vocabulary: {
        scopeVi: `Bám inventory chính thức ${officialBand}; mục tiêu tích lũy ${vocabularyTarget.toLocaleString("vi-VN")} từ theo đề cương thi mới.`,
        authoringRequirements: ["nghĩa tiếng Việt theo ngữ cảnh", "từ loại", "collocation", "sắc thái", "từ dễ nhầm", "lỗi người Việt", "ba ví dụ đã review"],
        officialSplit: spec.level <= 6
      },
      characters: {
        scopeVi: spec.characterScope,
        authoringRequirements: ["bộ thủ", "cấu trúc", "số nét", "stroke data có nguồn", "từ đã học", "mnemonic gắn nhãn", "chữ dễ nhầm"]
      },
      grammar: {
        focusVi: spec.languageFocus,
        standardCumulativeBenchmark: benchmark.grammar,
        authoringRequirements: ["mục tiêu giao tiếp", "công thức", "điều kiện dùng", "ngữ dụng", "phủ định/nghi vấn", "đối chiếu", "lỗi người Việt", "bài sản sinh"]
      },
      pronunciation: spec.level <= 3
        ? "Explicit Vietnamese-learner pronunciation strand with perception, articulation, minimal pairs and shadowing."
        : "Pronunciation continues through rhythm, prominence, connected speech, register and presentation delivery."
    },
    skills: {
      listeningVi: spec.listening,
      speakingVi: spec.speaking,
      readingVi: spec.reading,
      writingVi: spec.writing,
      translationVi: spec.translation
    },
    pedagogicEnvelopes: {
      note: "VDuckie design ranges, not official exam timing or text-length claims.",
      textCharacters: { min: spec.textCharacters[0], max: spec.textCharacters[1] },
      audioSeconds: { min: spec.audioSeconds[0], max: spec.audioSeconds[1] },
      speechSyllablesPerMinute: { min: spec.speechSyllablesPerMinute[0], max: spec.speechSyllablesPerMinute[1] }
    },
    exerciseFamilies: spec.level <= 3
      ? ["nghe chọn/điền", "dictation", "flashcard recall", "ghép collocation", "sắp xếp câu", "sửa lỗi", "role-play", "viết có hướng dẫn"]
      : spec.level <= 6
        ? ["nghe ghi chú", "đọc suy luận", "phân biệt gần nghĩa", "sửa lỗi", "tóm tắt", "thuyết trình", "viết theo thể loại", "dịch theo ngữ cảnh", "mixed review"]
        : ["tổng hợp nhiều nguồn", "đánh giá lập luận", "tranh luận", "source-based writing", "dịch/hiệu đính", "phiên dịch", "phân tích register", "biên tập theo rubric"],
    assessments: {
      diagnostic: true,
      lessonQuiz: true,
      unitCheckpoint: true,
      midLevel: true,
      final: true,
      speaking: true,
      writing: true,
      translation: spec.level >= 5,
      mockExam: true,
      masteryCriteria: spec.advancement
    },
    contentStatus: "architecture-approved",
    productionReady: false
  };
}

function buildArchitecture() {
  return {
    schemaVersion: "1.0.0",
    curriculumId: "vduckie-hsk-content-program",
    phase: "C0",
    status: "architecture-approved-content-not-yet-approved",
    baselineCommit: BASELINE_COMMIT,
    researchedAt: ACCESS_DATE,
    normativeModel: {
      framework: {
        version: "GF0025-2021",
        role: "Chuẩn năng lực ba bậc, chín cấp; bốn chiều âm tiết/chữ/từ/ngữ pháp; năm kỹ năng nghe/nói/đọc/viết/dịch.",
        sourceIds: [sources.standard, sources.standardQa]
      },
      examTrack: {
        version: "CTI-HSK3.0-2026",
        role: "Đề cương nhiệm vụ/chủ đề/inventory/blueprint dùng để biên soạn và luyện thi.",
        rolloutStatus: "transition",
        rolloutNoteVi: "CTI tổ chức pilot HSK 3.0 cấp 1–6 ngày 31/01/2026; lịch thi thường kỳ 2026 vẫn dùng HSK 2.0 cho đến khi CTI công bố ngày áp dụng chính thức.",
        reverifyBeforeRelease: true,
        lastVerified: ACCESS_DATE,
        sourceIds: [sources.exam, sources.rollout, sources.competency]
      },
      nonEquivalenceRule: "Không dùng quota GF0025-2021 như thể đó là số câu/từ của đề thi; không dùng rollout HSK 3.0 để tuyên bố mọi kỳ thi hiện đã chuyển đổi.",
      examVocabularyCumulative,
      standardCumulativeBenchmarks: standardBenchmarks
    },
    designPrinciples: [
      "Năng lực có thể làm được dẫn đường cho từ, ngữ pháp, văn bản và bài tập.",
      "Input vừa sức đi trước output; output chuyển dần từ có kiểm soát sang độc lập.",
      "Mỗi nội dung mới có vòng introduce–retrieve–expand–assess.",
      "Nhận biết, hồi tưởng, vận dụng và sản sinh đều phải được đánh giá.",
      "Tiếng Việt dùng để giải thích bản chất và cảnh báo chuyển di, không thay pinyin chuẩn.",
      "Luyện thi dùng blueprint chính thức nhưng toàn bộ bài, transcript, distractor và lời giải do VDuckie tự biên soạn.",
      "Validator là gate kỹ thuật; human review ngôn ngữ và sư phạm vẫn bắt buộc."
    ],
    stages: stageDefinitions,
    lessonContract: {
      sections: sharedLessonSections,
      adaptiveRule: "Khối lượng thay đổi theo mục tiêu, nhưng mọi phần bị lược phải có lý do trong lesson metadata.",
      targetVocabularyExamples: 3,
      dialogueRequirement: "Mỗi unit có ít nhất một input hội thoại/tình huống chính, comprehension, shadowing, role-play và biến thể cá nhân hóa.",
      productionRequirement: "Mỗi lesson có ít nhất một task buộc người học tự nói hoặc tự viết."
    },
    knowledgeLifecycle: {
      firstIntroduction: "Record có firstIntroducedIn và prerequisiteIds.",
      retrieval: "Tái hiện ở định dạng khác, không sao chép nguyên câu hỏi.",
      expansion: "Dùng trong ngữ cảnh hoặc register mới với expansionOf.",
      assessment: "Có evidence receptive và productive.",
      spacingDays: [1, 3, 7, 14, 30],
      weakAreaMetadata: ["skillTags", "grammarPrerequisites", "difficulty", "errorTags", "acceptedAnswers"]
    },
    assessmentFramework: {
      principle: "Không đồng nhất đạt quiz nhận biết với năng lực sang cấp.",
      requiredEvidence: ["lesson mastery", "unit checkpoint", "mid-level", "final", "speaking sample", "writing sample", "mock/challenge"],
      rubricDimensions: ["độ chính xác", "từ vựng", "ngữ pháp", "mạch lạc", "phát âm", "hoàn thành nhiệm vụ", "phong cách", "tính tự nhiên"],
      answerQuality: ["acceptedAnswers", "explanationVi", "distractorRationale", "contentProvenance"]
    },
    reviewPolicy: {
      validators: ["schema", "pinyin", "simplified characters", "references", "difficulty/dependency", "duplicates", "answer integrity", "source coverage", "placeholder detection"],
      humanSamplingPerLevel: {
        vocabulary: 30,
        grammar: 10,
        dialogues: 5,
        exampleSentences: 45,
        listening: 5,
        reading: 5,
        writing: 5,
        exercises: 40,
        answerExplanations: 20,
        translations: 30
      },
      requiredReviewFields: ["itemId", "reviewer", "reviewedAt", "errorsFound", "fixes", "status", "confidence", "unresolvedIssues"],
      productionRule: "Không level nào production-ready nếu mẫu review chưa hoàn tất hoặc còn blocking issue."
    },
    contentTracks: {
      standard: "HSK 1–9 theo source chính thức.",
      specialistAfterStandard: ["công sở", "nhà máy", "ERP", "sản xuất", "kho", "mua hàng", "chất lượng", "kỹ thuật"],
      separationRule: "Từ chuyên ngành không được gắn level HSK chính thức nếu không có membership source."
    },
    learnerJourney: ["chọn level", "xem mục tiêu", "chọn unit", "bắt đầu bài", "từ vựng", "chữ Hán", "ngữ pháp", "nghe", "nói", "đọc", "viết", "bài tập", "giải thích", "ôn tập", "tiến độ"],
    levels: levelSpecs.map(buildLevel),
    productionSafety: {
      curriculumEnabled: false,
      publicOverrideAllowed: false,
      qualityGate: "locked",
      userDataMigration: false,
      supabaseMigration: false,
      note: "C0 chỉ thiết kế và audit; production tiếp tục HSK1 V75 legacy."
    },
    sourceClaims: [
      {
        claimId: "three-stages-nine-levels",
        contentUse: "stage/level architecture and five-skill model",
        sourceIds: [sources.standard, sources.standardQa],
        confidence: "authoritative"
      },
      {
        claimId: "new-exam-inventory-and-tasks",
        contentUse: "official vocabulary bands, task families, topics, hanzi and grammar extraction targets",
        sourceIds: [sources.exam],
        confidence: "authoritative-current"
      },
      {
        claimId: "exam-transition-2026",
        contentUse: "avoid falsely describing HSK 3.0 as universal operational exam",
        sourceIds: [sources.rollout],
        confidence: "authoritative-current-reverify"
      },
      {
        claimId: "level-competency-progression",
        contentUse: "paraphrased output goals per level",
        sourceIds: [sources.competency],
        confidence: "authoritative-current"
      },
      {
        claimId: "integrated-pedagogy",
        contentUse: "integrated skills, discourse/pragmatics/culture and academic pathway design",
        sourceIds: [sources.pedagogy],
        confidence: "institutional-pedagogy"
      }
    ]
  };
}

function buildAudit(architecture) {
  const vocabulary = loadCollection("data/hsk/hsk1/vocabulary", "index.json");
  const sentences = loadCollection("data/hsk/hsk1/sentences", "index.json");
  const legacy = loadLegacyHsk1();
  const manifest = json("data/hsk/manifest.json");
  const sourceRegistry = json("data/hsk/sources.json");
  // C0 is a point-in-time architecture audit. Later C1/C2/C3 content must not
  // make its deterministic snapshot stale or rewrite historical findings.
  const baselineLevelFiles = Array.from({ length: 9 }, (_, index) => ({
    level: index + 1,
    contentStatus: "planned",
    unitRefs: [],
    lessonIndex: [],
    assessmentRefs: []
  }));
  const nonEmpty = (records, field) => records.filter((record) => Array.isArray(record[field]) && record[field].length > 0).length;
  const sentenceLengths = sentences.map((sentence) => Array.from(sentence.chinese.replace(/[，。？！；：“”]/gu, "")).length);
  const legacyWords = legacy.reduce((total, lesson) => total + (lesson.words || []).length, 0);
  const sourceIds = new Set(sourceRegistry.sources.map((source) => source.sourceId));
  const requiredC0Sources = Object.values(sources);
  const previousDuplicate = Object.freeze({ blockers:0, exact:1, normalized:0, nearReview:233 });
  const hskSource = read("hsk-lessons.js");
  const report = {
    reportVersion: "1.0.0",
    phase: "C0",
    auditDate: ACCESS_DATE,
    baselineCommit: BASELINE_COMMIT,
    scope: "Current HSK content, schemas, runtime learning journey, source coverage and C0 architecture. No user data or production curriculum changed.",
    inventory: {
      production: {
        curriculum: "legacy-hsk1-v75",
        hsk1Lessons: legacy.length,
        hsk1Vocabulary: legacyWords,
        canonicalEnabled: manifest.productionEnabled,
        qualityGate: manifest.qualityGate
      },
      canonical: {
        hsk1Vocabulary: vocabulary.length,
        hsk1Sentences: sentences.length,
        units: baselineLevelFiles[0].unitRefs.length,
        lessons: baselineLevelFiles[0].lessonIndex.length,
        assessments: baselineLevelFiles[0].assessmentRefs.length,
        hsk2To4LevelRecords: baselineLevelFiles.slice(1, 4).map((level) => ({ level: level.level, status: level.contentStatus, unitRefs: level.unitRefs.length })),
        hsk5To9EmptyLevelShells: baselineLevelFiles.slice(4).filter((level) => level.unitRefs.length === 0).length
      }
    },
    canonicalHsk1Quality: {
      structurallyValidated: true,
      vocabularyWithOneEmbeddedExample: vocabulary.filter((record) => record.examples.length === 1).length,
      vocabularyWithThreeEmbeddedExamples: vocabulary.filter((record) => record.examples.length >= 3).length,
      contextMeaningCoverage: nonEmpty(vocabulary, "contextMeaningsVi"),
      collocationCoverage: nonEmpty(vocabulary, "collocations"),
      commonErrorCoverage: nonEmpty(vocabulary, "commonErrorsVi"),
      synonymCoverage: nonEmpty(vocabulary, "synonyms"),
      antonymCoverage: nonEmpty(vocabulary, "antonyms"),
      audioReferences: vocabulary.filter((record) => record.audioRef).length,
      machineAssistedTranslations: vocabulary.filter((record) => record.translationReviewStatus === "machine-assisted").length,
      humanReviewedTranslations: vocabulary.filter((record) => record.translationReviewStatus === "human-reviewed").length,
      sentenceLengthCharacters: {
        min: Math.min(...sentenceLengths),
        max: Math.max(...sentenceLengths),
        mean: Number((sentenceLengths.reduce((sum, value) => sum + value, 0) / sentenceLengths.length).toFixed(2))
      },
      duplicateBaseline: previousDuplicate,
      authoringNote: "The 900 sentence records give three linked sentences per vocabulary item, while each vocabulary record embeds only its first example. All Vietnamese translations remain machine-assisted."
    },
    strengths: [
      { area: "official inventory", evidence: "300 HSK1 vocabulary records follow the current CTI syllabus order with row locators.", keep: true },
      { area: "stable data", evidence: "Stable IDs, six vocabulary shards, nine sentence shards, checksums and sourceRefs are present.", keep: true },
      { area: "structural validation", evidence: "Existing Phase 2A schema/reference/pinyin/Unicode/count gates pass.", keep: true },
      { area: "legacy learner flow", evidence: "Production includes pronunciation foundation, vocabulary, writing animation, grammar, reading, dictation, quiz and mobile step navigation.", keep: true },
      { area: "safety", evidence: "Canonical curriculum remains developer-only/read-only; production and public override are locked.", keep: true }
    ],
    gaps: [
      { id: "C0-GAP-001", severity: "blocking-for-c1-release", area: "curriculum", finding: "Canonical HSK1 has no unit, lesson, grammar, character or assessment records.", remediation: "Author the C1 level graph and all referenced learning objects." },
      { id: "C0-GAP-002", severity: "blocking-for-c1-release", area: "Vietnamese review", finding: "300/300 vocabulary translations remain machine-assisted; human-reviewed count is zero.", remediation: "Human review meanings, usage, examples and translations before production." },
      { id: "C0-GAP-003", severity: "high", area: "vocabulary depth", finding: "Context meanings, collocations and common Vietnamese-learner errors have zero coverage.", remediation: "Enrich by pedagogic priority and validate against authoritative dictionaries/corpora." },
      { id: "C0-GAP-004", severity: "high", area: "sentence pedagogy", finding: "900 sentences are structurally valid but template-assisted; prior duplicate gate flags 233 near-review items.", remediation: "Assign sentences to lessons, dependency-check them and manually review a representative sample before use." },
      { id: "C0-GAP-005", severity: "high", area: "audio", finding: "Canonical vocabulary has no owned audio references; runtime falls back to browser speech synthesis.", remediation: "Create an audio script/manifest and reviewed recordings or explicitly licensed TTS assets." },
      { id: "C0-GAP-006", severity: "high", area: "assessment", finding: "No canonical diagnostic, unit, mid, final, speaking or writing assessment exists.", remediation: "Author original assessment blueprints and rubrics aligned to current CTI tasks." },
      { id: "C0-GAP-007", severity: "medium", area: "learner experience", finding: "Current UI mixes lesson data/rendering and limits persisted selectable levels to 0–4.", remediation: "Only after content exists, add a content adapter and learner-facing unit navigation without expanding Developer Center." },
      { id: "C0-GAP-008", severity: "high", area: "levels 2-9", finding: "Canonical level shells are empty; legacy HSK2–4 are thin and HSK5–9 have no learning content.", remediation: "Build level-by-level after C1 gates; never fill with placeholders." },
      { id: "C0-GAP-009", severity: "warning", area: "exam status", finding: "HSK 3.0 is in a 2026 transition; regular test status must be rechecked before release.", remediation: "Revisit CTI notice/calendar at every level release." }
    ],
    runtimeAudit: {
      file: "hsk-lessons.js",
      learnerFeatures: ["level selection", "lesson list", "pinyin/meaning reveal", "speech synthesis", "stroke-order animation", "reading question", "dictation", "five-item quiz", "mobile section stepper", "local progress"],
      limitations: [
        "Lesson data and renderer are coupled in one global file.",
        "Quiz primarily checks word-meaning recognition and uses generated distractors without rationales.",
        "No canonical unit/assessment navigation exists.",
        "Browser speechSynthesis is not a reviewed audio curriculum."
      ],
      evidence: {
        persistedLevelCapThrough4: /savedState\.level <= 4/.test(hskSource),
        speechSynthesisFallback: /speechSynthesis/.test(hskSource),
        canonicalDeveloperPreviewOnly: /Canonical HSK 1 Developer Preview/.test(hskSource)
      }
    },
    sourceAudit: {
      registryCount: 16,
      requiredC0SourceIds: requiredC0Sources,
      allRequiredC0SourcesPresent: requiredC0Sources.every((sourceId) => sourceIds.has(sourceId)),
      officialClaimsSeparatedFromPedagogicDesign: true,
      copyrightRule: "No commercial textbook/test content copied; architecture paraphrases public standards and requires original VDuckie teaching content."
    },
    architecture: {
      path: ARCHITECTURE_FILE,
      levels: architecture.levels.length,
      stages: architecture.stages.length,
      units: architecture.levels.reduce((total, level) => total + level.levelStructure.unitCount, 0),
      plannedCoreLessons: architecture.levels.reduce((total, level) => total + level.levelStructure.coreLessonCount, 0),
      lessonSections: architecture.lessonContract.sections.length,
      architectureHash: sha256(architecture)
    },
    contentDecision: {
      keep: ["canonical 300-word CTI inventory", "900 original sentence candidates", "stable IDs/sourceRefs/sharding", "legacy production until quality gates pass", "existing pronunciation/writing/mobile capabilities"],
      rewriteOrEnrich: ["Vietnamese gloss depth", "collocations/usage/errors", "lesson sequence", "grammar explanations", "dialogues", "skill tasks", "assessments and answer explanations"],
      doNotPromote: ["machine-assisted translation as expert-reviewed", "legacy HSK1 V75 as current official HSK1", "HSK7–9 pedagogic split as official word membership"]
    },
    reviewSampling: {
      status: "human-review-not-completed",
      machineAuditSample: ["hsk1-v-0001", "hsk1-v-0004", "hsk1-v-0038", "hsk1-v-0100", "hsk1-v-0150", "hsk1-v-0200", "hsk1-v-0250", "hsk1-v-0300", "hsk1-s-0001", "hsk1-s-0301", "hsk1-s-0601", "hsk1-s-0900"],
      findings: ["Schema/provenance usable.", "Vocabulary enrichment fields empty.", "Translations still require human Vietnamese review.", "Sentence candidates need lesson dependency and naturalness review."],
      productionClaimAllowed: false
    },
    decision: {
      phaseC0Complete: true,
      phaseC1Allowed: true,
      phaseC1ProductionReleaseAllowed: false,
      productionAllowed: false,
      blockersForC1Start: [],
      blockersForProduction: ["C1 content graph absent", "human review incomplete", "canonical audio/assessments absent", "learner UI not connected to approved content", "HSK 3.0 operational status must be reverified"]
    },
    productionSafety: {
      productionEnabled: manifest.productionEnabled,
      publicOverrideAllowed: manifest.publicOverrideAllowed,
      qualityGate: manifest.qualityGate,
      productionCurriculum: "legacy-hsk1-v75",
      supabaseChanged: false,
      userDataChanged: false
    }
  };
  assert.equal(legacy.length, 15);
  assert.equal(legacyWords, 150);
  return report;
}

function buildMarkdown(architecture, audit) {
  const rows = architecture.levels.map((level) => {
    const envelope = level.pedagogicEnvelopes;
    return `| ${level.level} | ${level.stage} | ${level.levelStructure.unitCount} | ${level.levelStructure.coreLessonCount} | ${level.officialAlignment.examVocabularyCumulativeTarget.toLocaleString("vi-VN")} | ${envelope.textCharacters.min}–${envelope.textCharacters.max} chữ | ${envelope.audioSeconds.min}–${envelope.audioSeconds.max} giây |`;
  }).join("\n");
  const unitSections = architecture.levels.map((level) => {
    const units = level.units.map((unit) => `${unit.order}. **${unit.titleVi}:** ${unit.communicativeTaskVi}`).join("\n");
    return `### HSK ${level.level}\n\n**Đầu ra:** ${level.officialCompetencyParaphraseVi}\n\n${units}\n\n**Điều kiện sang cấp:** kiến thức ${level.assessments.masteryCriteria.knowledge}%, tiếp nhận ${level.assessments.masteryCriteria.receptive}%, sản sinh ${level.assessments.masteryCriteria.productive}%; bắt buộc: ${level.assessments.masteryCriteria.mandatory.join(", ")}.`;
  }).join("\n\n");
  return `# VDuckie HSK 1–9 Curriculum Architecture — Phase C0

> Trạng thái: kiến trúc đã được kiểm tra; chưa phải nội dung production. Production vẫn dùng HSK1 V75 legacy và quality gate vẫn khóa.

## 1. Quyết định chuẩn và phiên bản

VDuckie dùng **GF0025-2021** làm chuẩn năng lực ba bậc/chín cấp, bốn chiều ngôn ngữ và năm kỹ năng. Đề cương **CTI HSK 3.0 (2026)** là track inventory, nhiệm vụ và luyện thi. Hai nguồn liên quan nhưng không đồng nhất.

Tại ngày ${ACCESS_DATE}, CTI mô tả HSK 3.0 cấp 1–6 ở trạng thái chuyển tiếp/pilot; thông báo chính thức nêu lịch thi thường kỳ 2026 vẫn theo HSK 2.0 cho tới thông báo khác. Mọi release phải kiểm tra lại trạng thái này. HSK7–9 giữ một official vocabulary band chung; \`pedagogicTargetLevel\` chỉ là thứ tự dạy nội bộ.

Nguồn và phạm vi sử dụng đầy đủ nằm trong \`data/hsk/sources.json\` và \`sourceClaims\` của [curriculum map](../data/hsk/curriculum/architecture.json).

## 2. Kết quả audit hiện tại

- Legacy production: ${audit.inventory.production.hsk1Lessons} bài / ${audit.inventory.production.hsk1Vocabulary} từ, đang khóa ở curriculum V75.
- Canonical HSK1: ${audit.inventory.canonical.hsk1Vocabulary} từ / ${audit.inventory.canonical.hsk1Sentences} câu, stable IDs và provenance tốt.
- Canonical hiện có ${audit.inventory.canonical.units} unit, ${audit.inventory.canonical.lessons} lesson và ${audit.inventory.canonical.assessments} assessment thực.
- ${audit.canonicalHsk1Quality.machineAssistedTranslations}/300 nghĩa tiếng Việt còn machine-assisted; human-reviewed = ${audit.canonicalHsk1Quality.humanReviewedTranslations}.
- Coverage collocation/context/common-error lần lượt là ${audit.canonicalHsk1Quality.collocationCoverage}/${audit.canonicalHsk1Quality.contextMeaningCoverage}/${audit.canonicalHsk1Quality.commonErrorCoverage}.
- HSK2–4 canonical mới là shell; HSK5–9 chưa có nội dung. Không được dùng placeholder để che khoảng trống này.

Điểm nên giữ: inventory CTI 300 từ, 900 câu gốc làm candidate, stable ID/sourceRef/shard/checksum, phần phát âm/viết/mobile hiện có và production lock.

Điểm phải viết/enrich: thứ tự unit–lesson, giải thích ngữ pháp, chữ Hán, collocation/cách dùng/lỗi người Việt, hội thoại, nghe–nói–đọc–viết, assessment, rubric, audio và human review.

## 3. Quy mô kiến trúc

Các độ dài/tốc độ dưới đây là **design envelope của VDuckie**, không phải quota đề thi chính thức.

| HSK | Bậc | Unit | Core lesson | Từ tích lũy theo đề cương CTI mới | Văn bản | Audio |
|---:|---|---:|---:|---:|---:|---:|
${rows}

Tổng: **${audit.architecture.units} unit / ${audit.architecture.plannedCoreLessons} core lesson**. Đây là kế hoạch authoring có thể điều chỉnh sau pilot, không phải mục tiêu để lấp dữ liệu.

## 4. Contract một lesson

${architecture.lessonContract.sections.map((section, index) => `${index + 1}. **${section.id}** — ${section.purposeVi}${section.required ? "" : " (khi phù hợp)"}`).join("\n")}

Mỗi lesson phải có ít nhất một task sản sinh; mỗi unit có input chính, câu hỏi hiểu, shadowing, role-play và biến thể cá nhân hóa. Mỗi từ mục tiêu cần ba ví dụ có chất lượng sau review, không phải ba câu đổi tên theo template.

## 5. Lộ trình level và unit

${unitSections}

## 6. Vòng đời kiến thức

1. **Introduce:** gắn \`firstIntroducedIn\`, prerequisite và mục tiêu giao tiếp.
2. **Retrieve:** gọi lại ở dạng bài khác, không sao chép stem.
3. **Expand:** dùng trong chủ đề/register mới, khai báo \`expansionOf\`.
4. **Assess:** có bằng chứng receptive lẫn productive.
5. **Space:** ôn 1/3/7/14/30 ngày, ưu tiên vùng yếu bằng metadata.

## 7. Assessment và human review

Mỗi cấp có diagnostic, quiz bài, unit checkpoint, mid-level, final, speaking, writing, mock/challenge và mastery review. Từ HSK5 có rubric dịch; HSK7–9 có dịch nói/viết thực chất.

Validator không thay human review. Mẫu tối thiểu mỗi level: 30 từ, 10 điểm ngữ pháp, 5 hội thoại, 45 câu, 5 bài nghe, 5 bài đọc, 5 bài viết, 40 bài tập, 20 lời giải và 30 bản dịch. Review phải ghi người review, lỗi, sửa, confidence và unresolved issues.

## 8. Gate Phase C1

C1 được phép bắt đầu vì C0 không còn blocker thiết kế. C1 chưa được phép mở production cho đến khi:

- level/unit/lesson/grammar/character/exercise/assessment graph hoàn chỉnh;
- Vietnamese và pedagogy sampling do người có năng lực thực hiện;
- dependency/difficulty/duplicate/answer/source validators xanh;
- audio strategy có nguồn và graceful fallback;
- learner-facing mobile/browser smoke xanh;
- CTI rollout status được kiểm tra lại;
- production flags và quality gate chỉ đổi sau phê duyệt riêng.
`;
}

function validate(architecture, audit) {
  assert.equal(architecture.levels.length, 9);
  assert.deepEqual(architecture.levels.map((level) => level.level), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(architecture.stages.map((stage) => stage.levels), [[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
  assert.equal(architecture.lessonContract.sections.length, 16);
  assert.deepEqual(architecture.knowledgeLifecycle.spacingDays, [1, 3, 7, 14, 30]);
  assert.equal(architecture.normativeModel.examTrack.rolloutStatus, "transition");
  assert.equal(architecture.normativeModel.examTrack.reverifyBeforeRelease, true);
  assert.equal(architecture.productionSafety.curriculumEnabled, false);
  assert.equal(architecture.productionSafety.publicOverrideAllowed, false);
  assert.equal(architecture.productionSafety.qualityGate, "locked");
  for (const level of architecture.levels) {
    assert.ok(level.outputObjectivesVi.length >= 3, `HSK${level.level} outcomes`);
    assert.ok(level.units.length >= 10, `HSK${level.level} units`);
    assert.equal(level.units.length, level.levelStructure.unitCount);
    assert.ok(level.skills.listeningVi && level.skills.speakingVi && level.skills.readingVi && level.skills.writingVi && level.skills.translationVi);
    assert.ok(level.exerciseFamilies.length >= 8);
    assert.equal(level.productionReady, false);
    assert.ok(level.pedagogicEnvelopes.textCharacters.max > level.pedagogicEnvelopes.textCharacters.min);
  }
  for (const level of architecture.levels.filter((item) => item.level >= 7)) {
    assert.equal(level.officialAlignment.examVocabularyBand, "7-9");
    assert.equal(level.officialAlignment.advancedBandSplitPolicy.includes("Combined official 7-9"), true);
    assert.equal(level.languageSystem.vocabulary.officialSplit, false);
  }
  assert.equal(audit.inventory.canonical.hsk1Vocabulary, 300);
  assert.equal(audit.inventory.canonical.hsk1Sentences, 900);
  assert.equal(audit.inventory.production.hsk1Lessons, 15);
  assert.equal(audit.inventory.production.hsk1Vocabulary, 150);
  assert.equal(audit.sourceAudit.allRequiredC0SourcesPresent, true);
  assert.equal(audit.decision.phaseC0Complete, true);
  assert.equal(audit.decision.phaseC1Allowed, true);
  assert.equal(audit.decision.productionAllowed, false);
  assert.equal(audit.productionSafety.productionEnabled, false);
  assert.equal(audit.productionSafety.publicOverrideAllowed, false);
  assert.equal(audit.productionSafety.qualityGate, "locked");
}

function main() {
  const architecture = buildArchitecture();
  const audit = buildAudit(architecture);
  const markdown = buildMarkdown(architecture, audit);
  validate(architecture, audit);
  const outputs = {
    [ARCHITECTURE_FILE]: serialize(architecture),
    [AUDIT_FILE]: serialize(audit),
    [DOC_FILE]: markdown
  };
  if (process.argv.includes("--write")) {
    for (const [file, content] of Object.entries(outputs)) write(file, content);
  } else {
    for (const [file, expected] of Object.entries(outputs)) {
      assert.equal(read(file), expected, `${file} is stale; run node scripts/build-hsk-curriculum-c0.js --write`);
    }
  }
  process.stdout.write(`${JSON.stringify({
    ok: true,
    phase: "C0",
    levels: architecture.levels.length,
    units: audit.architecture.units,
    coreLessons: audit.architecture.plannedCoreLessons,
    hsk1Vocabulary: audit.inventory.canonical.hsk1Vocabulary,
    hsk1Sentences: audit.inventory.canonical.hsk1Sentences,
    phaseC1Allowed: audit.decision.phaseC1Allowed,
    productionAllowed: audit.decision.productionAllowed
  }, null, 2)}\n`);
}

if (require.main === module) main();

module.exports = Object.freeze({ buildArchitecture, buildAudit, buildMarkdown, validate });
