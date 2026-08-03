# Bàn giao Phase C4 — HSK3 Professional Curriculum

Ngày hoàn tất: 03/08/2026  
Repository: `ducnguyen138cyber/erp-tieng-trung-vduckiee`  
Branch đích: `main`  
Production: `https://vduckie.pages.dev`

## 1. Recovery và baseline

- WIP baseline được tiếp quản: `3bc214f55fc8ae553a542ff59fc9b7f1d8a86ac1` (`WIP: Build professional HSK 3 course`).
- Tại thời điểm tiếp quản, `main` và remote cùng trỏ vào WIP trên; không có commit mới cần hợp nhất, không có force push, reset cứng hoặc rollback.
- Source Git được dùng làm nguồn sự thật. Corpus HSK3 hiện có được giữ lại; **không regenerate và không làm lại từ đầu**.
- Phần Work đã hoàn thành trước checkpoint: corpus HSK3, schema, provenance, learner runtime read-only, targeted validator/quality tests và phần lớn integration.
- Phần hoàn thiện sau checkpoint: test contract cũ, môi trường Python Playwright, browser smoke HSK3, cache bust C4, coverage ôn cách quãng 500/500, deterministic reports, learner integration report và full regression.

## 2. Nội dung HSK3 đã hoàn chỉnh

| Hạng mục | Kết quả |
|---|---:|
| Unit | 12 |
| Lesson | 36 |
| Từ vựng HSK3 mới | 500 |
| Từ vựng tích luỹ đến HSK3 | 1.000 |
| Ngữ pháp | 42 |
| Chữ Hán trọng tâm | 100 |
| Hội thoại | 36 |
| Listening transcript | 36 |
| Reading | 36 |
| Speaking task | 36 |
| Writing task | 36 |
| Exercise | 252 |
| Assessment | 15 |
| Unit checkpoint | 12 |
| Midpoint | 1 |
| Final assessment | 1 |
| Mastery review | 1 |

### 12 chủ đề unit

1. Cầu nối sang giao tiếp theo đoạn.
2. Học tập và chiến lược.
3. Tìm việc và môi trường làm việc.
4. Du lịch và sự cố.
5. Nhà ở và chuyển nhà.
6. Sức khỏe và lối sống.
7. Quan hệ và giao tiếp số.
8. Mua sắm và quyền lợi.
9. Kể chuyện và trải nghiệm.
10. Văn hóa đời sống.
11. Môi trường quanh ta.
12. Dự án tổng hợp sơ cấp.

### Mục tiêu đầu ra

- Xử lý tình huống học tập, công việc, du lịch, dịch vụ và quan hệ xã hội có nhiều bước.
- Nắm ý chính, chi tiết, trình tự và thái độ trong hội thoại/bài kể ở tốc độ chậm đến gần tự nhiên.
- Kể, mô tả và viết đoạn có trình tự, nguyên nhân, kết quả và đánh giá.
- Thực hiện nhiệm vụ nói–viết theo rubric thay vì chỉ nhận diện đáp án.
- Duy trì retrieval 1/3/7/14/30 ngày và đạt checkpoint, midpoint, final, mastery.

## 3. Editorial và coverage

- Toàn bộ 36 lesson có mục tiêu, situation, vocabulary, character, grammar, dialogue, reading, listening transcript, pronunciation, culture note, guided practice, speaking, writing, real-world task, summary và spaced review.
- Editorial sampling có phân tầng ở lesson 01, 07, 13, 19, 25, 31 và 36; đồng thời machine-assisted pass chạy trên toàn corpus.
- 500 từ chính thức dòng 501–1000 được gán đúng một lesson; không tính từ review HSK1–2 vào số 500 từ mới.
- Mỗi lesson đưa toàn bộ từ mới vào lịch retrieval; coverage cuối: `500/500`, `vocabularyIntroducedButNotPracticed: []`.
- `grammarWithoutExercise: []`, `missingSkills: []`.
- Reading có câu hỏi và evidence; listening có transcript và answer key; exercise feedback có answer/explanation hoặc rubric phù hợp loại nhiệm vụ.
- Không tăng record để làm đẹp chỉ số; số liệu corpus giữ nguyên so với WIP.

## 4. Test fail đã xử lý

### 4.1 Contract cũ

- Test: `tests/hsk-phase1-quality.test.js`.
- Lỗi: assertion khóa cứng HSK1–2 là hai course machine-assisted cuối cùng, coi HSK3 trở lên là `planned`.
- Lý do cũ: contract được viết trước Phase C4, không còn phản ánh manifest/runtime hợp lệ sau khi HSK3 được bổ sung.
- Cách sửa: cập nhật contract để HSK1, HSK2 và HSK3 đều là machine-assisted read-only; HSK4–HSK9 vẫn `planned`; toàn bộ `productionReady`, `complete` và progress write vẫn khóa.
- Không xóa assertion bảo vệ quality gate và không rollback HSK3 để chiều test cũ.

### 4.2 Hai test Python Playwright

1. `tests/hsk-phase2b4-browser-smoke.test.js` → `tests/hsk-phase2b4-browser-smoke.py`.
2. `tests/v108-developer-runtime-dom.test.js` → `tests/v108-developer-runtime-dom.py`.

Xử lý:

- Cài Python Playwright và Chromium trong GitHub Actions; không commit virtualenv/browser cache và không skip test.
- Test Phase 2B-4 phát hiện một `favicon.ico` 404 chỉ thuộc harness; wrapper tạo favicon tạm và xóa trong `finally`, vẫn giữ nguyên kiểm tra page error/request failure thật.
- Test V108 chạy lại trong môi trường đã có Playwright/Chromium và pass.

