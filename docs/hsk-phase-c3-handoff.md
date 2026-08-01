# Bàn giao Phase C3 — HSK2 Professional Curriculum

## 1. Discovery và baseline

- Repository: `ducnguyen138cyber/erp-tieng-trung-vduckiee`, branch `main`.
- HEAD/origin ban đầu: `572eb3429e0238f1bb7f1513f818049928930a34`.
- Sau commit learner-facing HSK1 `5d1fa350319593266b3ae3837360f785a509ae60` chỉ có một commit bảo trì report HSK (`5144e40`) và bốn commit mascot Level 1 (`158de76`, `445c3fd`, `241f234`, `572eb34`). Các commit mascot không thay đổi tiến độ curriculum.
- Source thực tế xác nhận HSK1 C2 có 10 unit, 24 lesson, 300 canonical vocabulary, 900 sentence, 21 grammar, 50 character, 120 exercise và 13 assessment; learner runtime read-only đã hiển thị đủ nội dung/đáp án/điều hướng. Không có integration HSK1 blocking trước C3.
- Baseline production và progress-write gate tiếp tục khóa.

## 2. Curriculum HSK2 được bàn giao

- 10 unit, 28 lesson.
- 200 từ mới chính thức (dòng 301–500), đưa tổng tích lũy HSK1–2 lên 500 từ.
- 60 character record, 29 grammar record.
- 28 hội thoại, 28 listening transcript, 28 bài đọc, 28 speaking task, 28 writing task và 28 real-world task.
- 168 exercise thuộc 32 format; đủ vocabulary, grammar, listening, reading, speaking, writing và controlled translation.
- 13 assessment: 10 unit checkpoint, midpoint, final và mastery review.
- Spaced review ở nhịp 1/3/7/14/30 ngày; mastery gate knowledge 80%, receptive 75%, productive 72%.

Mục tiêu đầu ra:

1. duy trì hội thoại ngắn về lịch trình, dịch vụ, sở thích, trải nghiệm và nhu cầu;
2. hiểu thông báo/tin nhắn ngắn và kể lại chuỗi sự việc đơn giản;
3. viết đoạn thực dụng 5–8 câu có thời gian, trình tự và quan hệ nguyên nhân cơ bản.

Mười chủ đề: ôn cầu nối HSK1; lịch sinh hoạt/tần suất; nhà ở/khu phố; đi lại/du lịch ngắn; ăn uống/mua sắm/dịch vụ; sức khỏe; học tập/công việc thường ngày; sở thích/gia đình/quan hệ; so sánh/miêu tả/giao tiếp số; trải nghiệm/kế hoạch gần.

Mọi lesson đánh dấu knowledge role `new`, `review`, `reinforcement` hoặc `extension`; từ HSK1 quay lại không bị tính là từ mới HSK2.

## 3. Nguồn và tác quyền

- Snapshot vocabulary dùng syllabus chính thức Chinese Testing International, PDF SHA-256 `ec74ce0439e837bbb15154be13e747ae798903b2fd3a331629df6c3b45504941`, trang 87–92, dòng 301–500.
- Chỉ lưu fact ngắn: số dòng, headword và pinyin. Không lưu đề mẫu, answer key, audio hoặc văn bản giáo trình thương mại.
- Hội thoại, transcript, reading, giải thích, distractor và nhiệm vụ là nội dung VDuckie tự biên soạn với hỗ trợ máy.

## 4. Editorial và quality gate

Đã chạy full machine-assisted editorial pass và sampling phân tầng các bài 01, 09, 14, 22, 28. Các sửa đáng chú ý:

- bỏ `很` sai sau cấu trúc so sánh `比`;
- tách hai nghĩa chính thức của `过` và `花` bằng canonical ID, tránh homograph collision;
- bỏ framing ERP nặng, chuyển về đời sống, học tập, dịch vụ, đi lại và quan hệ;
- thay câu hỏi nghe/đọc generic bằng câu hỏi riêng từng lesson có evidence;
- thay ghi chú từ vựng chung chung bằng mẫu dùng có bản dịch, lượng từ, cách dùng, từ dễ nhầm và lỗi gắn đúng target;
- căn lại nhãn/stimulus/đáp án/rubric của dictation, listen-fill, sentence-order, measure-word, translation và pronunciation;
- cân mọi checkpoint/assessment theo đúng số item listening, grammar, reading, speaking và writing;
- sửa prompt/example lặp hoặc gần lặp, rút độ dài bài viết và viết lại các câu Trung chưa tự nhiên trong mẫu editorial;
- giữ audio ở `script-ready-audio-pending` và stroke order ở trạng thái chưa verified.

Kết quả validator HSK2: 0 error; 0 exact duplicate; 0 near duplicate; 0 semantic-fingerprint duplicate; 200/200 từ được gán đúng một lesson; 29/29 grammar, 60/60 character, đủ sáu skill bắt buộc và controlled translation.

Trạng thái review vẫn là `machine-assisted`. Human signoff độc lập cho tiếng Việt và sư phạm tiếng Trung đều `false`/còn bắt buộc trước release chính thức.

## 5. Learner web

Runtime HSK1 hiện có được mở rộng cho nhiều level, không tạo runtime thứ hai. Người học có thể vào:

`Giáo trình HSK → HSK2 → Unit → Lesson`

và học mục tiêu, vocabulary/mẫu dùng/lượng từ/cách dùng/từ dễ nhầm/lỗi thường gặp, character, grammar, dialogue/role-play, listening transcript/TTS fallback, reading/evidence, pronunciation, speaking, writing, real-world task, spaced review, exercise, checkpoint, final/mastery và bài trước/sau. URL hỗ trợ `hskLevel`, `hskLesson`, `hskAssessment`.

HSK1 vẫn chuyển qua lại được và giữ 10 unit / 24 lesson / 300 từ. Runtime xử lý cache chuyển level, canonical ID homograph và ngăn copy legacy HSK1 ghi đè intro HSK2.

## 6. Browser và regression

- Learner smoke: 1440×900, 1024×768, 390×844, 320×568; bài 01, 14, 28; đủ section, answer, prev/next, unit checkpoint, midpoint, final, mastery và HSK1 switch-back.
- Kết quả: không horizontal overflow; level rail không overflow; mobile button tối thiểu 44px; chữ Trung tối thiểu 13px.
- HSK test suite: 131/131 pass, gồm legacy Phase 2B-4 browser safety ở cả bốn viewport.
- Full repository regression: 378/378 pass.
- Generic schema: 1.985 record / 17 source / 9 schema / 0 error / 0 warning.
- Repository duplicate engine: 1.866 candidate / 246 finding / 0 blocker; một exact duplicate là spaced review HSK1 có metadata hợp lệ, 243 near-match được giữ ở hàng review.
- Coverage: HSK1 structural 100%; HSK2 full C3 coverage; 0 validation error.

Evidence: `reports/hsk2-c3-quality-report.json` và `reports/hsk2-c3-learner-integration.json`.

## 7. Safety và bước tiếp theo

Tiếp tục giữ:

- `HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED=false`;
- `writesProgress=false`;
- `productionEnabled=false`;
- `publicOverrideAllowed=false`;
- `qualityGate=locked`;
- không Supabase migration, không user-data migration, không real progress write.

C3 hoàn tất ở mức professional learner-facing read-only và machine editorial. Milestone tiếp theo là **C4 — HSK3 Professional Curriculum**; không bắt đầu trong lượt C3 này.
