# Bàn giao Phase C2 — HSK1 Professional Editorial Pass

## 1. Trạng thái

- Repository: `ducnguyen138cyber/erp-tieng-trung-vduckiee`
- Branch đích: `main`
- Baseline C1: `8c5714ce5f22fc438f5588fedbc331291ed6c882` — `Build professional HSK 1 course`
- Phase hiện tại: **C2 — HSK1 Professional Editorial Pass**
- HSK level hiện tại: **HSK1**
- Unit đã editorial: **10/10**
- Lesson đã editorial: **24/24**
- Grammar: **21 record** (17 record C1 được rà lại + 4 coverage record chính thức được bổ sung)
- Exercise: **120**, giữ cân bằng 24 listening / 24 grammar / 24 reading / 24 speaking / 24 writing
- Exercise format: **72 nhãn định dạng**, prompt 120/120 khác nhau
- Assessment: **13** (10 unit checkpoint + midpoint + final + mastery review)
- Production: **tiếp tục khóa**

C2 không xây lại C1. C2 chỉnh trực tiếp dữ liệu C1 và bổ sung một lớp patch có thể tái tạo bằng `scripts/polish-hsk1-c2.js`.

## 2. Nội dung học đã được nâng chất lượng

### 2.1. 24 lesson

Toàn bộ 24 lesson đã được rà lại ở lớp editorial máy/AI theo các tiêu chí: độ tự nhiên tiếng Trung, giải thích tiếng Việt, phạm vi HSK1, progression, hội thoại, reading, listening, guided practice, speaking, writing, real-world task và spaced review.

Các lỗi C1 đã xử lý gồm:

- bỏ text tiếng Trung bị trộn tiếng Việt như `先 nghe`, `... là các chữ ...`, `是“học”`;
- bỏ câu hỏi đọc hiểu generic lặp lại giữa các bài;
- bổ sung transcript tiếng Trung thật cho 24/24 phần listening;
- giữ `audioStatus = script-ready-audio-pending`, không giả vờ đã có audio được kiểm duyệt;
- guided practice, summary checklist và review retrieval được viết theo từng lesson thay vì dùng một template chung;
- giảm các từ ngoài phạm vi HSK1 khỏi learner-facing focus, đặc biệt ở nhóm phương hướng, thời tiết, sức khỏe và kế hoạch;
- sửa một số lesson để bám HSK1 tốt hơn: bài 8 hỏi cách đọc chữ, bài 13 lịch đi làm, bài 20 vị trí bệnh viện, bài 23 `我生病了`, bài 24 kế hoạch thứ Bảy.

### 2.2. Vocabulary scope

C1 có 31 derived phrase xuất hiện trong lesson focus. C2 giảm còn 8 support-only item có lý do rõ ràng:

- `不喜欢`
- `不能`
- `吃饭`
- `回家`
- `杯`
- `看电影`
- `越南`
- `面条`

Các item này không được giả làm canonical vocabulary. `canonicalLookup = null`; mỗi item có `supportOnly` và `supportReason`. Riêng `杯` được phép dùng trong assessment vì syllabus HSK1 chính thức liệt kê cách dùng `杯` như lượng từ.

### 2.3. Grammar

Bổ sung 4 điểm coverage HSK1 bị thiếu trong C1:

1. `hsk1-grammar-measure-words` — lượng từ cơ bản;
2. `hsk1-grammar-separable-verbs` — ly hợp từ cơ bản;
3. `hsk1-grammar-serial-verbs` — 连动句1;
4. `hsk1-grammar-double-object` — 双宾语句1.

Các record cũ cũng được rà lại, đặc biệt:

- `了`: không dạy như một “thì quá khứ” đơn giản;
- `在/正在`: làm rõ progressive và vai trò tùy chọn của `呢`;
- question words: giữ vị trí của thành phần cần hỏi và không cộng thêm `吗`;
- demonstrative + classifier: sửa ví dụ sai thành lỗi lượng từ thực sự có giá trị sư phạm.

## 3. Bài tập và assessment

Exercise vẫn là 120, không tăng số lượng để làm đẹp báo cáo. C2 tập trung tăng độ đa dạng và chất lượng nhiệm vụ.

Có các nhóm mới/được làm rõ như:

- nghe chép chọn lọc;
- nghe lấy chi tiết;
- nghe short answer;
- information extraction;
- sentence reorder;
- measure-word choice;
- error correction;
- question-word fill;
- modal choice;
- time ordering;
- `在/有` contrast;
- grammar transformation;
- serial-verb reorder;
- reading evidence;
- reading short answer;
- pronunciation drill;
- role-play;
- information-gap;
- route explanation;
- weather brief;
- plan negotiation;
- pinyin tone notation;
- character copy/self-check;
- profile form;
- appointment message;
- location description;
- shopping/menu writing;
- invitation và absence message.

Các distractor kiểu vô nghĩa/không cùng cấp như “đang tranh luận chủ đề trừu tượng” đã bị loại.

Assessment được cân lại:

- unit checkpoint lấy đủ 5 kỹ năng của các lesson trong unit, gồm cả grammar evidence;
- midpoint: 60 exercise refs, 12 item mỗi skill;
- final: 60 exercise refs, 12 item mỗi skill;
- mastery review: 36 refs, tập trung grammar transfer + speaking + writing + self-correction;
- productive skill vẫn là gate bắt buộc; không thể chỉ làm tốt nhận biết rồi được coi là mastery.

