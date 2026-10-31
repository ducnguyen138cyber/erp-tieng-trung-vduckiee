# Curriculum audit and implementation — 2026-10-31

Baseline: main a229f849f1f2123c0d66c0767b34eaf1bde713cb.

## Observed before implementation

- Production was inspected with a real browser, including catalogue, lesson overview and vocabulary step. The user's curriculum screenshot was inspected too.
- At a 1348px browser viewport the old catalogue was 1058px wide with columns of 331px and 667px, and a fixed height of 810px. `daily-learning-v2.css` reserves the left column for a short introduction, pins the future roadmap to its bottom, and makes that roadmap a flex row. These rules explain both the empty column and the narrow wrapped text in the screenshot.
- `VDuckieMSUTONG` has exactly 10 original companion lessons for Beginner 1: 60 vocabulary occurrences, 20 grammar records, two dialogue turns per lesson and three quiz checks. A lesson is rendered as 14 serial steps including its result. No higher MSUTONG book has usable lesson data in this route; the later books are roadmap copy only.
- The separate HSK supplement contains 24/28/36/48/60/72 lesson records across HSK1–6 (268 total). Its professional runtime is explicitly read-only, with locked progress/migration gates. It is kept separate, and those gates are not changed or represented as approved complete curricula.
- Old MSUTONG sessions replace the entire panel on each step, cannot navigate via a table of contents, reset the step on reopening, and only save completion after 2/3 answers. Back navigation resets `answered` but not `score`, allowing the same answer to increment the score again.
- Daily Learning persists under `vduckie-daily-learning-v1` and the existing Supabase `user_words` system row `__vduckie_daily_learning_v1__`. Its previous remote merge takes the entire newer snapshot, so independent completions can be overwritten.
- The old MSUTONG completion path does not call the EXP/weekly mission RPCs. The old review route only selects ERP terms. New curriculum lessons must join both flows explicitly.

## Implemented scope

- 20 original self-study lessons, in two real beginner books. The existing ten `b1-u*` identities and completions are retained; ten new `b2-u*` lessons cover schedules, shopping, appointments, ongoing/completed actions, travel, comparison, health vocabulary, clarifying work requests and experiences/plans.
- 120 vocabulary occurrences (119 unique forms), 40 grammar records, 160 content-linked checks, original dialogues, reading passages, pronunciation guidance, common errors and speaking/writing prompts. New material is not a digital reproduction of MSUTONG Book 2. No human expert-review claim is made.
- Catalogue has a compact book/progress/resume header, chapter groups, local accent-insensitive search, status filters and clear progress states. No future-book placeholder panels or oversized introduction column.
- Lessons have six navigable sections. Only the section body is replaced on an explicit section change; search keeps focus, pinyin toggles without rerendering, and text inputs save without remounting.
- Section/answer ledgers, drafts, cursor and review dates use the existing daily-learning snapshot and cloud row. Independent completions/sections merge; a new quiz attempt cannot resurrect older answers.
- Completion requires six confirmed sections, all eight checks answered and at least 6/8 correct. Speaking and free writing use an explicit self-check rubric, not fabricated automated scoring. Existing legacy completions remain visible.
- Real new completion requests fixed server-side `lesson_complete` and `quiz_pass` awards with stable `hsk:curriculum_<lesson>:...` sources. The backend deduplicates. Guest/offline results stay pending for a later authenticated retry.
- Curriculum recall has its own due queue in the shared snapshot; actual reviews also publish to existing SRS/evidence so weekly word-review tasks can update. ERP review remains available.
- No changes to the homepage layout, static VDuckie images, HSK canonical gates or Evolution visibility.

## Validation

See `tests/curriculum.test.js` for content integrity, scoring/completion gates and merge behavior.
`tests/curriculum-browser.mjs` exercises the complete app at 1440, 1024, 390 and 320px, including search, filters, books, sections, reload/resume, scoring, completion, EXP request contract, review linkage and overflow. Supabase is mocked in CI; this does not prove live Google OAuth.


Browser checks passed on the preview with real Chromium at 1440/1024/390/320px.
The 1440px authenticated-fixture and 390px guest runs completed the full lesson,
including 8/8 explained answers, reload/resume, legacy completion preservation,
stale cloud draft rejection, and SRS review. Observed maximum navigation times
were 114ms and 120ms in CI (not a device performance guarantee).
The existing twelve guest/authenticated-fixture sidebar click scenarios also passed.
71 targeted Node tests passed locally, including ERP vocabulary, HSK migration
locks, account sync, cache and curriculum contracts. CI runs 49 of those tests.
Live Google OAuth and a live authenticated curriculum award are not claimed by
these fixtures. No schema, RLS or auth provider configuration is changed here.
