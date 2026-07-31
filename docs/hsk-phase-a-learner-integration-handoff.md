# Bàn giao Phase A — HSK1 learner-facing integration

## Trạng thái
- Baseline: `8b1b4d92d73c7d9b141b2e9bde810e02f783bd21` — `Polish professional HSK 1 editorial content`.
- HSK1 C2 được kết nối vào module `Giáo trình HSK` theo chế độ learner-facing **read-only**.
- Không sửa curriculum C2.
- HSK2–9 vẫn khóa/Sắp mở.

## Người học test được
- 10 unit / 24 lesson theo đúng curriculum C2.
- Vocabulary canonical + support-only, grammar, character, dialogue, reading, listening transcript/TTS fallback, pronunciation, speaking, writing, review.
- 120 exercise: nhập/chọn đáp án, xem đúng/sai và giải thích; speaking/writing mở dùng rubric tự đối chiếu.
- 10 checkpoint + midpoint + final + mastery review.
- Chuyển bài trước/sau và deep-link lesson/assessment bằng query string.

## Safety
- `HSK_CURRICULUM_V2_ENABLED=false` giữ nguyên.
- learner runtime dùng flag riêng `HSK_CURRICULUM_V2_LEARNER_READONLY_ENABLED=true`.
- `publicOverrideAllowed=false`, progress writes=false, quality gate=locked.
- Không Supabase migration, không user-data migration.
- TTS chỉ là fallback cho transcript; không tuyên bố audio đã verified.

## Browser smoke
- Desktop Chromium viewport 1440×1000.
- Mobile Chromium viewport 390×844.
- Kiểm 10 unit, 24 lesson, 13 assessment, deep link, prev/next, một exercise có đáp án, final assessment, mobile horizontal overflow và kích thước control.
- Evidence: `reports/hsk-phase-a-learner-integration.json` + workflow artifact screenshots.

## URL test sau deploy
- `https://vduckie.pages.dev/?area=hsk`
- `https://vduckie.pages.dev/?area=hsk&hskLesson=hsk1-lesson-01`
- `https://vduckie.pages.dev/?area=hsk&hskAssessment=hsk1-assessment-final`

## Bước tiếp theo
Phase C3 — HSK2 Professional Curriculum. Không quay lại C2 trừ bug integration/content thực tế. HSK2 phải hoàn thiện curriculum + editorial gate, sau đó kết nối web read-only và smoke desktop/mobile trước khi sang HSK3.
