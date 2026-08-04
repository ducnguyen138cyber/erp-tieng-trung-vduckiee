# Bàn giao Phase C5 — HSK4 Professional Curriculum

Ngày hoàn tất: 03/08/2026  
Repository: `ducnguyen138cyber/erp-tieng-trung-vduckiee`  
Branch đích: `main`  
Baseline: `2480a1762b63502633f524a0e0869587d537f4ab`

## Phạm vi hoàn thành

Phase C5 bổ sung duy nhất HSK4, không regenerate HSK1–HSK3 và không bắt đầu HSK5.

| Hạng mục | Kết quả |
|---|---:|
| Unit | 16 |
| Lesson | 48 |
| Từ mới HSK4 | 1.000 |
| Từ tích luỹ | 2.000 |
| Ngữ pháp | 76 |
| Chữ Hán trọng tâm | 150 |
| Exercise | 384 |
| Assessment | 20 |
| Unit checkpoint | 16 |

Mỗi lesson có objective, vocabulary, character, grammar, dialogue, listening, reading, pronunciation, culture note, speaking, writing, exercise, answer/explanation, real-life task, spaced review và self review.

## Điểm nâng cấp so với HSK3

- Collocation và khung kết hợp theo ngữ cảnh.
- Register, sắc thái và ghi chú khẩu ngữ–văn viết.
- Discourse marker, bằng chứng và chiến lược đọc/nghe.
- Từ gần nghĩa, từ dễ nhầm và lỗi thường gặp của người Việt.
- Speaking rubric, authentic writing và nhiệm vụ đời thực.
- 48 lesson có tiêu đề, tình huống, hội thoại, listening, reading, speaking, writing và real-life task riêng.
- 1.000 ví dụ từ vựng riêng; 384 prompt exercise riêng.

## Dữ liệu và provenance

- Membership HSK4 bám band hiện hành 2026, dòng 1001–2000.
- Pinyin chính thức được giữ làm nguồn sự thật; công cụ chỉ hỗ trợ tách âm tiết, không tự đổi cách đọc đa âm.
- 150 stroke count có nguồn xác minh: vector bundled hoặc Unicode Unihan 17 `kTotalStrokes`.
- Không tuyên bố stroke order khi chưa có vector xác minh.
- Nội dung learner-facing do VDuckie biên soạn mới; không sao chép giáo trình thương mại.

## Website

Luồng learner-facing:

`Giáo trình HSK → HSK4 → Unit → Lesson`

URL kiểm tra:

`https://vduckie.pages.dev/?area=hsk&hskLevel=4&hskLesson=hsk4-lesson-01`

HSK1–HSK3 tiếp tục hoạt động. Runtime cache key tăng lên `c5web1`.

## Quality gate

- Validator: 5.144 record, 20 source, 9 schema, 0 error, 0 warning.
- Duplicate: 0 blocker; một exact duplicate intentional thuộc fixture HSK1 cũ.
- Coverage: không thiếu skill, vocabulary practice hoặc grammar exercise.
- Browser smoke: pass ở 1440×900, 1024×768, 390×844 và 320×568.
- Full regression: 397/397 pass.
- `git diff --check`: pass.

## Production safety

Giữ nguyên:

- `HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED=false`
- `writesProgress=false`
- `productionEnabled=false`
- `qualityGate=locked`
- không Supabase write, user write hoặc migration.

Trạng thái nội dung vẫn là `machine-assisted`; cần human signoff độc lập trước khi mở quality gate sản xuất.

Milestone tiếp theo: **C6 — HSK5 Professional Curriculum**, chưa bắt đầu trong phase này.