## 5. Learner-facing integration

Luồng học đã mở:

`Giáo trình HSK → HSK3 → Unit → Lesson`

Người học xem/học được:

- mục tiêu;
- từ vựng và collocation;
- chữ Hán;
- ngữ pháp, cách dùng, mẫu tự nhiên và lỗi thường gặp;
- hội thoại;
- nghe và transcript;
- đọc và evidence;
- nói;
- viết;
- exercise, feedback, answer/explanation/rubric;
- checkpoint, midpoint, final và mastery;
- ôn cách quãng;
- điều hướng trước/sau.

HSK3 không còn trạng thái “Sắp mở”. HSK1 và HSK2 vẫn hoạt động và được kiểm tra bằng flow chuyển level.

URL tự kiểm tra:

`https://vduckie.pages.dev/?area=hsk&hskLevel=3&hskLesson=hsk3-lesson-01`

Các bước: mở Giáo trình HSK → chọn HSK3 → mở Unit 1 → Lesson 1; sau đó thử lesson giữa, lesson 36, assessment và chuyển HSK3 → HSK2 → HSK1.

## 6. Browser smoke HSK3

Engine: Python Playwright + Chromium.

| Viewport | Lesson đại diện | Kết quả |
|---|---|---|
| 1440×900 | Lesson 1 | Pass |
| 1024×768 | Lesson 18 | Pass |
| 390×844 | Lesson 19 | Pass |
| 320×568 | Lesson 36 | Pass |

Các flow pass:

- first/middle/last lesson;
- vocabulary, grammar, character;
- dialogue, listening transcript, reading, speaking, writing;
- exercise answer và feedback;
- unit checkpoint, midpoint, final, mastery;
- prev/next;
- HSK3 → HSK2 → HSK1;
- reload;
- direct URL tự suy ra HSK3 từ lesson ID;
- mobile touch controls;
- không horizontal overflow vô lý;
- không HSK data/asset 4xx;
- button mobile đạt ngưỡng touch target được test;
- chữ Trung hiển thị ở ngưỡng font tối thiểu được test.

Runtime cache key được tăng từ `c3web1` lên `c4web1` để production không giữ bundle HSK2 cũ.

## 7. Quality gate cuối

- JavaScript syntax: pass.
- Schema/content validator: pass.
- Repository validation: `2942` records, `18` sources, `9` schemas, `0` error, `0` warning.
- Duplicate checker: `0` blocker.
- HSK3 exact duplicate: `0`.
- HSK3 normalized duplicate: `0`.
- HSK3 semantic duplicate: `0`.
- Repository có `1` exact duplicate intentional thuộc spaced-review fixture, được ghi reason; không giả vờ duplicate toàn repo bằng 0.
- Coverage: pass; HSK3 source coverage `1.0`, không thiếu skill, không thiếu vocabulary practice, không thiếu grammar exercise.
- Provenance: pass; official rows 501–1000, snapshot URL/hash/pages, learner-facing prose do VDuckie biên soạn mới; không lưu sample test, answer key, audio hoặc nội dung giáo trình thương mại.
- Deterministic reports: pass và đã commit.
- Browser smoke: pass.
- Full regression: **385/385 pass; 0 fail; 0 skip**.
- `git diff --check`: pass.
- Blocking defect: không còn.

Trạng thái editorial vẫn được ghi trung thực là `machine-assisted`; cần human signoff độc lập trước khi mở production quality gate.

## 8. Production safety

Giữ nguyên:

- `HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED=false`.
- `writesProgress=false`.
- learner runtime read-only.
- production curriculum gate locked.
- public override không được phép.

Không thực hiện:

- Supabase migration;
- user-data/progress migration;
- ghi progress thật;
- telemetry/control plane;
- Developer Tool mới;
- mascot/animation;
- ERP;
- HSK4.

## 9. File tạo/sửa sau WIP

### Tạo mới

- `tests/hsk3-learner-browser-smoke.py`
- `tests/hsk3-learner-browser-smoke.test.js`
- `tests/hsk3-c4-spaced-review-coverage.test.js`
- `reports/hsk3-c4-learner-integration.json`
- `docs/hsk-phase-c4-handoff.md`

### Sửa

- `tests/hsk-phase1-quality.test.js`
- `tests/hsk-phase2b4-browser-smoke.test.js`
- `assets/hsk-content/hsk-content-feature-flags.js`
- `scripts/hsk-coverage-engine.js`
- `scripts/build-hsk3-c4.js`
- `data/hsk/hsk3/lessons.json`
- `data/hsk/hsk3/editorial-c4.json`
- `reports/hsk-quality-report.json`
- `reports/hsk-coverage-report.json`
- `reports/hsk-duplication-report.json`
- `reports/hsk-source-report.json`

Workflow `.github/workflows/hsk-content-quality.yml` chỉ được dùng tạm để chạy/ghi deterministic output trong nhánh kiểm thử, sau đó đã khôi phục đúng cấu hình read-only ban đầu; final diff không giữ quyền ghi tạm.

## 10. Issue còn lại và milestone kế tiếp

Không còn lỗi kỹ thuật chặn C4 learner read-only. Các việc còn lại là gate phát hành nội dung:

- human Vietnamese editorial signoff;
- human Chinese-pedagogy signoff;
- audio ghi âm/xác minh;
- stroke-order asset xác minh.

**Kết luận:** Phase C4 hoàn thành ở phạm vi Professional HSK3 Curriculum và learner-facing read-only. Điều kiện kỹ thuật để chuyển sang milestone tiếp theo đã đủ, nhưng không bắt đầu trong commit này.

Milestone tiếp theo chính xác: **C5 — HSK4 Professional Curriculum**.
