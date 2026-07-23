# HSK Source Registry — Phase 0

- Access date: **2026-07-23**
- Canonical proficiency standard: **GF0025-2021**
- Exam blueprint track: **Chinese Test Service HSK3.0 resources current at the access date**

## Version decision

VDuckie will use GF0025-2021 as the normative proficiency framework and the current Chinese Test Service HSK3.0 syllabus/competency/sample materials as the exam-blueprint track. The two are related but not interchangeable: the national proficiency standard defines the three-stage, nine-level construct; CTI materials define current examination implementation.

The 2026 official calendar still lists HSK 1–6 separately and HSK 7–9 as a combined advanced examination. Therefore, records must carry `syllabusVersion` and, where exam alignment matters, `examBlueprintVersion`. Legacy HSK 2.0 content must be tagged legacy rather than silently merged.

For HSK 7–9, official vocabulary remains a combined `7-9` band. VDuckie may create pedagogic target levels 7, 8 and 9 with progressively stronger rubrics, but must never claim those are official separate vocabulary lists.

## Registry

### `moe-gf0025-2021-standard` — 《国际中文教育中文水平等级标准》GF0025-2021

- Publisher: 中华人民共和国教育部、国家语言文字工作委员会
- Type / trust: `official-standard` / `authoritative`
- Levels: 1, 2, 3, 4, 5, 6, 7, 8, 9
- Scope: proficiency-levels, communication, topics, syllables, hanzi, vocabulary, grammar, listening, speaking, reading, writing, translation
- Accessed: 2026-07-23
- URL: https://www.moe.gov.cn/jyb_sjzl/ziliao/A19/202111/t20211118_580755.html
- Copyright/license note: Dùng làm căn cứ chuẩn và trích dẫn ngắn. Không sao chép toàn văn PDF hoặc tái phát hành danh mục nguyên văn nếu chưa xác minh quyền tái sử dụng. Nội dung bài học phải tự biên soạn.

### `moe-gf0025-2021-qa` — 教育部中外语言交流合作中心负责人就《国际中文教育中文水平等级标准》答记者问

- Publisher: 中华人民共和国教育部
- Type / trust: `official-explanation` / `authoritative`
- Levels: 1, 2, 3, 4, 5, 6, 7, 8, 9
- Scope: version-history, quantitative-totals, implementation-scope, skill-framework
- Accessed: 2026-07-23
- URL: https://www.moe.gov.cn/jyb_xwfb/s271/202104/t20210402_524194.html
- Copyright/license note: Dùng để xác minh phạm vi, tổng số 1110 âm tiết, 3000 chữ Hán, 11092 từ và 572 mục ngữ pháp; không thay thế danh mục cấp độ chi tiết.

### `cti-hsk3-current-syllabus-2026` — HSK3.0 — Examination Syllabus, Sample Questions and Competency Profile

- Publisher: Chinese Testing International / Chinese Test Service
- Type / trust: `official-exam-syllabus` / `authoritative-current`
- Levels: 1, 2, 3, 4, 5, 6, 7-9
- Scope: tasks, topics, vocabulary, hanzi, grammar, sample-blueprints, competency-profile
- Accessed: 2026-07-23
- URL: https://www.chinesetest.cn/syllabus
- Copyright/license note: Chỉ dùng blueprint, yêu cầu năng lực và mục lục công khai. Không sao chép nguyên đề mẫu, audio hoặc đáp án. Mọi exercise của VDuckie phải tự biên soạn.

### `cti-hsk79-first-test-2022` — HSK（七—九级）全球首考通知

- Publisher: 汉考国际 / Chinese Testing International
- Type / trust: `official-announcement` / `authoritative`
- Levels: 7-9
- Scope: hsk7-9-exam-status, combined-advanced-exam
- Accessed: 2026-07-23
- URL: https://admin.chinesetest.cn/gonewcontent.do?id=46783143
- Copyright/license note: Dùng để xác minh HSK 7–9 là một kỳ thi nâng cao chung và đã tổ chức toàn cầu từ 2022; không dùng làm nguồn nội dung bài học.

### `cti-test-calendar-2026` — 2026 Chinese Test Calendar

- Publisher: Chinese Testing International / Chinese Test Service
- Type / trust: `official-current-status` / `authoritative-current`
- Levels: 1, 2, 3, 4, 5, 6, 7-9
- Scope: current-exam-implementation, hsk1-6-calendar, hsk7-9-calendar
- Accessed: 2026-07-23
- URL: https://admin.chinesetest.cn/gonewcontent.do?id=48998697
- Copyright/license note: Dùng để ghi nhận trạng thái triển khai kỳ thi năm 2026; lịch có thể thay đổi nên phải kiểm tra lại trước mỗi release lớn.

### `cc-cedict-current` — CC-CEDICT

- Publisher: CC-CEDICT editor community / MDBG
- Type / trust: `supplemental-dictionary` / `supplemental`
- Levels: cross-level supplemental
- Scope: pinyin-cross-check, english-gloss-cross-check, part-of-speech-cross-check
- Accessed: 2026-07-23
- URL: https://cc-cedict.org/wiki/
- Copyright/license note: CC BY-SA 3.0. Nếu phân phối dữ liệu phái sinh phải giữ attribution và kiểm tra nghĩa vụ ShareAlike. Không dùng để gán cấp HSK.

### `unicode-unihan-17` — Unicode Standard Annex #38 — Unicode Han Database (Unihan)

- Publisher: Unicode Consortium
- Type / trust: `supplemental-character-data` / `authoritative-technical`
- Levels: cross-level supplemental
- Scope: character-codepoint, radical-stroke-index, variant-cross-check
- Accessed: 2026-07-23
- URL: https://www.unicode.org/reports/tr38/
- Copyright/license note: Dùng theo Unicode Terms of Use; không dùng làm nguồn thứ tự nét hoặc cấp HSK.

### `legacy-ivankra-hsk30` — ivankra/hsk30 cleaned HSK 3.0 vocabulary

- Publisher: ivankra (GitHub)
- Type / trust: `legacy-derived-dataset` / `supplemental-needs-verification`
- Levels: 1, 2, 3, 4, 5, 6, 7-9
- Scope: legacy-v79-vocabulary, pinyin, pos, variants
- Accessed: 2026-07-23
- URL: https://github.com/ivankra/hsk30
- Copyright/license note: Repository declares MIT for code/data but data is derived from official/third-party sources; provenance and redistribution status require legal review. Không dùng làm nguồn duy nhất.

### `legacy-cvdict` — CVDICT Chinese–Vietnamese dictionary

- Publisher: Phong Phan
- Type / trust: `legacy-derived-dataset` / `supplemental-needs-human-review`
- Levels: cross-level supplemental
- Scope: legacy-v79-vietnamese-gloss
- Accessed: 2026-07-23
- URL: https://github.com/ph0ngp/CVDICT
- Copyright/license note: CC BY-SA 4.0. README nói phần lớn bản dịch được AI hỗ trợ và có thể còn lỗi; bắt buộc kiểm định thủ công trước production.

## Copyright operating rule

- Official standards and sample materials are used for alignment and short attribution only.
- Dialogues, readings, examples, questions, distractors, transcripts and assessments must be newly authored by VDuckie.
- No paid textbook, answer key, proprietary audio or full sample test is copied.
- Supplemental dictionary data cannot determine HSK level by itself.
- Every production record must reference one or more registry IDs through `sourceIds`.