## 4. Provenance / nguồn dùng

C2 giữ source allowlist của C0/C1 và đối chiếu lại nội dung với nguồn chính thức, không copy nguyên văn bài khóa/giáo trình có bản quyền:

- `moe-gf0025-2021-standard` — 《国际中文教育中文水平等级标准》 GF0025-2021;
- `cti-hsk3-current-syllabus-2026` — syllabus HSK mới do Chinese Testing International công bố, bản 2025-11 / triển khai từ 2026-07;
- `cti-hsk3-competency-profile-2026`;
- `blcu-new-standard-pedagogy-2025`;
- `vduckie-hsk1-phase2a-original`.

Các hội thoại, reading, listening script, prompt, distractor, giải thích và nhiệm vụ sư phạm của C2 là nội dung VDuckie tự biên soạn/machine-assisted; không sao chép lesson text hoặc answer key của giáo trình thương mại.

## 5. Mức review thực tế

C2 là **machine/AI editorial pass**, chưa phải human sign-off độc lập.

Đã rà bằng logic/test:

- Chinese/Vietnamese mixed text;
- lesson-specific reading/listening questions;
- listening transcript coverage;
- exercise prompt uniqueness/diversity;
- out-of-level learner focus blacklist đã xác minh trong đợt C2;
- derived support labeling;
- grammar coverage mới;
- assessment 5-skill balance;
- production lock.

Vẫn phải giữ:

- `translationReviewStatus = machine-assisted`;
- `humanSignoffRequired = true`;
- không được đổi thành `human-reviewed` chỉ vì C2 test pass.

## 6. Audio / stroke order

- Listening: 24/24 lesson có transcript sẵn sàng làm nguồn thu âm.
- Audio thật: **chưa recorded/verified**.
- Character stroke order: vẫn `static-fallback`; **chưa có verified licensed asset**.
- Không lấy asset license không rõ ràng chỉ để đóng phase.

## 7. Production safety

Phải tiếp tục giữ:

- `qualityGate = locked`
- `productionEnabled = false`
- `publicOverrideAllowed = false`
- `writesProgress = false`
- `productionReady = false`
- `reviewGate.productionReleaseAllowed = false`

Không Supabase migration, không user-data migration, không public canonical switch trong C2.

## 8. File C2 chính

Nguồn/logic mới:

- `data/hsk/hsk1/editorial-c2.json`
- `scripts/polish-hsk1-c2.js`
- `tests/hsk-phase-c2-editorial-quality.test.js`

Dữ liệu được C2 materialize:

- `data/hsk/hsk1/lessons.json`
- `data/hsk/hsk1/grammar.json`
- `data/hsk/hsk1/exercises.json`
- `data/hsk/hsk1/assessments.json`
- `data/hsk/hsk1/course-manifest.json`
- `data/hsk/hsk1/level.json`
- `data/hsk/manifest.json`
- `reports/hsk-c2-editorial-report.json`

Regression update:

- `tests/hsk-phase-c1-professional-course.test.js` — C1 builder vẫn được kiểm như baseline, nhưng final course có thể tiến lên C2.

## 9. Validation commands

Chạy từ root repository:

```bash
node scripts/polish-hsk1-c2.js
node scripts/hsk-reference-validator.js
node scripts/hsk-duplicate-engine.js
node --test \
  tests/hsk-phase-c2-editorial-quality.test.js \
  tests/hsk-phase-c1-professional-course.test.js \
  tests/hsk-phase2a-contract.test.js \
  tests/hsk-phase2a-quality.test.js \
  tests/hsk-phase2a-lock.test.js
git diff --check
```

Validator/duplicate engine phải chạy trên checkout repository đầy đủ vì isolated artifact không chứa toàn bộ loader/schema/canonical shard.

## 10. Issue còn lại trước production

1. Cần human editorial sampling/sign-off độc lập cho tiếng Trung, tiếng Việt và pedagogy.
2. Audio thật chưa recorded/licensed/verified.
3. Stroke-order asset chưa verified/licensed.
4. Learner-facing UI vẫn có thể chưa hiển thị C2 trên production vì production canonical switch bị khóa có chủ ý.
5. Duplicate engine có thể còn near-review findings; gate quan trọng là không có blocker mới và phải đọc findings nếu số lượng/nhóm bất thường.

## 11. Bước tiếp theo chính xác

Sau khi C2 đã được full-repository validator + duplicate engine + test suite xác nhận và commit/push `main`, phase tiếp theo là **C3 — HSK2 Professional Curriculum**.

C3 phải:

1. đọc architecture C0 và HSK1 C2 để giữ contract/progression;
2. đối chiếu official HSK2 vocabulary/grammar/character/skill scope;
3. thiết kế curriculum map HSK2 theo khối lượng thực tế, không ép 10 unit/24 lesson;
4. xây lesson có listening/speaking/reading/writing, grammar, scenario, exercise, checkpoint, assessment và spaced review;
5. đánh dấu rõ kiến thức HSK1 quay lại là review/reinforcement;
6. chống semantic duplicate xuyên HSK1 → HSK2;
7. tiếp tục khóa production và progress writes.
